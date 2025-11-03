import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
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

            <TouchableOpacity style={styles.switchButton}>
                <Text style={styles.switchButtonText}>Get Different Character →</Text>
            </TouchableOpacity>


            <Text style={styles.sectionTitle}>Available Rewards</Text>


            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsScrollContainer}>
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
        marginRight: 12,
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 10
    },
    avatarContainer: {
        alignItems: "center",
        /* center horizontally and keep at the top of the card */
        alignSelf: "center",
        marginTop: 6,
        marginBottom: 6,
    },
});
