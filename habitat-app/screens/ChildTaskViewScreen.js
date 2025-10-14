import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 👈 ADD THIS IMPORT

export default function ChildTaskViewScreen({ route, navigation }) {
    // temporarily disable these props to avoid undefined errors during demo
    const task = route?.params?.task || { title: "", description: "", isCompleted: false };

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [isCompleted, setIsCompleted] = useState(task.isCompleted);
    const demoTasks = new Array(10).fill(null);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Today's Tasks</Text>

            {/* Week days bar */}
            <View style={styles.weeksContainer}>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                    <View
                        key={index}
                        style={[styles.dayCircle, index === 4 && styles.presentDay]} // highlight "Friday"
                    >
                        <Text
                            style={[styles.dayText, index === 4 && styles.presentDateText]}
                        >
                            {day}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Task list */}
            <ScrollView style={{ marginTop: 10 }}>
                {demoTasks.map((_, index) => (
                    <View key={index} style={styles.taskBox}>
                        <View style={styles.taskHeader}>
                            <Text style={styles.taskTitle}>Task {index + 1}</Text>
                            <Text style={styles.points}>10 pts</Text>
                        </View>

                        <View style={styles.Progress}>
                            <View style={[styles.progressFill, { width: "50%" }]} />
                        </View>

                        <TouchableOpacity style={styles.completeButton}>
                            <Ionicons name="checkbox-outline" size={16} color="#4CAF50" />
                            <Text style={styles.complete}> Mark as complete</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F7F7",
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 10,
    },
    weeksContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#E0E0E0",
    },
    presentDay: {
        backgroundColor: "#4CAF50",
    },
    dayText: {
        fontSize: 16,
        color: "#333",
    },
    presentDateText: {
        color: "#fff",
        fontWeight: "bold",
    },
    taskBox: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    taskHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: "500",
    },
    points: {
        fontSize: 16,
        color: "#4CAF50",
    },
    Progress: {
        height: 8,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 10,
    },
    progressFill: {
        height: 8,
        backgroundColor: "#4CAF50",
        borderRadius: 4,
    },
    completeButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    complete: {
        color: "#4CAF50",
        fontWeight: "bold",
        marginLeft: 5,
    },
});
