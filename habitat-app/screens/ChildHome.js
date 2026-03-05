// this is the child home page import code here 
import React, { useState, useEffect, useRef } from "react";
import { Alert, Modal, View, Text, StyleSheet, Animated, Image, TouchableOpacity, ScrollView } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";
import { AVATARS } from "../data/avatars";

export default function ChildHome() {
    const [childName, setChildName] = useState("");
    const [childPreferredName, setChildPreferredName] = useState("");
    const [avatar, setAvatar] = useState("panda"); // default avatar
    const [loading, setLoading] = useState(true);
    const [childPoints, setChildPoints] = useState(0);
    const [totalAssignedPoints, setTotalAssignedPoints] = useState(0);
    const parentUnsubRef = useRef(null);
    const [wardrobe, setWardrobe] = useState({});
    const [childDocId, setChildDocId] = useState(null);
    const [stars, setStars] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMsg, setPopupMsg] = useState("");
    const progress = useRef(new Animated.Value(0)).current;
    const { theme } = useTheme();
    const colors = theme.colors;

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

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
            setAvatar(avatarBase);
            setWardrobe(data.wardrobe || {});
            }
            setLoading(false);
        });

        return unsub;
        }, []);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const childPointsRef = doc(db, "childPoints", user.uid);

        const unsubChild = onSnapshot(childPointsRef, (snap) => {
            if (!snap.exists()) {
            setChildPoints(0);
            setTotalAssignedPoints(0);
            return;
            }

            const data = snap.data();
            const points = data.points ?? 0;
            const parentId = data.parentId;

            setChildPoints(points);

            // Listen to parentPoints ONLY when parentId changes
            if (parentId) {
            if (parentUnsubRef.current) {
                parentUnsubRef.current();
            }

            const parentRef = doc(db, "parentPoints", parentId);
            parentUnsubRef.current = onSnapshot(parentRef, (parentSnap) => {
                setTotalAssignedPoints(
                parentSnap.data()?.totalAssignedPoints ?? 0
                );
            });
            }
        });

        return () => {
            unsubChild();
            if (parentUnsubRef.current) parentUnsubRef.current();
        };
        }, []);

   useEffect(() => {
        if (totalAssignedPoints <= 0) {
            progress.setValue(0);
            return;
        }

        const percent = Math.min(
            childPoints / totalAssignedPoints,
            1
        );

        Animated.timing(progress, {
            toValue: percent,
            duration: 500,
            useNativeDriver: false,
        }).start();
        }, [childPoints, totalAssignedPoints]);
    
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
            setPopupMsg(`You need ${itemCost - childPoints} more ⭐ to unlock this item!`);
            setShowPopup(true);
            return;
            }

            const updates = {};

            // Unequip everything else in category
            Object.keys(wardrobe?.[avatar]?.[category] || {}).forEach((id) => {
            updates[`wardrobe.${avatar}.${category}.${id}.equipped`] = false;
            });

            // Unlock and auto-equip
            updates[`wardrobe.${avatar}.${category}.${itemId}`] = {
            unlocked: true,
            equipped: true,
            };

            await updateDoc(childRef, updates);

            // Deduct stars
            await updateDoc(pointsRef, {
            points: childPoints - itemCost,
            });

            return;
        }

        // 🔓 Already unlocked → toggle equip
        const updates = {};

        if (equipped) {
            // Unequip the item
            updates[`wardrobe.${avatar}.${category}.${itemId}.equipped`] = false;
        } else {
            // Unequip everything else in category
            Object.keys(wardrobe?.[avatar]?.[category] || {}).forEach((id) => {
            updates[`wardrobe.${avatar}.${category}.${id}.equipped`] = false;
            });

            // Equip selected item
            updates[`wardrobe.${avatar}.${category}.${itemId}.equipped`] = true;
        }

        await updateDoc(childRef, updates);
        };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Top Section: Greeting and Progress Bar */}
            <View style={styles.topSection}>
                    {childPreferredName && childPreferredName.trim() ? (
                        <Text style={[styles.title, { color: colors.text }]}>Hello {childPreferredName}!</Text>
                    ) : childName ? (
                        <Text style={[styles.title, { color: colors.text }]}>Hello {childName}!</Text>
                    ) : (
                        <Text style={[styles.title, { color: colors.text }]}>Hello Child!</Text>
                    )}
                    <Text style={[styles.date, { color: colors.muted }]}>{formattedDate}</Text>
                    <View style={styles.progressBarRow}>
                        <Icon name="star" style={{ color: "#ffea00", fontSize: 30 }} />
                        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                            <Animated.View
                                style={[
                                    styles.progressBar, {
                                        width: progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%']
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.text }]}>  
                            {totalAssignedPoints > 0
                            ? `${Math.round((childPoints / totalAssignedPoints) * 100)}%`
                            : "0%"}</Text>
                    </View>
                </View>
                {/* Middle Section: Avatar */}
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
                {/* Bottom Section: Milestone Celebrations/task view?*/}
                <View style={styles.bottomSection}>
                    <Text style={[styles.subtitle, { color: colors.text }]}>Milestone Celebrations</Text>
                    <View style={[styles.milestone, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Ionicons name="trophy-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                        <View style={{ marginLeft: 2 }}>
                            <Text style={[styles.milestoneText, { color: colors.text }]}>First Task Completed!</Text>
                            <Text style={[styles.milestoneStatus, { color: colors.text }]}>Achieved</Text>
                        </View>
                    </View>
                    <View style={[styles.milestone, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Ionicons name="star-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                        <View style={{ marginLeft: 2 }}>
                            <Text style={[styles.milestoneText, { color: colors.text }]}>Collected 50 Stars!</Text>
                            <Text style={[styles.milestoneStatus, { color: colors.text }]}>Achieved</Text>
                        </View>
                    </View>

                    <Text style={[styles.subtitle, { color: colors.text }]}>Wardrobe</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.wardrobeRow}
                    >
                    {Object.entries(AVATARS[avatar] || {}).map(([category, items]) => {
                        if (category === "base") return null;

                        return Object.entries(items).map(([itemId, item]) => {
                        const itemData = wardrobe?.[avatar]?.[category]?.[itemId];
                        const unlocked = itemData?.unlocked ?? false;

                        return (
                            <TouchableOpacity
                            key={`${category}-${itemId}`}
                            style={[
                                styles.wardrobeItem,
                                {
                                    backgroundColor: unlocked ? "#ffffff" : "#adadade8",
                                    borderWidth: unlocked ? 0 : 1,
                                    borderColor: "#707070",
                                }
                            ]}
                            onPress={() => handleWardrobePress(category, itemId, item.cost)}
                            >
                            <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <Image
                                source={item.image}
                                style={{ width: 70, height: 70, opacity: unlocked ? 1 : 0.8 }}
                                resizeMode="contain"
                            />

                            {!unlocked && (
                                <View style={styles.lockOverlay}>
                                    <Ionicons name="lock-closed" size={24} color={colors.muted} />
                                </View>
                            )}
                            {!unlocked && (
                                <Text style={styles.costText}>{item.cost} <Ionicons name="star" style={{ color: "#ffd700", fontSize: 15 }} />
                                </Text>
                            )}
                            </View>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d2d2d", marginTop: 5,textAlign: "center" },
    date: { fontSize: 14, color: "#666", textAlign: "center", width: "100%" },
    progressBarRow: { flexDirection: "row", alignItems: "center", marginVertical: 10,  justifyContent: "center" },
    progressBarContainer: {  height: 12, borderRadius: 5, backgroundColor: "#ffffffff", overflow: "hidden", width: '80%', marginVertical: 10 },
    progressBar: { height: '100%', borderRadius: 5, backgroundColor: "#ffea00ff" },
    progressText: { fontSize: 12, color: "#333", marginLeft: 10 },
    avatarContainer: { alignItems: "center", marginVertical: 20, justifyContent: "center", backgroundColor: "transparent" },
    avatarWrapper: { position: "relative" },
    scrollContent: { paddingBottom: 30 },
    avatar: { width: 300, height: 300, borderRadius: 10 },
    hatOverlay: { position: "absolute", top: -65, left: 70 },
    bottomSection: { flex: 1, justifyContent: "flex-start" },
    subtitle: { fontSize: 16, color: "#2d2d2d", marginTop: 20, marginBottom: 10, textAlign: "left" },
    milestone: { flexDirection: "row", marginVertical: 5, borderColor: "#ccc", borderWidth: .5, borderRadius: 8, padding: 10, alignItems: "center" },
    milestoneText: { marginLeft: 10, fontSize: 14, color: "#333" },
    milestoneStatus: { marginLeft: 10,fontSize: 10, color: "#666", backgroundColor: "#e7ffd7ff", paddingVertical: 1, paddingHorizontal: 10, borderRadius: 10, textAlign: "center", alignSelf: "flex-start" },
    wardrobeScroll: { paddingVertical: 10, alignItems: "center", },
    popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
    popup: { width: 260, backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center" },
    popupText: { marginTop: 10, fontSize: 14, textAlign: "center" },
    popupButton: { marginTop: 15, backgroundColor: "#ffea00", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    popupButtonText: { fontWeight: "bold", },
    wardrobeRow: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 5, gap: 12 },
    wardrobeItem: { width: 80, height: 80, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    wardrobeLabel: { fontSize: 10, marginTop: 6, textAlign: "center" },
    lockOverlay: { position: "absolute", backgroundColor: "transparent", alignItems: "center", justifyContent: "center", width: "100%", height: "70%" },
    costText: {
      position: "absolute",
      bottom: -5,
      fontSize: 15,
      color: "#fff",
      fontWeight: "bold",
      textAlign: "center",
      alignContent: "center",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
});