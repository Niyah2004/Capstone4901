import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Alert } from "react-native";
import { Modal, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

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

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Reward</Text>
            <View style={styles.RewardCard}>

                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.placeholderText}>Image</Text>
                </View>


                <View style={styles.pointsRow}>
                    <Text style={styles.pointsNumber}>{totalStars}</Text>
                    <Text style={styles.pointsLabel}>Star Points</Text>
                </View>


                <View style={styles.greetingRow}>
                    <Text style={styles.greetingTitle}>Amazing job, Lea! keep building those Habits</Text>
                </View>
            </View>
            <Text style={styles.sectionTitle}>Unlock more items:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsScrollContainer}>
                <View style={styles.itemsIconPlaceholder}>
                    <Text style={styles.placeholderText}>Item 1</Text>
                </View>
                <View style={styles.itemsIconPlaceholder}>
                    <Text style={styles.placeholderText}>Item 2</Text>
                </View>
                <View style={styles.itemsIconPlaceholder}>
                    <Text style={styles.placeholderText}>Item 3</Text>
                </View>
            </ScrollView>

    


            <Text style={styles.sectionTitle}>Available Rewards</Text>


            <ScrollView contentContainerStyle={styles.rewardsGrid}>
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
            <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.sparkleCircle}>
        <Text style={styles.sparkleEmoji}>🎉</Text>
      </View>
      <Text style={styles.modalTitle}>{selectedReward?.title}</Text>
      <Text style={styles.modalDesc}>{selectedReward?.description}</Text>
      <Text style={styles.modalPoints}>⭐ {selectedReward?.cost} Points</Text>

      <TouchableOpacity
        style={styles.claimButton}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.claimText}>Awesome!</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
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
        padding: 60,
        flexDirection: "row",
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

    pointsRow: { alignItems: "center", marginRight: 12, marginTop: 40, marginLeft: -40 },
    pointsNumber: { fontSize: 28, fontWeight: "700" },
    pointsLabel: { fontSize: 12, color: "#777" },
    greetingRow: { flex: 1, alignItems: "center", marginLeft: -160, marginTop: 140 },
    greetingTitle: { fontSize: 16, fontWeight: "600" },

    switchButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: "center",
        marginBottom: 18,
    },
    switchButtonText: { color: "#fff", fontWeight: "600" },

    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },

    rewardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingBottom: 40,
    },
    rewardCard: {
        backgroundColor: "#fff",
        width: "48%",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
        elevation: 2,
    },
    rewardIconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: "#EDEDED",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    rewardTitle: { fontWeight: "600", textAlign: "center", marginBottom: 6 },
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
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
      },
      modalContainer: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 5,
      },
      modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 10,
        textAlign: "center",
        color: "#4CAF50",
      },
      modalImagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#E8F5E9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 15,
      },
      modalImageText: { fontSize: 40 },
      modalDesc: {
        fontSize: 16,
        textAlign: "center",
        color: "#555",
        marginBottom: 10,
      },
      modalPoints: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FF9800",
        marginBottom: 20,
      },
      modalCloseButton: {
        backgroundColor: "#4CAF50",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 30,
      },
      modalCloseText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
      },
      sparkleCircle: {
        backgroundColor: "#E8F5E9",
        borderRadius: 60,
        width: 120,
        height: 120,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
      },
      sparkleEmoji: {
        fontSize: 50,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      },
      modalContainer: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 25,
        padding: 25,
        alignItems: "center",
        elevation: 10,
      },
      modalTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#4CAF50",
        marginBottom: 8,
      },
      modalDesc: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginBottom: 12,
      },
      modalPoints: {
        fontSize: 18,
        color: "#FF9800",
        fontWeight: "600",
        marginBottom: 25,
      },
      claimButton: {
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 35,
      },
      claimText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
      },
});
