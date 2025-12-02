import React, { useState, useEffect } from "react";
import WeekCalendar from "./WeekCalendar";
import { addDays, startOfDay } from "date-fns";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons
import { collection, query, where, onSnapshot, Timestamp, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

export default function ChildTask({ route, navigation }) {
    // temporarily disable these props to avoid undefined errors during demo
    const childId = route?.params?.childId;

    const task = route?.params?.task || { title: "", description: "", isCompleted: false };

    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [isCompleted, setIsCompleted] = useState(task.isCompleted);

    // selected date from WeekCalendar
    const [selectedDate, setSelectedDate] = useState(new Date());

    // real tasks loaded for the selected date (from Firestore)
    const [tasksForDate, setTasksForDate] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    // current child's id (from auth). If children use the same auth, this will be the child's uid.
    //const currentChildId = getAuth().currentUser?.uid || null;
    const currentChildId = route?.params?.childId;

    // Mark task as complete for child, then send parent approval request
    const markingCompletee = async (taskId, currentStatus) => {
        try {
            // Step 1: mark as completed for child
            await updateDoc(doc(db, "tasks", taskId), {
                completed: true,
                completedAt: serverTimestamp(),
                completedByChildId: currentChildId || null,
            });

            // Step 2: send parent approval request (optional, can be triggered after)
            await updateDoc(doc(db, "tasks", taskId), {
                pendingApproval: true,
                completionRequestedAt: serverTimestamp(),
            });

            // Find the task's ownerId from tasksForDate
            const task = tasksForDate.find(t => t.id === taskId);
            if (task && task.ownerId) {
                await addDoc(collection(db, "notifications"), {
                    toUserId: task.ownerId,
                    fromChildId: currentChildId || null,
                    taskId: taskId,
                    type: "completion_request",
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }
        } catch (err) {
            console.error("Error requesting approval:", err);
        }
    };

    const handleMarkComplete = async (task) => {
        try {
            // mark task as awaiting parent approval
            await updateDoc(doc(db, "tasks", task.id), {
                pendingApproval: true,
                completionRequestedAt: serverTimestamp(),
                completedByChildId: currentChildId || null,
            });

            // create a lightweight notification for the parent (so parents can show a notifications feed if desired)
            if (task.ownerId) {
                await addDoc(collection(db, "notifications"), {
                    toUserId: task.ownerId,
                    fromChildId: currentChildId || null,
                    taskId: task.id,
                    type: "completion_request",
                    createdAt: serverTimestamp(),
                    read: false,
                });
            }
        } catch (err) {
            console.error("Error requesting approval:", err);
        }
    };

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
        // query single-instance tasks for the selected date
        const unsubDate = onSnapshot(q, snapshot => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // sort tasks so that:
            // - not completed & not pendingApproval come first
            // - pendingApproval (waiting for parent) come next
            // - verified / rejected come last
            list.sort((a, b) => {
                const score = (t) => {
                    if (t.verified) return 3;
                    if (t.rejected) return 3;
                    if (t.pendingApproval) return 2;
                    return 1;
                };
                const sa = score(a);
                const sb = score(b);
                if (sa !== sb) return sa - sb;
                // fallback: preserve insertion/order by points (desc) then title
                if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
                return (a.title || "").localeCompare(b.title || "");
            });
            // we'll set tasks after merging with recurring tasks (handled below)
            setTasksForDate(prev => {
                // temporarily set date-only tasks; merging happens in recurring handler
                return list;
            });
            setLoadingTasks(false);
        }, err => {
            console.error("tasks onSnapshot error", err);
            setLoadingTasks(false);
        });

        // query recurring tasks assigned to this child
        let unsubRecurring = () => { };
        if (currentChildId) {
            const qRec = query(collection(db, "tasks"), where("childId", "==", currentChildId), where("isRecurring", "==", true));
            unsubRecurring = onSnapshot(qRec, snap => {
                const recs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                // filter recurring tasks to those that occur on selectedDate
                const occurs = recs.filter(r => {
                    try { return occursOnDate(r, selectedDate); } catch (e) { return false; }
                });

                // merge with date-specific tasks already stored in state
                setTasksForDate(prevDateTasks => {
                    const map = new Map();
                    (prevDateTasks || []).forEach(t => map.set(t.id, t));
                    occurs.forEach(t => map.set(t.id, t));
                    const merged = Array.from(map.values());
                    // apply same sorting as before
                    merged.sort((a, b) => {
                        const score = (t) => {
                            if (t.verified) return 3;
                            if (t.rejected) return 3;
                            if (t.pendingApproval) return 2;
                            return 1;
                        };
                        const sa = score(a);
                        const sb = score(b);
                        if (sa !== sb) return sa - sb;
                        if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
                        return (a.title || "").localeCompare(b.title || "");
                    });
                    return merged;
                });
            }, err => console.error('recurring onSnapshot error', err));
        }

        return () => { try { unsubDate(); } catch { }; try { unsubRecurring(); } catch { } };
    }, [selectedDate]);


    // Helper: determine if a recurring task occurs on a specific date
    const occursOnDate = (task, date) => {
        if (!task || !task.recurrence) return false;
        const r = task.recurrence;
        const start = (r.startDate && r.startDate.toDate) ? r.startDate.toDate() : (task.dateTimestamp && task.dateTimestamp.toDate ? task.dateTimestamp.toDate() : null);
        if (!start) return false;

        // end conditions
        if (r.endType === 'until' && r.until && r.until.toDate) {
            const until = r.until.toDate();
            if (date > until) return false;
        }
        if (r.count) {
            // rough check: if date is before start, false
            if (date < start) return false;
        }

        const interval = r.interval || 1;
        const freq = r.frequency || 'weekly';

        const dayDiff = Math.floor((startOfDay(date) - startOfDay(start)) / (1000 * 60 * 60 * 24));

        if (freq === 'daily') {
            if (dayDiff < 0) return false;
            return (dayDiff % interval) === 0;
        }

        if (freq === 'weekly') {
            // daysOfWeek: 0=Mon .. 6=Sun
            const dow = (date.getDay() + 6) % 7; // convert JS 0=Sun to 0=Mon
            if (!(r.daysOfWeek && r.daysOfWeek.length)) return false;
            if (!r.daysOfWeek.includes(dow)) return false;
            // check week interval
            const weeks = Math.floor(dayDiff / 7);
            return weeks >= 0 && (weeks % interval) === 0;
        }

        if (freq === 'monthly') {
            // basic: same day of month
            const startDay = start.getDate();
            if (date.getDate() !== startDay) return false;
            const months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
            return months >= 0 && (months % interval) === 0;
        }

        return false;
    };

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

                            {/*<TouchableOpacity style={styles.completeButton} 
                                onPress={() => markingComplete(task)}>
                                <Ionicons name="checkbox-outline" size={16} color="#4CAF50" />
                                <Text style={styles.complete}> Task complete</Text>
                            </TouchableOpacity>
                            */}

                            <TouchableOpacity
                                style={styles.completeButton}
                                onPress={() => markingCompletee(task.id, task.completed)}
                            >
                                <Ionicons
                                    name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                                    size={26}
                                    color={task.completed ? "#4CAF50" : "#999"}
                                />
                                <Text style={styles.completeText}>
                                    {task.completed ? "Completed" : "Mark Complete"}
                                </Text>
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