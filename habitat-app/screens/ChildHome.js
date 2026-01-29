// this is the child home page import code here 
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function ChildHome() {
    const [childName, setChildName] = useState("");
    const [avatar, setAvatar] = useState("panda"); // default avatar
    const [loading, setLoading] = useState(true);
    const [childPoints, setChildPoints] = useState(0);
    const progress = useRef(new Animated.Value(0)).current;
    const MAX_POINTS = 300;

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
                    setAvatar(data.avatar || "panda");
                } else {
                    setChildName("");
                    setAvatar("panda");
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching child profile:", error);
                setChildName("");
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
            setChildPoints(points);
            const clamped = Math.max(0, Math.min(MAX_POINTS, points));
            Animated.timing(progress, {
                toValue: clamped,
                duration: 600,
                useNativeDriver: false,
            }).start();
        });

        return () => unsub();
    }, [progress]);
    // Map avatar id to image
    const avatarImages = {
        panda: require("../assets/panda.png"),
        turtle: require("../assets/turtle.jpg"),
        giraffe: require("../assets/giraffe.jpg"),
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
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Section: Greeting and Progress Bar */}
            <View style={styles.topSection}>
                    {childName ? (
                        <Text style={styles.title}>Hello {childName}!</Text>
                    ) : (
                        <Text style={styles.title}>Hello Child!</Text>
                    )}
                    <Text style={styles.date}>{formattedDate}</Text>
                    <View style={styles.progressBarRow}>
                        <Icon name="star" style={{ color: "#ffea00", fontSize: 30 }} />
                        <View style={styles.progressBarContainer}>
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
                        <Text style={styles.progressText}>{childPoints}</Text>
                    </View>
                </View>
                {/* Middle Section: Avatar */}
                <View style={styles.avatarContainer}>
                    {/* Avatar Image */}
                    <Image
                        source={avatarImages[avatar] || avatarImages["panda"]}
                        style={styles.avatar}
                    />
                </View>
                {/* Bottom Section: Milestone Celebrations/task view?*/}
                <View style={styles.bottomSection}>
                    <Text style={styles.subtitle}>Milestone Celebrations</Text>
                    <View style={styles.milestone}>
                        <Ionicons name="trophy-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                        <View style={{ marginLeft: 2 }}>
                            <Text style={styles.milestoneText}>First Task Completed!</Text>
                            <Text style={styles.milestoneStatus}>Achieved</Text>
                        </View>
                    </View>
                    <View style={styles.milestone}>
                        <Ionicons name="star-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                        <View style={{ marginLeft: 2 }}>
                            <Text style={styles.milestoneText}>Collected 50 Stars!</Text>
                            <Text style={styles.milestoneStatus}>Achieved</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }
// ...existing code...

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d2d2d", marginTop: 5,textAlign: "center" },
    date: { fontSize: 14, color: "#666", textAlign: "center" },
    progressBarRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
    progressBarContainer: {  height: 12, borderRadius: 5, backgroundColor: "#ffffffff", overflow: "hidden", width: '80%', marginVertical: 10 },
    progressBar: { height: '100%', borderRadius: 5, backgroundColor: "#ffea00ff" },
    progressText: { fontSize: 12, color: "#333", marginLeft: 10 },
    avatarContainer: { alignItems: "center", marginVertical: 20 },
    avatar: { width: 300, height: 300, borderRadius: 10},
    bottomSection: { flex: 1, justifyContent: "flex-start" },
    subtitle: { fontSize: 16, color: "#2d2d2d", marginTop: 20, marginBottom: 10, textAlign: "left" },
    milestone: { flexDirection: "row", marginVertical: 5, borderColor: "#ccc", borderWidth: .5, borderRadius: 8, padding: 10, alignItems: "center" },
    milestoneText: { marginLeft: 10, fontSize: 14, color: "#333" },
    milestoneStatus: { marginLeft: 10,fontSize: 10, color: "#666", backgroundColor: "#e7ffd7ff", paddingVertical: 1, paddingHorizontal: 10, borderRadius: 10, textAlign: "center", alignSelf: "flex-start" },
});
