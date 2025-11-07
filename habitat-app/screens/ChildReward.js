import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Alert } from "react-native";
import { Modal, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal } from "react-native";
import {Alert} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {db} from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
export default function ChildReward() {
    // Temporary placeholder state (can be replaced with fetched data later)
    const [totalStars, setTotalStars] = useState(257);
    const [rewards, setRewards] = useState([]);
    const [selectedReward, setSelectedReward] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const confettiRef = useRef(null);
    
    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "rewards"));
                const rewardList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().name || "Unnamed Reward",
                    cost: doc.data().points || 0,
                    description: doc.data().description || "",
                }));
                setRewards(rewardList);
            } catch (error) {
                console.error("Error fetching rewards: ", error);
            }
        };

        fetchRewards();
    }, []);

    const handleClaimReward = async () => {
        //fetch points from backend to add them to the already earned points
        //points are currently a placeholder
        if (!selectedReward) return;

       try{
        const userRef = doc(db, "users", "childUserId");
        await updateDoc(userRef, {
            stars: totalStars - selectedReward.cost,
        });

        setTotalStars((prev) => prev - selectedReward.cost);

        Alert.alert("Success!", `You claimed: ${selectedReward.title}`);
         console.log("Reward claimed: ", selectedReward.title);
       } 
       catch(error){
        console.error("Error claiming reward: ", error);
        Alert.alert("Error", "Something went wrong while claiming the reward.");
       }
       finally {
        setModalVisible(false);
       }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Reward</Text>
            <View style={styles.RewardCard}>

                <View style={styles.avatarContainer}>
                    {/* Avatar Image */}
                    <Image
                        source={require("../assets/panda.png")} //Avatar image path
                        style={styles.avatar}
                    />
                </View>

                {/*
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.placeholderText}>Image</Text>
                </View>
                    */}

                <View style={styles.pointsRow}>
                    <Text style={styles.pointsNumber}>{totalStars}</Text>
                    <Text style={styles.pointsLabel}>Star Points</Text>
                </View>


                <View style={styles.greetingRow}>
                    <Text style={styles.greetingTitle}>Amazing job, Lea! keep building those Habits</Text>
                </View>
            </View>




            <Text style={styles.sectionTitle}>Available Rewards</Text>


            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsScrollContainer}>
                {rewards.map((reward) => (
                    <View key={reward.id} style={styles.rewardCard}>

                        <View style={styles.rewardIconPlaceholder}>
                            <Text style={styles.placeholderText}>Icon</Text>
                        </View>
            <Modal
                            animationType="slide"
                            transparent={true}
                            visible={modalVisible}
                            onShow={() => confettiRef.current?.start()} // 💥 fire confetti when modal appears
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>

                                    <ConfettiCannon
                                        ref={confettiRef}
                                        count={60}
                                        origin={{ x: 200, y: -20 }}
                                        autoStart={false}
                                        fadeOut={true}
                                    />

                                    <Text style={styles.modalTitle}>{selectedReward?.title}</Text>

                                    <View style={styles.modalImagePlaceholder}>
                                        <Text style={styles.modalImageText}>🎁</Text>
                                    </View>

                                    <Text style={styles.modalDesc}>
                                        {selectedReward?.description || "No description provided."}
                                    </Text>
                                    <Text style={styles.modalPoints}>
                                        ⭐ {selectedReward?.cost} Points
                                    </Text>


                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.modalCloseText}>Close</Text>
                                    </TouchableOpacity>

                                {/*claim button */}
                                    <TouchableOpacity
                                    style={styles.modalClaimButton}
                                    
                                    onPress={handleClaimReward}
                                        //setModalVisible(false)}
                                        //make it update the firebase
                                    >
                                        <Text style ={styles.modalClaimText}>Claim</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
            </Modal>

                        <Text style={styles.rewardTitle}>{reward.title}</Text>
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
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F7F7F7", paddingHorizontal: 20, paddingTop: 48 },
    title: {
        fontSize: 22,
        fontWeight: "600",
        alignItems: "center",
        marginBottom: 10,
        marginLeft: 140
    },

    RewardCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        /* stack contents vertically so avatar sits at the top center */
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 10, height: 10 },
        shadowRadius: 6,
        elevation: 3,
    },

    avatarPlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#EDEDED",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 50,
        marginBottom: 100,
    },
    placeholderText: {
        fontSize: 10,
        color: "#999",
    },

    pointsRow: { alignItems: "center", marginTop: 12, marginBottom: 6 },
    pointsNumber: { fontSize: 28, fontWeight: "700" },
    pointsLabel: { fontSize: 12, color: "#777" },
    greetingRow: { alignItems: "center", marginTop: 8 },
    greetingTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },

    switchButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 18,
    },
    switchButtonText: { color: "#fff", fontWeight: "600" },

    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },

    rewardsScrollContainer: {
        flexDirection: "row",
        paddingBottom: 20,
        paddingHorizontal: 4,
    },
    itemsScrollContainer: {
        flexDirection: "row",
        paddingBottom: 12,
        paddingHorizontal: 4,
    },
    rewardCard: {
        backgroundColor: "#fff",
        width: 160,
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        alignItems: "center",
        marginRight: 12,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
        elevation: 2,
    },
    rewardIconPlaceholder: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: "#EDEDED",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    rewardTitle: { fontWeight: "500", textAlign: "center", marginBottom: 6 },
    rewardCost: { fontSize: 12, color: "#777", marginBottom: 8 },
    rewardAction: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    rewardActionText: { color: "#4CAF50", fontWeight: "600" },
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
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarContainer: {
        alignItems: "center",
        /* center horizontally and keep at the top of the card */
        alignSelf: "center",
        marginTop: 6,
        marginBottom: 6,
    },
});