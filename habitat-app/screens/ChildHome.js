// this is the child home page import code here 
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function ChildHome() {
    const [childName, setChildName] = useState("");
    const [avatar, setAvatar] = useState("panda"); // default avatar
    const [loading, setLoading] = useState(true);
    const [progress] = useState(new Animated.Value(150));

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
                                            inputRange: [0, 150],
                                            outputRange: ['0%', '100%']
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>150</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", color: "#2d2d2d", marginTop: 5,textAlign: "center" },
    date: { fontSize: 14, color: "#666", textAlign: "center", width: "100%" },
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