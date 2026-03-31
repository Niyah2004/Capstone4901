// this is the child home page import code here 
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Modal, View, Text, StyleSheet, Animated, Image, TouchableOpacity, ScrollView } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";
import { AVATARS } from "../data/avatars";
import { LinearGradient } from "expo-linear-gradient";

export default function ChildHome({ navigation, route }) {
    const [childName, setChildName] = useState("");
    const [childPreferredName, setChildPreferredName] = useState("");
    const [avatar, setAvatar] = useState("panda"); // default avatar
    const [loading, setLoading] = useState(true);
    const [childPoints, setChildPoints] = useState(0);
    const [totalPointsEarned, setTotalPointsEarned] = useState(0);
    const [verifiedTaskCount, setVerifiedTaskCount] = useState(0);
    const [totalAssignedPoints, setTotalAssignedPoints] = useState(0);
    const parentUnsubRef = useRef(null);
    const [wardrobe, setWardrobe] = useState({});
    const [childDocId, setChildDocId] = useState(null);
    const [stars, setStars] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState("");
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newLevel, setNewLevel] = useState(0);
    const prevLevelRef = useRef(null);
    const [showCheckPopup, setShowCheckPopup] = useState(false);
    const [checkPopupMsg, setCheckPopupMsg] = useState("");
    const [pendingUnlock, setPendingUnlock] = useState(null);
    const progress = useRef(new Animated.Value(0)).current;
    const { theme } = useTheme();
    const colors = theme.colors;
    const childIdFromRoute = route?.params?.childId;
    const progressGoal = totalAssignedPoints > 0 ? totalAssignedPoints : 100;
    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        // If we have a specific childId from route, use that
        if (childIdFromRoute) {
            const childRef = doc(db, "children", childIdFromRoute);
            const unsub = onSnapshot(childRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setChildDocId(snap.id);
                    setChildName(data.fullName || "");
                    setChildPreferredName(data.preferredName || "");
                    const avatarData = data.avatar;
                    const avatarBase = typeof avatarData === "string" ? avatarData : (avatarData?.base ?? "panda");
                    const validAvatar = AVATARS[avatarBase] ? avatarBase : "panda";
                    setAvatar(validAvatar);
                    setWardrobe(data.wardrobe || {});
                }
                setLoading(false);
            });
            return unsub;
        }

        // Otherwise, fall back to first child for this user
        const q = query(
            collection(db, "children"),
            where("userId", "==", user.uid)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();

            setChildDocId(docSnap.id);
            setChildName(data.fullName || "");
            setChildPreferredName(data.preferredName || "");
            const avatarData = data.avatar;
            const avatarBase =
            typeof avatarData === "string"
                ? avatarData
                : avatarData?.base ?? "panda";
            const validAvatar = AVATARS[avatarBase] ? avatarBase : "panda";
            setAvatar(validAvatar);
            setWardrobe(data.wardrobe || {});
            }
            setLoading(false);
        });

        return unsub;
        }, [childIdFromRoute]);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const childPointsRef = doc(db, "childPoints", user.uid);
        const unsub = onSnapshot(childPointsRef, (snap) => {
            if (!snap.exists()) {
                setChildPoints(0);
                setTotalAssignedPoints(0);
                return;
            }
            const data = snap.data();
            const points = data.points ?? data.stars ?? data.totalPoints ?? 0;
            setChildPoints(points);
        });

        return () => unsub();
    }, );

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const q = query(
            collection(db, "tasks"),
            where("userId", "==", user.uid),
            where("verified", "==", true)
        );
        const unsub = onSnapshot(q, (snap) => {
            const count = snap.docs.length;
            setVerifiedTaskCount(count);
            if (prevLevelRef.current === null) {
                prevLevelRef.current = Math.floor(count / 10);
            }
        }, (err) => console.error("Error fetching verified tasks:", err));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (prevLevelRef.current === null) return;
        const currentLevel = Math.floor(verifiedTaskCount / 10);
        if (currentLevel > prevLevelRef.current) {
            prevLevelRef.current = currentLevel;
            setNewLevel(currentLevel);
            setShowLevelUp(true);
        }
    }, [verifiedTaskCount]);

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long', // "Monday"
        year: 'numeric', // "2025"
        month: 'long', // "October"
        day: 'numeric', // "29"
    });

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>Loading...</Text>
            </SafeAreaView>
        );
    }

    const confirmUnlock = async () => {
        if (!pendingUnlock || !childDocId) {
            setShowCheckPopup(false);
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setShowCheckPopup(false);
            setPendingUnlock(null);
            return;
        }

        const { category, itemId, itemCost } = pendingUnlock;
        const childRef = doc(db, "children", childDocId);
        const pointsRef = doc(db, "childPoints", user.uid);
        const updates = {};

        if (category !== "accessories") {
            Object.keys(wardrobe?.[avatar]?.[category] || {}).forEach((id) => {
                updates[`wardrobe.${avatar}.${category}.${id}.equipped`] = false;
            });
        }

        updates[`wardrobe.${avatar}.${category}.${itemId}`] = {
            unlocked: true,
            equipped: true,
        };

        await updateDoc(childRef, updates);
        await updateDoc(pointsRef, {
            points: childPoints - itemCost,
        });

        setShowCheckPopup(false);
        setPendingUnlock(null);
    };

    const cancelUnlock = () => {
        setShowCheckPopup(false);
        setPendingUnlock(null);
    };

    const handleWardrobePress = async (category, itemId, itemCost) => {
        if (!childDocId) return;
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const childRef = doc(db, "children", childDocId);
        const pointsRef = doc(db, "childPoints", user.uid);

        const itemData = wardrobe?.[avatar]?.[category]?.[itemId];
        const unlocked = itemData?.unlocked ?? false;
        const equipped = itemData?.equipped ?? false;

        // Not unlocked → try to buy
        if (!unlocked) {
            if (childPoints < itemCost) {
                setPopupMsg(`You need ${itemCost - childPoints} more stars to unlock this item!`);
                setShowPopup(true);
            }
            else {
                setCheckPopupMsg(`Are you sure you want to unlock this item?`);
                setPendingUnlock({ category, itemId, itemCost });
                setShowCheckPopup(true);
                return;
            }
            return;
        }

        // 🔓 Already unlocked → toggle equip
        const updates = {};

        if (equipped) {
            // Unequip the item
            updates[`wardrobe.${avatar}.${category}.${itemId}.equipped`] = false;
        } else {
            // Unequip everything else in category (except for accessories - can have multiple)
            if (category !== "accessories") {
                Object.keys(wardrobe?.[avatar]?.[category] || {}).forEach((id) => {
                    updates[`wardrobe.${avatar}.${category}.${id}.equipped`] = false;
                });
            }

            // Equip selected item
            updates[`wardrobe.${avatar}.${category}.${itemId}.equipped`] = true;
        }

        await updateDoc(childRef, updates);
        };

    const level = Math.floor(verifiedTaskCount / 10);
    const tasksIntoLevel = verifiedTaskCount % 10;

    const milestones = [
        { id: "first_task", icon: "star", label: "First Task Complete", achieved: verifiedTaskCount >= 1 },
        { id: "five_tasks", icon: "ribbon", label: "5 Tasks Completed", achieved: verifiedTaskCount >= 5 },
        { id: "ten_tasks", icon: "trophy", label: "10 Tasks Completed", achieved: verifiedTaskCount >= 10 },
        { id: "ten_stars", icon: "flash", label: "Earned 10 Stars", achieved: totalPointsEarned >= 10 },
        { id: "fifty_stars", icon: "flame", label: "Earned 50 Stars", achieved: totalPointsEarned >= 50 },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Top Section: Greeting and Progress Bar */}
            <View style={styles.topSection}>
                    <LinearGradient
                        colors={["#4CAF50", "#4CAF50", "#0D6B8A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.greetingBubble}
                    >
                        <Text style={styles.greetingText}>
                            Hello {(childPreferredName && childPreferredName.trim()) ? childPreferredName : (childName || "there")}!
                        </Text>
                    </LinearGradient>
                    <Text style={[styles.date, { color: colors.muted }]}>{formattedDate}</Text>
                </View>
                {/* Middle Section: Avatar — tap to change character */}
                <View style={styles.avatarContainer}>
                    {/* Avatar Image */}
                    <View style={styles.avatarWrapper}>
                        {/* Base Avatar */}
                    <Image
                        source={AVATARS[avatar]?.base}
                        style={styles.avatar}
                    />
                        {/* Equipped Clothes - Render in specific order for layering */}
                        {["pants", "shoes", "tops", "hats", "accessories"].map((category) => {
                            const items = AVATARS[avatar]?.[category];
                            if (!items) return null;

                            return Object.entries(items).map(([itemId, item]) => {
                                const equipped =
                                wardrobe?.[avatar]?.[category]?.[itemId]?.equipped;

                                if (!equipped) return null;

                                return (
                                <Image
                                    key={`${category}-${itemId}`}
                                    source={item.image}
                                    resizeMode="contain"
                                    style={{
                                    position: "absolute",
                                    top: item.position.top,
                                    left: item.position.left,
                                    width: item.position.size,
                                    height: item.position.size,
                                    }}
                                />
                                );
                            });
                        })}
                    </View>
                </View>
                {/* Bottom Section: Milestone Celebrations */}
                <View style={styles.bottomSection}>
                    <Text style={[styles.subtitle, { color: colors.text }]}>Milestone Celebrations</Text>

                    {/* Level Card */}
                    <LinearGradient
                        colors={["#4CAF50", "#4CAF50", "#0D6B8A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.levelCard}
                    >
                        <Ionicons name="flash" size={34} color="#ffd700" />
                        <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.levelCardTitle}>Level {level}</Text>
                            <Text style={styles.levelCardSubtext}>{tasksIntoLevel} / 10 tasks to Level {level + 1}</Text>
                            <View style={styles.levelProgressBarContainer}>
                                <View style={[styles.levelProgressBar, { width: `${(tasksIntoLevel / 10) * 100}%` }]} />
                            </View>
                        </View>
                    </LinearGradient>

                    {milestones.map((m) => (
                        <View key={m.id} style={[styles.milestone, { borderColor: colors.border, backgroundColor: colors.card }]}>
                            <Ionicons name={m.icon} style={{ color: m.achieved ? "#ffd700" : "#ccc", fontSize: 30 }} />
                            <View style={{ marginLeft: 2 }}>
                                <Text style={[styles.milestoneText, { color: m.achieved ? colors.text : colors.muted }]}>{m.label}</Text>
                                <Text style={[styles.milestoneStatus, {
                                    backgroundColor: m.achieved ? "#e7ffd7ff" : "#f0f0f0",
                                    color: m.achieved ? "#2d7a2d" : "#999"
                                }]}>
                                    {m.achieved ? "Achieved" : "Not Yet"}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <Text style={[styles.subtitle, { color: colors.text }]}>Wardrobe</Text>
                        <Text style={[styles.progressText, { color: colors.text }]}>
                            Points: {childPoints} <Icon name="star" style={{ color: "#ffea00", fontSize: 10 }} />
                        </Text>
                    
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.wardrobeRow}
                    >
                    {Object.entries(AVATARS[avatar] || {}).map(([category, items]) => {
                        if (category === "base") return null;
                        return Object.entries(items).map(([itemId, item]) => {
                        const unlocked = wardrobe?.[avatar]?.[category]?.[itemId]?.unlocked ?? false;

                        return (
                            <TouchableOpacity
                            key={`${category}-${itemId}`}
                            style={styles.wardrobeItem}
                            onPress={() => handleWardrobePress(category, itemId, item.cost)}
                            >
                            <View style={styles.wardrobeImageWrap}>
                            <Image
                                source={item.image}
                                style={[styles.wardrobeImage, !unlocked && { opacity: 0.85 }]}
                                resizeMode="contain"
                            />

                            {!unlocked && (
                                <View style={styles.lockOverlay}>
                                    <Ionicons name="lock-closed" size={22} color="#fff" />
                                </View>
                            )}
                            </View>
                            {!unlocked && (
                                <View style={styles.costRow}>
                                    <Text style={styles.costText}>{item.cost}</Text>
                                    <Ionicons name="star" style={{ color: "#ffd700", fontSize: 18 }} />
                                </View>
                            )}
                            </TouchableOpacity>
                            );
                        });
                    })}
                    </ScrollView>
                </View>
            </ScrollView>
            <Modal transparent visible={showPopup} animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popup}>
                    <Ionicons name="lock-closed" size={40} color="#ff6b6b" />
                    <Text style={styles.popupText}>{popupMsg}</Text>
                    <TouchableOpacity
                        style={styles.popupButton}
                        onPress={() => setShowPopup(false)}
                    >
                        <Text style={styles.popupButtonText}>OK</Text>
                    </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal transparent visible={showCheckPopup} animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popup}>
                    <Ionicons name="lock-closed" size={40} color="#ff6b6b" />
                    <Text style={styles.popupText}>{checkPopupMsg}</Text>
                    <View style={styles.popupButtonRow}>
                    <TouchableOpacity
                        style={styles.popupButton}
                        onPress={confirmUnlock}
                    >
                        <Text style={styles.popupButtonText}>Yes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.popupButton}
                        onPress={cancelUnlock}
                    >
                        <Text style={styles.popupButtonText}>No</Text>
                    </TouchableOpacity>
                    </View>
                    
                    
                    </View>
                </View>
            </Modal>
            <Modal transparent visible={showLevelUp} animationType="fade">
                <View style={styles.popupOverlay}>
                    <LinearGradient
                        colors={["#4CAF50", "#4CAF50", "#0D6B8A"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.levelUpCard}
                    >
                        <Ionicons name="trophy" size={50} color="#ffd700" />
                        <View style={styles.levelUpStars}>
                            <Ionicons name="star" size={20} color="#ffd700" />
                            <Ionicons name="star" size={20} color="#ffd700" />
                            <Ionicons name="star" size={20} color="#ffd700" />
                        </View>
                        <Text style={styles.levelUpTitle}>You reached Level {newLevel}!</Text>
                        <Text style={styles.levelUpSubtext}>Keep completing tasks to level up!</Text>
                        <TouchableOpacity
                            style={styles.levelUpButton}
                            onPress={() => setShowLevelUp(false)}
                        >
                            <Text style={styles.levelUpButtonText}>Let's Go!</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d2d2d", marginTop: 5, textAlign: "center" },
    greetingBubble: {
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 28,
        alignItems: "center",
        marginBottom: 4,
        shadowColor: "#6A1F9B",
        shadowOpacity: 0.45,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 5,
    },
    greetingText: {
        fontSize: 30,
        fontWeight: "900",
        color: "#fff",
        letterSpacing: 0.5,
        textShadowColor: "rgba(0,0,0,0.15)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    date: { fontSize: 14, color: "#666", textAlign: "center", width: "100%" },
    progressBarRow: { flexDirection: "row", alignItems: "center", marginVertical: 10, paddingHorizontal: 10 },
    progressBarContainer: { flex: 1, height: 12, borderRadius: 5, backgroundColor: "#ffffffff", overflow: "hidden", marginHorizontal: 8 },
    progressBar: { height: '100%', borderRadius: 5, backgroundColor: "#ffea00ff" },
    progressText: { fontSize: 11, color: "#333", flexShrink: 0, width: "100%" },
    avatarContainer: { alignItems: "center", marginVertical: 20, justifyContent: "center", backgroundColor: "transparent" },
    avatarWrapper: { position: "relative", overflow: "visible" },
    scrollContent: { paddingBottom: 30 },
    avatar: { width: 300, height: 300, borderRadius: 10 },
    avatarOverlay: { position: "absolute", top: 0, left: 0, width: 300, height: 300 },
    backgroundOverlay: { position: "absolute", top: -60, left: -60, width: 420, height: 420 },
    changeCharacterBadge: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    changeCharacterText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    bottomSection: { flex: 1, justifyContent: "flex-start" },
    subtitle: { fontSize: 18, color: "#2d2d2d", marginTop: 20, textAlign: "left" },
    milestone: { flexDirection: "row", marginVertical: 5, borderColor: "#ccc", borderWidth: .5, borderRadius: 8, padding: 14, alignItems: "center" },
    milestoneText: { marginLeft: 10, fontSize: 14, color: "#333" },
    milestoneStatus: { marginLeft: 10,fontSize: 10, color: "#666", backgroundColor: "#e7ffd7ff", paddingVertical: 1, paddingHorizontal: 10, borderRadius: 10, textAlign: "center", alignSelf: "flex-start" },
    popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    popup: { width: 260, backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center" },
    popupText: { marginTop: 10, fontSize: 14, textAlign: "center" },
    popupButtonRow: { flexDirection: "row", gap: 20, marginTop: 15 },
    popupButton: { backgroundColor: "#b0b0b0", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    popupButtonText: { fontWeight: "bold", },
    wardrobeRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 5, gap: 25 },
    wardrobeItem: { alignItems: "center", width: 80 },
    wardrobeImageWrap: { width: 92, height: 92, borderRadius: 20, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center", overflow: "hidden"},
    wardrobeImage: { width: 74, height: 74, },
    wardrobeLabel: { fontSize: 10, marginTop: 6, textAlign: "center" },
    lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", },
    costRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4, },
    costText: { fontSize: 16, fontWeight: "600", color: "#555"},
    levelCard: {
        flexDirection: "row",
        marginVertical: 5,
        borderRadius: 8,
        padding: 14,
        alignItems: "center",
    },
    levelProgressBarContainer: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "rgba(255,255,255,0.3)",
        overflow: "hidden",
        marginTop: 6,
    },
    levelProgressBar: {
        height: "100%",
        borderRadius: 4,
        backgroundColor: "#ffd700",
    },
    levelCardRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    levelCardTitle: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: "bold",
        color: "#fff",
    },
    levelCardSubtext: {
        marginLeft: 10,
        fontSize: 10,
        color: "rgba(255,255,255,0.85)",
        paddingVertical: 1,
        paddingHorizontal: 10,
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    levelUpCard: {
        width: 280,
        borderRadius: 20,
        padding: 28,
        alignItems: "center",
    },
    levelUpStars: {
        flexDirection: "row",
        gap: 6,
        marginVertical: 10,
    },
    levelUpTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 6,
    },
    levelUpSubtext: {
        fontSize: 14,
        color: "rgba(255,255,255,0.85)",
        textAlign: "center",
        marginBottom: 18,
    },
    levelUpButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 28,
        paddingVertical: 10,
        borderRadius: 20,
    },
    levelUpButtonText: {
        fontWeight: "bold",
        color: "#6A1F9B",
        fontSize: 15,
    },
});