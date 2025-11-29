import React, { useState, useEffect } from "react";
import WeekCalendar from "./WeekCalendar";
import { addDays, startOfDay } from "date-fns";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ChildTask({ route, navigation }) {
    // temporarily disable these props to avoid undefined errors during demo
    const task = route?.params?.task || { title: "", description: "", isCompleted: false };

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [isCompleted, setIsCompleted] = useState(task.isCompleted);

    // selected date from WeekCalendar
    const [selectedDate, setSelectedDate] = useState(new Date());

    // real tasks loaded for the selected date (from Firestore)
    const [tasksForDate, setTasksForDate] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    // If you support multiple children, set this to the current child's id (e.g. from auth/profile)
    const currentChildId = null; // replace with real child id when available

    useEffect(() => {
        if (!selectedDate) return;
        setLoadingTasks(true);

        const start = startOfDay(selectedDate);
        const end = addDays(start, 1);

        // Build query constraints
        const constraints = [
            where("dateTimestamp", ">=", Timestamp.fromDate(start)),
            where("dateTimestamp", "<", Timestamp.fromDate(end)),
        ];
        if (currentChildId) constraints.unshift(where("childId", "==", currentChildId));

        const q = query(collection(db, "tasks"), ...constraints);

        const unsub = onSnapshot(q, snapshot => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setTasksForDate(list);
            setLoadingTasks(false);
        }, err => {
            console.error("tasks onSnapshot error", err);
            setLoadingTasks(false);
        });

        return () => unsub();
    }, [selectedDate]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Today's Tasks</Text>

            <View style={styles.calendarContainer}>
                <View style={{ flex: 10 }}>
                    <WeekCalendar
                        date={selectedDate}
                        onChange={(newdate) => setSelectedDate(newdate)}
                    />
                </View>
            </View>


            {/* Week days bar */}
            {/* <View style={styles.weeksContainer}>
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
        */}
            {/* Task list */}
            <Text style={{ marginTop: 6, marginBottom: 6, fontWeight: '600' }}>
                Tasks for {selectedDate.toDateString()}
            </Text>
            <ScrollView style={{ marginTop: 10 }}>
                {tasksForDate.length === 0 ? (
                    <View style={styles.taskBox}>
                        <Text style={{ textAlign: 'center', color: '#777' }}>No tasks for this date.</Text>
                    </View>
                ) : (
                    tasksForDate.map((task) => (
                        <View key={task.id} style={styles.taskBox}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <Text style={styles.points}>{task.points} pts</Text>
                            </View>

                            <View style={styles.Progress}>
                                <View style={[styles.progressFill, { width: "50%" }]} />
                            </View>

                            <TouchableOpacity style={styles.completeButton}>
                                <Ionicons name="checkbox-outline" size={16} color="#4CAF50" />
                                <Text style={styles.complete}> Mark as complete</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
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
    calendarContainer: {
        flexDirection: "row",
        alignItems: "center",
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