import React, { useState, useMemo } from "react";
import WeekCalendar from "./WeekCalendar";
import { isSameDay, addDays } from "date-fns";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 👈 ADD THIS IMPORT

export default function ChildTask({ route, navigation }) {
    // temporarily disable these props to avoid undefined errors during demo
    const task = route?.params?.task || { title: "", description: "", isCompleted: false };

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [isCompleted, setIsCompleted] = useState(task.isCompleted);

    // selected date from WeekCalendar
    const [selectedDate, setSelectedDate] = useState(new Date());

    // sample tasks with dates — replace with your real data source (Firestore etc.)
    const tasks = [
        { id: 1, title: "Brush Teeth", points: 5, date: new Date() },
        { id: 2, title: "Do Homework", points: 10, date: addDays(new Date(), 0) },
        { id: 3, title: "Read a Book", points: 8, date: addDays(new Date(), 1) },
        { id: 4, title: "Feed the Fish", points: 3, date: addDays(new Date(), -1) },
    ];

    // tasks for the currently selected date
    const tasksForDate = useMemo(
        () => tasks.filter((t) => isSameDay(t.date, selectedDate)),
        [tasks, selectedDate]
    );

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