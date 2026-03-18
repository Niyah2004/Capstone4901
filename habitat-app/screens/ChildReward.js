import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from "../firebaseConfig";
import { Alert } from "react-native";
import { Modal, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, onSnapshot, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AVATARS } from "../data/avatars";
import { useTheme } from "../theme/ThemeContext";

// Character roster - starters are free, others unlock at milestone thresholds
const CHARACTER_ROSTER = [
    { id: "panda", name: "Panda", emoji: "🐼", milestone: 0, image: require("../assets/panda.png") },
    { id: "turtle", name: "Turtle", emoji: "🐢", milestone: 0, image: require("../assets/turtle.png") },
    { id: "dino", name: "Dino", emoji: "🦒", milestone: 0, image: require("../assets/dino.png") },
    { id: "lion", name: "Lion", emoji: "🦁", milestone: 50, image: require("../assets/lion.png") },
    { id: "penguin", name: "Penguin", emoji: "🐧", milestone: 100, image: require("../assets/penguin.png") },
];

const STARTER_IDS = CHARACTER_ROSTER.filter(c => c.milestone === 0).map(c => c.id);

function AnimatedHeart({ delay }) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.35, duration: 500, delay, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="heart" size={22} color="#e53935" />
        </Animated.View>
    );
}

export default function ChildReward() {
    const auth = getAuth();
    const parentId = auth.currentUser?.uid;
    const { theme } = useTheme();
    const colors = theme.colors;
    const [totalStars, setTotalStars] = useState(0);
    const [rewards, setRewards] = useState([]);
    const [claimedRewardIds, setClaimedRewardIds] = useState(new Set());
    const [selectedReward, setSelectedReward] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [childName, setChildName] = useState("Lea");
    const [avatar, setAvatar] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(true);
    const confettiRef = useRef(null);

    // Character unlock state
    const [characterModalVisible, setCharacterModalVisible] = useState(false);
    const [lifetimeStars, setLifetimeStars] = useState(0);
    const [unlockedAvatars, setUnlockedAvatars] = useState([...STARTER_IDS]);
    const [childDocId, setChildDocId] = useState(null);
    const [wardrobe, setWardrobe] = useState({});
    
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
            }));
            setRewards(rewardList);
        }, (error) => {
            console.error("Error fetching rewards: ", error);
        });

        return () => unsubscribe();
    }, [parentId]);

    // Track which rewards the child has already claimed (pending or fulfilled)
    useEffect(() => {
        if (!auth.currentUser) return;
        const claimsQ = query(
            collection(db, "claims"),
            where("user_id", "==", auth.currentUser.uid),
            where("status", "==", "claimed")
        );
        const unsubClaims = onSnapshot(claimsQ, (snap) => {
            const ids = new Set(snap.docs.map(d => d.data().item_id));
            setClaimedRewardIds(ids);
        });
        return () => unsubClaims();
    }, []);

    // Fetch child's stars from childPoints collection (current balance + lifetime total)
    useEffect(() => {
        if (!auth.currentUser) return;

        const childPointsRef = doc(db, "childPoints", auth.currentUser.uid);
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
            if (!auth.currentUser) return;

            try {
                const q = query(
                    collection(db, "children"),
                    where("userId", "==", auth.currentUser.uid)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    const data = docSnap.data();
                    setChildDocId(docSnap.id);
                    setChildName(data.preferredName || data.fullName || "Lea");
                    // Normalize avatar: handle both string and object formats
                    const avatarData = data.avatar;
                    const avatarBase = typeof avatarData === "string" ? avatarData : (avatarData?.base ?? "panda");
                    const validAvatar = AVATARS[avatarBase] ? avatarBase : "panda";
                    setAvatar(validAvatar);
                    setAvatarLoading(false);
                    setWardrobe(data.wardrobe || {});
                    // Load previously unlocked avatars (starters are always included)
                    const saved = data.unlockedAvatars || [];
                    const merged = [...new Set([...STARTER_IDS, ...saved])];
                    setUnlockedAvatars(merged);
                } else {
                    setAvatarLoading(false);
                }
            } catch (error) {
                console.error("Error fetching child profile:", error);
            }
        };

        fetchChildProfile();
    }, []);

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
            Alert.alert("Not Enough Stars", `You need ${selectedReward.cost} stars but only have ${totalStars} stars.`);
            return;
        }

        // 🎉 Trigger confetti immediately for instant gratification!
        confettiRef.current?.start();

        try {
            // Update childPoints collection
            const childPointsRef = doc(db, "childPoints", auth.currentUser.uid);
            await updateDoc(childPointsRef, {
                points: totalStars - selectedReward.cost,
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
    // End of handleClaimReward

    return (
        <ScrollView style={{ backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.ScrollView}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>

                        <ConfettiCannon
                            ref={confettiRef}
                            count={200}
                            origin={{ x: 0, y: 0 }}
                            explosionSpeed={450}
                            fallSpeed={2500}
                            autoStart={false}
                            fadeOut={true}
                            colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']}
                        />

                        <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedReward?.title}</Text>

                        <View style={styles.modalImagePlaceholder}>
                            <Text style={styles.modalImageText}>🎁</Text>
                        </View>

                        <Text style={[styles.modalDesc, { color: colors.muted }]}>
                            {selectedReward?.description || "No description provided."}
                        </Text>
                        <Text style={[styles.modalPoints, { color: colors.text }]}>
                            ⭐ {selectedReward?.cost} Points
                        </Text>


                        <TouchableOpacity
                            style={[styles.modalCloseButton, { backgroundColor: colors.border }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={[styles.modalCloseText, { color: colors.text }]}>Close</Text>
                        </TouchableOpacity>

                        {/*claim button */}
                        <TouchableOpacity
                            style={[styles.modalClaimButton, { backgroundColor: colors.primary }]}
                            onPress={handleClaimReward}
                        >
                            <Text style={styles.modalClaimText}>Claim</Text>
                        </TouchableOpacity>
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
                <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
                    <View style={[styles.modalContainer, { width: "90%", backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Your Character</Text>
                        <Text style={[styles.charModalSubtitle, { color: colors.muted }]}>
                            Earn more stars to unlock new characters!
                        </Text>
                        <Text style={[styles.charModalStars, { color: colors.text }]}>
                            Lifetime Stars Earned: ⭐ {lifetimeStars}
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
                                            { backgroundColor: colors.card, borderColor: colors.border },
                                            isActive && { borderColor: colors.primary, backgroundColor: colors.successBg },
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
                                            { color: colors.text },
                                            !isUnlocked && { color: colors.muted }
                                        ]}>
                                            {character.name}
                                        </Text>

                                        {!isUnlocked && (
                                            <View style={styles.lockBadge}>
                                                <Ionicons name="lock-closed" size={12} color="#fff" />
                                                <Text style={styles.lockBadgeText}>{character.milestone} ⭐</Text>
                                            </View>
                                        )}

                                        {isActive && (
                                            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                                                <Text style={styles.activeBadgeText}>Active</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCloseButton, { marginTop: 16, backgroundColor: colors.border }]}
                            onPress={() => setCharacterModalVisible(false)}
                        >
                            <Text style={[styles.modalCloseText, { color: colors.text }]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Text style={[styles.title, { color: colors.text }]}>Reward</Text>
            <View style={[styles.RewardCard, { backgroundColor: colors.card }]}>

                <View style={styles.avatarContainer}>
                    {/* Avatar Image - show selected avatar only when loaded */}
                    {!avatarLoading && avatar ? (
                        <Image
                                source={AVATARS[avatar]?.base || require("../assets/panda.png")}
                                style={styles.avatar}

                            />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: colors.inputBg }]} />
                    )}
                </View>

                <View style={styles.pointsRow}>
                    <Icon name="star" style={{ color: "#ffd700", fontSize: 24, marginRight: 6 }} />
                    <Text style={[styles.pointsNumber, { color: colors.text }]}>{totalStars}</Text>
                    <Text style={[styles.pointsLabel, { color: colors.muted }]}>Star Points</Text>
                </View>


                <View style={styles.greetingRow}>
                    <Text style={[styles.greetingTitle, { color: colors.text }]}>Amazing job, {childName}! Keep building those Habits</Text>
                </View>
            </View>




            <Text style={[styles.unlockTitle, { color: colors.text }]}>Unlock More Items</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unlockItemsRow}>
                {Object.entries(AVATARS[avatar] || AVATARS["panda"]).map(([category, items]) => {
                    if (category === "base") return null;
                    return Object.entries(items).map(([itemId, item]) => {
                        const owned = wardrobe?.[avatar]?.[category]?.[itemId]?.unlocked ?? false;
                        return (
                            <View key={`${category}-${itemId}`} style={styles.unlockItemCard}>
                                <View style={[styles.unlockItemImageWrap, { backgroundColor: colors.inputBg }]}>
                                    <Image source={item.image} style={styles.unlockItemImage} resizeMode="contain" />
                                    {!owned && (
                                        <View style={styles.unlockItemOverlay}>
                                            <Ionicons name="lock-closed" size={18} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.unlockItemCost, { color: colors.muted }]}>⭐ {item.cost}</Text>
                                <Text style={[styles.unlockItemLabel, { color: colors.muted }]}>{itemId}</Text>
                            </View>
                        );
                    });
                })}
            </ScrollView>

            <View style={styles.heartsRow}>
                {[...Array(7)].map((_, i) => (
                    <AnimatedHeart key={i} delay={i * 150} />
                ))}
            </View>

            <TouchableOpacity style={[styles.characterButton, { backgroundColor: colors.primary }]} onPress={openCharacterModal}>
                <Text style={styles.characterButtonText}>Get different Character →</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Rewards</Text>

            {rewards.filter(r => !claimedRewardIds.has(r.id)).length === 0 && (
                <Text style={{ textAlign: "center", color: colors.muted, marginVertical: 16, fontSize: 14 }}>
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
                                <Text style={styles.placeholderText}>Icon</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 48 },
    title: {
        fontSize: 22,
        fontWeight: "600",
        alignItems: "center",
        marginBottom: 10,
        marginLeft: 140
    },

    RewardCard: {
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

    pointsRow: { alignItems: "center", marginTop: 12, marginBottom: 6, flexDirection: "row", justifyContent: "center" },
    starIcon: {
        fontSize: 24,
        marginRight: 6,
    },
    pointsNumber: { fontSize: 28, fontWeight: "700" },
    pointsLabel: { fontSize: 12 },
    greetingRow: { alignItems: "center", marginTop: 8 },
    greetingTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },

    switchButton: {
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 18,
    },
    switchButtonText: { color: "#fff", fontWeight: "600" },

    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },


    sectionTitle2: { fontSize: 18, fontWeight: "600", marginBottom: 0 },

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
        color: "#000",
        maxHeight: 36,
        overflow: "hidden",
    },
    rewardCost: {
        fontSize: 14,
        color: "#000",
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
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    
    //missing modal styles that control the reward popup layout

    modalClaimButton: {
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
        justifyContent: "center",
        alignItems: "center",
    },

    modalContainer: {
        width: "80%",
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
    },

    modalPoints: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 12,
    },

    modalCloseButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 8,
    },

    modalCloseText: {
        fontWeight: "600",
    },

    modalClaimText: {
        color: "#ffffffff",
        fontWeight: "600",
    },

    unlockTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 12,
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
        fontSize: 11,
        fontWeight: "700",
        marginTop: 5,
    },

    unlockItemLabel: {
        fontSize: 10,
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
        textAlign: "center",
        marginBottom: 6,
    },
    charModalStars: {
        fontSize: 14,
        fontWeight: "600",
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
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        padding: 6,
    },
    characterCardLocked: {
        opacity: 0.5,
    },
    characterImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    characterEmoji: {
        fontSize: 36,
    },
    characterName: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 4,
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
        alignItems: "center",
        marginVertical: 8,
    },

    emojiAvatarContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    emojiAvatarText: {
        fontSize: 70,
    },
});
