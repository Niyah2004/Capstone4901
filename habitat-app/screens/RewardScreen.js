import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function RewardScreen({ route, navigation }) {
    const [rewards, setRewards] = useState([
        { id: 1, title: "Reward 1" },
        { id: 2, title: "Reward 2" },
        { id: 3, title: "Reward 3" },
        { id: 4, title: "Reward 4" },
        { id: 5, title: "Reward 5" },
    ]);

    return (
        <View style={styles.container}>
            <Text style={style.title}>Rewards</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F7F7F7",
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 10,
        color: "#2d2d2d"
    },
    rewardBox: {
        padding: 15,
        backgroundColor: "#fff",
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    rewardText: {
        fontSize: 18,
        fontWeight: "500",
    },
});
