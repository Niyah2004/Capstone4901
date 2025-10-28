import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
export default function ChildReward() {
    // Temporary placeholder state (can be replaced with fetched data later)
    const [totalStars, setTotalStars] = useState(257);
    const [rewards, setRewards] = useState([
        { id: 1, title: "Reward 1", cost: 100 },
        { id: 2, title: "Reward 2", cost: 250 },
        { id: 3, title: "Reward 3", cost: 150 },
        { id: 4, title: "Reward 4", cost: 80 },
    ]);

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

            <TouchableOpacity style={styles.switchButton}>
                <Text style={styles.switchButtonText}>Get Different Character →</Text>
            </TouchableOpacity>


            <Text style={styles.sectionTitle}>Available Rewards</Text>


            <ScrollView contentContainerStyle={styles.rewardsGrid}>
                {rewards.map((reward) => (
                    <View key={reward.id} style={styles.rewardCard}>

                        <View style={styles.rewardIconPlaceholder}>
                            <Text style={styles.placeholderText}>Icon</Text>
                        </View>


                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        <Text style={styles.rewardCost}>{reward.cost} Stars</Text>


                        <TouchableOpacity style={styles.rewardAction}>
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
    }
});