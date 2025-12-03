import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import { Modal, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
export default function ChildReward() {
    const auth = getAuth();
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
                const gradientPresets = [
                    ["#FF9A9E", "#FAD0C4"],
                    ["#A1C4FD", "#C2E9FB"],
                    ["#FBC2EB", "#A6C1EE"],
                    ["#FFDEE9", "#B5FFFC"],
                    ["#FBD786", "#f7797d"],
                    ["#84FAB0", "#8FD3F4"],
                ];

                const rewardList = querySnapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    title: doc.data().name || "Unnamed Reward",
                    cost: doc.data().points || 0,
                    description: doc.data().description || "",
                    gradient: gradientPresets[index % gradientPresets.length],
                }));
                setRewards(rewardList);
            } catch (error) {
                console.error("Error fetching rewards: ", error);
            }
        };

        fetchRewards();
    }, []);

    return (
        <View style={styles.container}>
<<<<<<< HEAD
            <ScrollView style={styles.ScrollView}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
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
=======
>>>>>>> 36ab196ec906d72587a2f05d906eafb8ef375b55

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




<<<<<<< HEAD
            <Text style={styles.unlockTitle}>Unlock More Items :</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unlockItemsRow}>
                <View style={[styles.unlockCircle, { backgroundColor: "#FFB6C1" }]}><Text style={styles.unlockItemIcon}>📱</Text></View>
                <View style={[styles.unlockCircle, { backgroundColor: "#A1C4FD" }]}><Text style={styles.unlockItemIcon}>👟</Text></View>
                <View style={[styles.unlockCircle, { backgroundColor: "#FAD0C4" }]}><Text style={styles.unlockItemIcon}>💄</Text></View>
                <View style={[styles.unlockCircle, { backgroundColor: "#84FAB0" }]}><Text style={styles.unlockItemIcon}>🥑</Text></View>
            </ScrollView>

           {/* <View style={styles.heartsRow}>
                <Text style={styles.heartsText}>❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️</Text>
            </View> */}

            <TouchableOpacity style={styles.characterButton}>
                <Text style={styles.characterButtonText}>Get different Character →</Text>
            </TouchableOpacity>

=======
>>>>>>> 36ab196ec906d72587a2f05d906eafb8ef375b55
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

    pointsRow: { alignItems: "center", marginTop: 12, marginBottom: 6, flexDirection: "row", justifyContent: "center" },
    starIcon: {
        fontSize: 24,
        marginRight: 6,
    },
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
        backgroundColor: "#fff",
        width: 140,
        borderRadius: 18,
        padding: 14,
        marginBottom: 190,
        alignItems: "center",
        justifyContent: "flex-start",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 2,
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
        fontSize: 18,
        textAlign: "center",
        marginBottom: 6,
        color: "#000",
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
    avatarContainer: {
        width: "100%",
        backgroundColor: "rgba(255, 223, 186, 0.35)",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 30,
        borderRadius: 20,
        marginBottom: 10
    },
    //missing modal styles that control the reward popup layout

    modalClaimButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadious: 10,
        marginTop: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadious: 4,
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
        fontSize: 40,
    },

    modalDesc: {
        fontSize: 14,
        textAlign: "center",
        marginVertical: 8,
        color: "#555",
    },

    modalPoints: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 12,
    },

    modalCloseButton: {
        backgroundColor: "#ccc",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadious: 10,
        marginTop: 8,
        color: "#4CAF50",
    },

    modalCloseText: {
        color: "#000",
        fontWeight: "600",
    },

    modalClaimText: {
        color: "#ffffffff",
        fontWeight: "600",
    },

});