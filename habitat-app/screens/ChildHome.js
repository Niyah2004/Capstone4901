// this is the child home page import code here 
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity, ScrollView } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

export default function ChildHome({ navigation }) {
    const [childName, setChildName] = useState("");
    const [childPreferredName, setChildPreferredName] = useState("");
    const [avatar, setAvatar] = useState("panda"); // default avatar
    const [loading, setLoading] = useState(true);
    const [childPoints, setChildPoints] = useState(0);
    const [totalPointsEarned, setTotalPointsEarned] = useState(0);
    const [verifiedTaskCount, setVerifiedTaskCount] = useState(0);
    const [equippedItems, setEquippedItems] = useState({
        dinoHat: false,
        dinoScarf: false,
        dinoSkates: false,
        dinoDog: false,
    });
    const progress = useRef(new Animated.Value(0)).current;
    const MAX_POINTS = 300;
    const { theme } = useTheme();
    const colors = theme.colors;

    useEffect(() => {
        const fetchChildData = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    setChildName("");
                    setAvatar("panda");
                    setLoading(false);
                    return;
                }
                const uid = user.uid;
                const q = query(collection(db, "children"), where("userId", "==", uid));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    setChildName(data.fullName || "");
                    setChildPreferredName(data.preferredName || "");
                    setAvatar(data.avatar || "panda");
                } else {
                    setChildName("");
                    setChildPreferredName("");
                    setAvatar("panda");
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching child profile:", error);
                setChildName("");
                setChildPreferredName("");
                setAvatar("panda");
                setLoading(false);
            }
        };
        fetchChildData();
    }, []);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            setChildPoints(0);
            Animated.timing(progress, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
            }).start();
            return;
        }

        const childPointsRef = doc(db, "childPoints", user.uid);
        const unsub = onSnapshot(childPointsRef, (snap) => {
            const data = snap.exists() ? snap.data() : {};
            const points = data.points ?? data.stars ?? data.totalPoints ?? 0;
            const totalEarned = data.totalPoints ?? data.points ?? data.stars ?? 0;
            setChildPoints(points);
            setTotalPointsEarned(totalEarned);
            const clamped = Math.max(0, Math.min(MAX_POINTS, points));
            Animated.timing(progress, {
                toValue: clamped,
                duration: 600,
                useNativeDriver: false,
            }).start();
        });

        return () => unsub();
    }, [progress]);

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
            setVerifiedTaskCount(snap.docs.length);
        }, (err) => console.error("Error fetching verified tasks:", err));
        return () => unsub();
    }, []);

    // Map avatar id to image
    const avatarImages = {
        panda:require("../assets/panda.png"),
        turtle: require("../assets/turtle.png"),
        dino: require("../assets/dino.png"),
        lion: require("../assets/lion.png"),
        penguin: require("../assets/penguin.png"),
    };
    const wardrobeItems = [
        { id: "dinoHat", label: "Hat", image: require("../assets/dinoHat.png") },
        { id: "dinoScarf", label: "Scarf", image: require("../assets/dinoScarf.png") },
        { id: "dinoSkates", label: "Skates", image: require("../assets/dinoSkates.png") },
        { id: "dinoDog", label: "Dog", image: require("../assets/dinoDog.png") },
        { id: "SpaceBackground", label: "Space Background", image: require("../assets/SpaceBackground.png") },
    ];

    const toggleWardrobeItem = (itemId) => {
        setEquippedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const milestones = [
        { id: "first_task", icon: "trophy-outline", label: "First Task Completed!", achieved: verifiedTaskCount >= 1 },
        { id: "five_tasks", icon: "ribbon-outline", label: "Completed 5 Tasks!", achieved: verifiedTaskCount >= 5 },
        { id: "fifty_stars", icon: "star-outline", label: "Collected 50 Stars!", achieved: totalPointsEarned >= 50 },
        { id: "hundred_stars", icon: "star", label: "Collected 100 Stars!", achieved: totalPointsEarned >= 100 },
    ];

    // Emoji fallback for characters that don't have image assets yet
    const avatarEmojis = {
        cat: "🐱",
        dog: "🐶",
        bunny: "🐰",
        owl: "🦉",
        dragon: "🐉",
    };

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
                                            inputRange: [0, MAX_POINTS],
                                            outputRange: ['0%', '100%']
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressText, { color: colors.text }]}>{childPoints}</Text>
                    </View>
                </View>
                {/* Middle Section: Avatar — tap to change character */}
                <View style={styles.avatarContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("SelectAvatars")}
                        activeOpacity={0.85}
                    >
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={avatarImages[avatar] || avatarImages["panda"]}
                                style={styles.avatar}
                            />
                            {wardrobeItems.map((item) =>
                                equippedItems[item.id] ? (
                                    <Image key={item.id} source={item.image} style={styles.avatarOverlay} />
                                ) : null
                            )}
                            {/* Tap hint badge */}
                            <View style={styles.changeCharacterBadge}>
                                <Text style={styles.changeCharacterText}>✏️ Change</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
                {/* Bottom Section: Milestone Celebrations */}
                <View style={styles.bottomSection}>
                    <Text style={[styles.subtitle, { color: colors.text }]}>Milestone Celebrations</Text>
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
                    <View style={styles.wardrobeRow}>
                        {wardrobeItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleWardrobeItem(item.id)}
                                style={[
                                    styles.wardrobeItem,
                                    { backgroundColor: colors.card, borderColor: colors.border },
                                    equippedItems[item.id] && styles.wardrobeItemSelected,
                                ]}
                            >
                                <Image source={item.image} style={styles.wardrobeIcon} resizeMode="contain" />
                                <Text style={[styles.wardrobeLabel, { color: colors.text }]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
            </SafeAreaView>
        );
    }

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d2d2d", marginTop: 5,textAlign: "center" },
    date: { fontSize: 14, color: "#666", textAlign: "center", width: "100%" },
    progressBarRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
    progressBarContainer: {  height: 12, borderRadius: 5, backgroundColor: "#ffffffff", overflow: "hidden", width: '80%', marginVertical: 10 },
    progressBar: { height: '100%', borderRadius: 5, backgroundColor: "#ffea00ff" },
    progressText: { fontSize: 12, color: "#333", marginLeft: 10 },
    avatarContainer: { alignItems: "center", marginVertical: 20, justifyContent: "center", backgroundColor: "transparent" },
    avatarWrapper: { position: "relative" },
    scrollContent: { paddingBottom: 30 },
    avatar: { width: 300, height: 300, borderRadius: 10 },
    avatarOverlay: { position: "absolute", top: 0, left: 0, width: 300, height: 300 },
    changeCharacterBadge: { position: "absolute", bottom: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
    changeCharacterText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    bottomSection: { flex: 1, justifyContent: "flex-start" },
    subtitle: { fontSize: 16, color: "#2d2d2d", marginTop: 20, marginBottom: 10, textAlign: "left" },
    milestone: { flexDirection: "row", marginVertical: 5, borderColor: "#ccc", borderWidth: .5, borderRadius: 8, padding: 10, alignItems: "center" },
    milestoneText: { marginLeft: 10, fontSize: 14, color: "#333" },
    milestoneStatus: { marginLeft: 10,fontSize: 10, color: "#666", backgroundColor: "#e7ffd7ff", paddingVertical: 1, paddingHorizontal: 10, borderRadius: 10, textAlign: "center", alignSelf: "flex-start" },
    wardrobeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 6 },
    wardrobeItem: { width: "23%", aspectRatio: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 1, padding: 6 },
    wardrobeItemSelected: { borderColor: "#4CAF50", borderWidth: 2, backgroundColor: "#ECF9ED" },
    wardrobeIcon: { width: 34, height: 34 },
    wardrobeLabel: { fontSize: 10, marginTop: 6, textAlign: "center" },
    emojiAvatarContainer: { backgroundColor: "#FFF3E0", justifyContent: "center", alignItems: "center" },
    emojiAvatarText: { fontSize: 140 },
});
