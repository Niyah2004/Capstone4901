import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from "../firebaseConfig";
import { Alert } from "react-native";
import { Modal, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, onSnapshot, orderBy, getDoc, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AVATARS } from "../data/avatars";
import { useSelectedChild } from "../SelectedChildContext";
import { useTheme } from "../theme/ThemeContext";

const REWARD_ICON_MAP = {
  gift:      require('../assets/Gifts.png'),
  gamenight: require('../assets/Gamenight.png'),
  movie:     require('../assets/Movienight.png'),
  treat:     require('../assets/SweetTreats.png'),
  outside:   require('../assets/outside.png'),
};

// Character roster - starters are free, others unlock at milestone thresholds
const CHARACTER_ROSTER = [
    { id: "panda", name: "Panda", emoji: "🐼", milestone: 0, image: require("../assets/panda.png") },
    { id: "turtle", name: "Turtle", emoji: "🐢", milestone: 200, image: require("../assets/turtle.png") },
    { id: "dino", name: "Dino", emoji: "🦒", milestone: 350, image: require("../assets/dino.png") },
    { id: "lion", name: "Lion", emoji: "🦁", milestone: 500, image: require("../assets/lion.png") },
    { id: "penguin", name: "Penguin", emoji: "🐧", milestone: 750, image: require("../assets/penguin.png") },
];

const STARTER_IDS = CHARACTER_ROSTER.filter(c => c.milestone === 0).map(c => c.id);

const STAR_SIZES = [20, 28, 22, 32, 22, 28, 20];

function AnimatedStar({ delay, size = 24 }) {
    const scale = useRef(new Animated.Value(1)).current;
    const rotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1.5, duration: 400, delay, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: 20, duration: 400, delay, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: -20, duration: 400, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
                    Animated.timing(rotation, { toValue: 0, duration: 200, useNativeDriver: true }),
                ]),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const spin = rotation.interpolate({
        inputRange: [-20, 0, 20],
        outputRange: ['-20deg', '0deg', '20deg'],
    });

    return (
        <Animated.View style={{ transform: [{ scale }, { rotate: spin }] }}>
            <Ionicons name="star" size={size} color="#FFD700" />
        </Animated.View>
    );
}

export default function ChildReward( {route}) {
    const auth = getAuth();
    const parentId = auth.currentUser?.uid;
    const [totalStars, setTotalStars] = useState(0);
    const [rewards, setRewards] = useState([]);
    const [claimedRewardIds, setClaimedRewardIds] = useState(new Set());
    const [selectedReward, setSelectedReward] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [childName, setChildName] = useState("Lea");
    const [avatar, setAvatar] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(true);
    const confettiRef = useRef(null);
    const [showConfetti, setShowConfetti] = useState(false);
    // Character unlock state
    const [characterModalVisible, setCharacterModalVisible] = useState(false);
    const [lifetimeStars, setLifetimeStars] = useState(0);
    const [unlockedAvatars, setUnlockedAvatars] = useState([...STARTER_IDS]);
    const [childDocId, setChildDocId] = useState(null);
    const [wardrobe, setWardrobe] = useState({});
    
    const { selectedChildId } = useSelectedChild();
    const activeChildId = route?.params?.childId || selectedChildId;

    //theme
    const { theme } = useTheme();
    const colors = theme.colors;    
    const styles = createStyles(colors);

    // Fetch rewards in real-time (instant updates!)
    useEffect(() => {
        if (!parentId) return;

        const q = query(
            collection(db, "rewards"),
            where("parentId", "==", parentId)
            // orderBy("createdAt", "desc") temporarily disabled - needs Firebase index
        );

        const gradientPresets = [
            ["#FF9A9E", "#FAD0C4"],
            ["#A1C4FD", "#C2E9FB"],
            ["#FBC2EB", "#A6C1EE"],
            ["#FFDEE9", "#B5FFFC"],
            ["#FBD786", "#f7797d"],
            ["#84FAB0", "#8FD3F4"],
        ];

        // Real-time listener - updates instantly when parent creates rewards!
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const rewardList = querySnapshot.docs.map((doc, index) => ({
                id: doc.id,
                title: doc.data().name || "Unnamed Reward",
                cost: doc.data().points || 0,
                description: doc.data().description || "",
                gradient: gradientPresets[index % gradientPresets.length],
                parentId: doc.data().parentId || null,
                image: doc.data().image || null,
            }));
            setRewards(rewardList);
        }, (error) => {
            console.error("Error fetching rewards: ", error);
        });

        return () => unsubscribe();
    }, [parentId]);

    // Track which rewards the child has already claimed (pending or fulfilled)
    useEffect(() => {
        if (!activeChildId) return;
        const claimsQ = query(
         collection(db, "claims"),
         where("childId", "==", activeChildId),
         where("status", "==", "claimed")
);
        const unsubClaims = onSnapshot(claimsQ, (snap) => {
            const ids = new Set(snap.docs.map(d => d.data().item_id));
            setClaimedRewardIds(ids);
        });
        return () => unsubClaims();
    }, [activeChildId]);

    // Fetch child's stars from childPoints collection (current balance + lifetime total)
    useEffect(() => {
        if (!activeChildId) return;

        const childPointsRef = doc(db, "childPoints", activeChildId);
        const unsubscribe = onSnapshot(childPointsRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const points = data.points ?? data.stars ?? data.totalPoints ?? 0;
                setTotalStars(points);
                // totalPoints only goes up (incremented when parent awards stars) - use as lifetime counter
                const lifetime = data.totalPoints ?? data.points ?? 0;
                setLifetimeStars(lifetime);
            } else {
                setTotalStars(0);
                setLifetimeStars(0);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch child's profile (name, avatar, and unlocked characters)
useEffect(() => {
  const fetchChildProfile = async () => {
    if (!activeChildId) {
      setAvatarLoading(false);
      return;
    }

    try {
      const childRef = doc(db, "children", activeChildId);
      const childSnap = await getDoc(childRef);

      if (childSnap.exists()) {
        const data = childSnap.data();

        setChildDocId(childSnap.id);
        setChildName(data.preferredName || data.fullName || "Lea");

        const avatarData = data.avatar;
        const avatarBase =
          typeof avatarData === "string"
            ? avatarData
            : avatarData?.base ?? "panda";

        const validAvatar = AVATARS[avatarBase] ? avatarBase : "panda";
        setAvatar(validAvatar);
        setWardrobe(data.wardrobe || {});

        const saved = data.unlockedAvatars || [];
        const merged = [...new Set([...STARTER_IDS, ...saved])];
        setUnlockedAvatars(merged);
      }

      setAvatarLoading(false);
    } catch (error) {
      console.error("Error fetching child profile:", error);
      setAvatarLoading(false);
    }
  };

  fetchChildProfile();
}, [activeChildId]);

    // Check milestones and unlock new characters when modal opens
    const checkAndUnlockCharacters = async () => {
        if (!childDocId) return;

        const newUnlocks = CHARACTER_ROSTER
            .filter(c => c.milestone > 0 && lifetimeStars >= c.milestone && !unlockedAvatars.includes(c.id))
            .map(c => c.id);

        if (newUnlocks.length > 0) {
            const updated = [...unlockedAvatars, ...newUnlocks];
            setUnlockedAvatars(updated);
            try {
                const childRef = doc(db, "children", childDocId);
                await updateDoc(childRef, { unlockedAvatars: updated });
            } catch (error) {
                console.warn("Could not save unlocked avatars:", error);
            }
            // Let the child know they unlocked something new!
            const names = newUnlocks.map(id => CHARACTER_ROSTER.find(c => c.id === id)?.name).join(", ");
            Alert.alert("New Character Unlocked! 🎉", `You unlocked: ${names}!`);
        }
    };

    // Open the character selection modal
    const openCharacterModal = async () => {
        await checkAndUnlockCharacters();
        setCharacterModalVisible(true);
    };

    // Switch active avatar
    const handleSwitchAvatar = async (characterId) => {
        if (!childDocId || !unlockedAvatars.includes(characterId)) return;

        setAvatar(characterId);
        try {
            const childRef = doc(db, "children", childDocId);
            await updateDoc(childRef, { avatar: characterId });
        } catch (error) {
            console.error("Error switching avatar:", error);
            Alert.alert("Error", "Could not switch character. Try again.");
        }
    };

    const handleClaimReward = async () => {
        if (!selectedReward || !auth.currentUser) return;

        // Check if child has enough stars
        if (totalStars < selectedReward.cost) {
            Alert.alert("Not Enough Stars", `You need ${selectedReward.cost - totalStars} more stars to claim this reward.`);
            return;
        }
        setShowConfetti(true);
        requestAnimationFrame(() => confettiRef.current?.start());
        setTimeout(() => setShowConfetti(false), 1800);

        try {
            // Update childPoints collection
            const childPointsRef = doc(db, "childPoints", activeChildId);
            await updateDoc(childPointsRef, {
                points: increment(-selectedReward.cost),
            });

            // Record the claim (note: may need Firebase security rules updated)
            try {
                await addDoc(collection(db, "claims"), {
                    item_id: selectedReward.id,
                    rewardName: selectedReward.title,
                    cost: selectedReward.cost,
                    status: "claimed",
                    user_id: auth.currentUser.uid,
                    parentId: selectedReward.parentId || auth.currentUser.uid,
                    childId: activeChildId,
                    claimedAt: new Date(),
                });
            } catch (claimError) {
                // Claim recording failed but stars were deducted - log but don't block
                console.warn("Could not record claim (check Firebase security rules):", claimError);
            }

            Alert.alert("Success! 🎉", `You claimed: ${selectedReward.title}`);
            console.log("Reward claimed: ", selectedReward.title);
        }
        catch (error) {
            console.error("Error claiming reward: ", error);
            Alert.alert("Error", "Something went wrong while claiming the reward.");
        }
        finally {
            // Close modal after a delay so confetti is visible
            setTimeout(() => setModalVisible(false), 2500);
        }
    };
    // Handle wardrobe item purchase from reward screen
    const handleWardrobePurchase = async (category, itemId, itemCost) => {
        if (!childDocId || !auth.currentUser) return;

        const childRef = doc(db, "children", childDocId);
        const pointsRef = doc(db, "childPoints", auth.currentUser.uid);

        const owned = wardrobe?.[avatar]?.[category]?.[itemId]?.unlocked ?? false;
        if (owned) {
            Alert.alert("Already Owned", "You already own this item!");
            return;
        }

        if (totalStars < itemCost) {
            Alert.alert("Not Enough Stars", `You need ${itemCost - totalStars} more ⭐ to unlock this item!`);
            return;
        }

        Alert.alert(
            "Purchase Item?",
            `Spend ${itemCost} ⭐ to unlock this item?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Buy",
                    onPress: async () => {
                        const updates = {};
                        updates[`wardrobe.${avatar}.${category}.${itemId}`] = {
                            unlocked: true,
                            equipped: false,
                        };
                        await updateDoc(childRef, updates);
                        await updateDoc(pointsRef, { points: totalStars - itemCost });

                        setWardrobe(prev => ({
                            ...prev,
                            [avatar]: {
                                ...prev?.[avatar],
                                [category]: {
                                    ...prev?.[avatar]?.[category],
                                    [itemId]: { unlocked: true, equipped: false },
                                },
                            },
                        }));

                        confettiRef.current?.start();
                        Alert.alert("Unlocked! 🎉", `You unlocked: ${itemId}!`);
                    },
                },
            ]
        );
    };
    // End of handleClaimReward

    return (
        <ScrollView>
        <View style={styles.container}>
            <ScrollView style={styles.ScrollView}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                         {showConfetti && (
                            <View pointerEvents="none" style={styles.confettiLayer}>        
                                <ConfettiCannon
                                    ref={confettiRef}
                                    count={200}
                                    origin={{ x: 50, y: 10 }}
                                    explosionSpeed={450}
                                    fallSpeed={2500}
                                    autoStart={false}
                                    fadeOut={true}
                                    colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']}
                                />
                            </View>
                         )}
                        <Text style={styles.modalTitle}>{selectedReward?.title}</Text>

                        <View style={styles.modalImagePlaceholder}>
                            <Text style={styles.modalImageText}>🎁</Text>
                        </View>

                        <Text style={styles.modalDesc}>
                            {selectedReward?.description || "No description provided."}
                        </Text>
                        <Text style={styles.modalPoints}>
                            {selectedReward?.cost} <Ionicons name="star" style={{ color: "#ffd700", fontSize: 18 }} /> 
                        </Text>

                        <View style={styles.popupButtonRow}>
                            {/*claim button */}
                            <TouchableOpacity
                                style={styles.modalClaimButton}

                                onPress={handleClaimReward}
                            //setModalVisible(false)}
                            //make it update the firebase
                            >
                                <Text style={styles.modalClaimText}>Claim</Text>
                            </TouchableOpacity>
                        
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>

                         </View>   
                    </View>
                </View>
            </Modal>

            {/* Character Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={characterModalVisible}
                onRequestClose={() => setCharacterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { width: "90%" }]}>
                        <Text style={styles.modalTitle}>Choose Your Character</Text>
                        <Text style={styles.charModalSubtitle}>
                            Earn more stars to unlock new characters!
                        </Text>

                        <View style={styles.characterGrid}>
                            {CHARACTER_ROSTER.map((character) => {
                                const isUnlocked = unlockedAvatars.includes(character.id);
                                const isActive = avatar === character.id;

                                return (
                                    <TouchableOpacity
                                        key={character.id}
                                        style={[
                                            styles.characterCard,
                                            isActive && styles.characterCardActive,
                                            !isUnlocked && styles.characterCardLocked,
                                        ]}
                                        onPress={() => {
                                            if (isUnlocked) handleSwitchAvatar(character.id);
                                        }}
                                        disabled={!isUnlocked}
                                    >
                                        {character.image ? (
                                            <Image source={character.image} style={styles.characterImage} />
                                        ) : (
                                            <Text style={styles.characterEmoji}>{character.emoji}</Text>
                                        )}

                                        <Text style={[
                                            styles.characterName,
                                            !isUnlocked && { color: "#aaa" }
                                        ]}>
                                            {character.name}
                                        </Text>

                                        {!isUnlocked && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={12} color="#fff" />
                                                <Text style={styles.lockBadgeText}>{character.milestone} <Ionicons name="star" style={{ color: "#ffd700", fontSize: 10 }} /></Text>
                                            </View>
                                        )}

                                        {isActive && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeBadgeText}>Active</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCloseButton, { marginTop: 16 }]}
                            onPress={() => setCharacterModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Text style={styles.title}>Rewards</Text>
            
                <LinearGradient
                colors={["#4CAF50", "#4CAF50"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.greetingBanner}
            >
                <Text style={styles.greetingTitle}>Amazing job, {childName}! Keep building those Habits!</Text>
            </LinearGradient>
            
                <View style={styles.avatarContainer}>
                    {/* Avatar Image - show selected avatar only when loaded */}
                    {!avatarLoading && avatar ? (
                        <Image
                                source={AVATARS[avatar]?.base || require("../assets/panda.png")}
                                style={styles.avatar}

                            />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: "#f0f0f0" }]} />
                    )}
                
                <View style={styles.pointsRow}>
                    <Text style={styles.pointsNumber}>{totalStars}</Text>    
                    <Ionicons name="star" size={25} color="#ffd700" />
                </View>


            </View>


            <Text style={styles.unlockTitle}>Unlock More Items</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unlockItemsRow}>
                {Object.entries(AVATARS[avatar] || AVATARS["panda"]).map(([category, items]) => {
                    if (category === "base") return null;
                    return Object.entries(items).map(([itemId, item]) => {
                        const owned = wardrobe?.[avatar]?.[category]?.[itemId]?.unlocked ?? false;
                        return (
                            <TouchableOpacity
                                key={`${category}-${itemId}`}
                                style={styles.unlockItemCard}
                                onPress={() => handleWardrobePurchase(category, itemId, item.cost)}
                            >
                                <View style={styles.unlockItemImageWrap}>
                                    <Image source={item.image} style={styles.unlockItemImage} resizeMode="contain" />
                                    {!owned && (
                                        <View style={styles.unlockItemOverlay}>
                                            <Ionicons name="lock-closed" size={18} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.costRow}>
                                    <Text style={styles.unlockItemCost}>{item.cost}</Text>
                                    <Ionicons name="star" size={16} color="#ffd700" />
                                </View>

                                <Text style={styles.unlockItemLabel}>{itemId}</Text>
                            </TouchableOpacity>
                        );
                    });
                })}
            </ScrollView>

            <View style={styles.heartsRow}>
                {STAR_SIZES.map((size, i) => (
                    <AnimatedStar key={i} delay={i * 150} size={size} />
                ))}
            </View>

            <TouchableOpacity style={styles.characterButton} onPress={openCharacterModal}>
                <Text style={styles.characterButtonText}>Get different Character →</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Available Rewards</Text>

            {rewards.filter(r => !claimedRewardIds.has(r.id)).length === 0 && (
                <Text style={{ textAlign: "center", color: "#999", marginVertical: 16, fontSize: 14 }}>
                    No rewards yet. Ask your parent to create some!
                </Text>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsScrollContainer}>
                {rewards.filter(r => !claimedRewardIds.has(r.id)).map((reward) => (
                    <LinearGradient
                        key={reward.id}
                        colors={reward.gradient || ["#FF9966", "#FF5E62"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rewardCard}
                    >
                        <View>

                            <View style={styles.rewardIconPlaceholder}>
                                {REWARD_ICON_MAP[reward.image]
                                  ? <Image source={REWARD_ICON_MAP[reward.image]} style={styles.rewardIconImage} resizeMode="contain" />
                                  : <Text style={styles.placeholderText}>🎁</Text>
                                }
                            </View>

                            <Text style={styles.rewardTitle} numberOfLines={2}>{reward.title}</Text>
                            <Text style={styles.rewardCost}>{reward.cost} Stars</Text>


                            <TouchableOpacity
                                style={styles.rewardAction}
                                onPress={() => {
                                    setSelectedReward(reward);
                                    setModalVisible(true);
                                }}
                            >
                                <Text style={styles.rewardActionText}>View</Text>
                            </TouchableOpacity>

                            
                        </View>
                    </LinearGradient>
                ))}
            </ScrollView>
   </ScrollView>
        </View>
        </ScrollView>
    );
}

const createStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 48 },
    title: {
        fontSize: 24,
        fontWeight: "600",
        alignSelf: "center",
        marginTop: 20,
        marginBottom: 12,
        color: colors.text,
    },

    RewardCard: {
        backgroundColor: "transparent",
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 20,
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 4,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 3,
        elevation: 1,
    },
    placeholderText: {
        fontSize: 10,
        color: "#999",
    },
    rewardIconImage: {
        width: 64,
        height: 64,
    },

    pointsRow: { alignSelf: "center", marginTop: 10, marginBottom: 6, flexDirection: "row", gap: 4, alignItems: "center" },
    starIcon: {
        fontSize: 24,
        marginRight: 6,
    },
    pointsNumber: { fontSize: 28, fontWeight: "600", marginTop: -4, },
    pointsLabel: { fontSize: 12, color: "#777" },
    greetingBanner: {
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        marginBottom: 16,
    },
    greetingTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", color: "#ffff" },

    switchButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 18,
    },
    switchButtonText: { color: colors.text, fontWeight: "600" },

    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10, color: colors.text },


    sectionTitle2: { fontSize: 18, fontWeight: "600", marginBottom: 0, color: colors.text },

    rewardsScrollContainer: {
        flexDirection: "row",
        paddingBottom: 10,
        paddingHorizontal: 4,
        gap: 16
    },
    itemsScrollContainer: {
        flexDirection: "row",
        paddingBottom: 12,
        paddingHorizontal: 4,
    },
    rewardCard: {
        width: 150,
        minHeight: 185,
        borderRadius: 16,
        padding: 10,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "flex-start",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
        overflow: "hidden",
    },
    rewardIconPlaceholder: {
        width: 120,
        height: 70,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.35)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    rewardTitle: {
        fontWeight: "700",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 6,
        color: colors.text,
        maxHeight: 36,
        overflow: "hidden",
    },
    rewardCost: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    rewardAction: {
        backgroundColor: "rgba(255,255,255,0.85)",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 14,
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginTop: -4,
        marginBottom: 10,
    },
    rewardActionText: {
        color: "#FF4D7A",
        fontWeight: "700",
        fontSize: 13,
    },
    itemsIconPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#EDEDED",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    avatar: {
        width: 215,
        height: 210,
        borderRadius: 90,
        alignSelf: "center",
        
    },
    
    //missing modal styles that control the reward popup layout

    modalClaimButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },


    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalContainer: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "center",
    },

    modalImagePlaceholder: {
        marginVertical: 10,
        alignItems: "center",
    },

    modalImageText: {
        fontSize: 80,
    },

    modalDesc: {
        fontSize: 14,
        textAlign: "center",
        marginVertical: 8,
        color: colors.muted,
    },

    modalPoints: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 12,
    },
    popupButtonRow: { flexDirection: "row", gap: 40, marginTop: 5 },
    modalCloseButton: {
        backgroundColor: "#ccc",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 10,
        color: "#4CAF50",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },

    modalCloseText: {
        color: "#000",
        fontWeight: "600",
    },

    modalClaimText: {
        color: "#ffffffff",
        fontWeight: "600",
    },
    confettiLayer: { ...StyleSheet.absoluteFillObject, overflow: "hidden"},
    unlockTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 15,
        marginBottom: 12,
        color: colors.text,
    },

    unlockItemsRow: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 16,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },

    unlockItemCard: {
        alignItems: "center",
        width: 80,
    },

    unlockItemImageWrap: {
        width: 75,
        height: 75,
        borderRadius: 16,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },

    unlockItemImage: {
        width: 60,
        height: 60,
    },

    unlockItemOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
    },

 unlockItemCost: {
        fontSize: 15,
        fontWeight: "600",
        color: "#555",
    },
    costRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },

    unlockItemLabel: {
        fontSize: 10,
        color: "#888",
        textAlign: "center",
        textTransform: "capitalize",
        marginTop: 2,
    },

    unlockCircle: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },

    heartsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
        gap: 6,
    },

    characterButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: "center",
        marginBottom: 20,
    },

    characterButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
    unlockItemIcon: {
        fontSize: 42,
    },

    // Character modal styles
    charModalSubtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 6,
    },
    charModalStars: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 16,
    },
    characterGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
    },
    characterCard: {
        width: 90,
        height: 110,
        borderRadius: 16,
        backgroundColor: "#f9f9f9",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#e0e0e0",
        padding: 6,
    },
    characterCardActive: {
        borderColor: "#4CAF50",
        backgroundColor: "#e8f5e9",
    },
    characterCardLocked: {
        opacity: 0.5,
        backgroundColor: "#eee",
    },
    characterImage: {
        width: 70,
        height: 70,
        borderRadius: 25,
    },
    characterEmoji: {
        fontSize: 36,
    },
    characterName: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 4,
        color: "#333",
        textAlign: "center",
    },
    lockBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#999",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginTop: 2,
        gap: 3,
    },
    lockBadgeText: {
        fontSize: 9,
        color: "#fff",
        fontWeight: "600",
    },
    activeBadge: {
        backgroundColor: "#4CAF50",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 2,
    },
    activeBadgeText: {
        fontSize: 9,
        color: "#fff",
        fontWeight: "700",
    },
    avatarContainer: {
        alignSelf: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
        width: "100%",
        height: 260,
        backgroundColor: "#f0f0f0",
        borderRadius: 30,
        elevation: 2,
        marginTop: 6,
        },

    emojiAvatarContainer: {
        backgroundColor: "#FFF3E0",
        justifyContent: "center",
        alignItems: "center",
    },
    emojiAvatarText: {
        fontSize: 70,
    },
});