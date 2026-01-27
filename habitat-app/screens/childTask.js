import React, { useState, useEffect, useCallback } from "react";
import WeekCalendar from "./WeekCalendar";
import { addDays, startOfDay } from "date-fns";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  serverTimestamp,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

import Slider from "@react-native-community/slider";


export default function ChildTask({ route, navigation }) {
  const childId = route?.params?.childId;
  const currentChildUid = getAuth().currentUser?.uid;
  const pointsChildId = childId || currentChildUid;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // store child points locally (and keep it in sync with Firestore)
  const [childPoints, setChildPoints] = useState(0);


  const occursOnDate = useCallback((task, date) => {
    if (!task || !task.recurrence) return false;
    const r = task.recurrence;

    const start =
      (r.startDate && r.startDate.toDate) ? r.startDate.toDate()
      : (task.dateTimestamp && task.dateTimestamp.toDate) ? task.dateTimestamp.toDate()
      : null;

    if (!start) return false;

    if (r.endType === "until" && r.until?.toDate) {
      const until = r.until.toDate();
      if (date > until) return false;
    }

    const interval = r.interval || 1;
    const freq = r.frequency || "weekly";
    const dayDiff = Math.floor((startOfDay(date) - startOfDay(start)) / (1000 * 60 * 60 * 24));

    if (freq === "daily") {
      if (dayDiff < 0) return false;
      return (dayDiff % interval) === 0;
    }

    if (freq === "weekly") {
      const dow = (date.getDay() + 6) % 7; // JS Sunday->6, Monday->0
      if (!Array.isArray(r.daysOfWeek) || r.daysOfWeek.length === 0) return false;
      if (!r.daysOfWeek.includes(dow)) return false;

      const weeks = Math.floor(dayDiff / 7);
      return weeks >= 0 && (weeks % interval) === 0;
    }

    if (freq === "monthly") {
      const startDay = start.getDate();
      if (date.getDate() !== startDay) return false;
      const months = (date.getFullYear() - start.getFullYear()) * 12 + (date.getMonth() - start.getMonth());
      return months >= 0 && (months % interval) === 0;
    }

    return false;
  }, []);


  useEffect(() => {
    if (!navigation || !selectedDate) return;

    const today = new Date();
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    navigation.setOptions({ title: isToday ? "Today's Tasks" : `${dayName}'s Tasks` });
  }, [selectedDate, navigation]);

  // Keep childPoints synced from Firestore
  useEffect(() => {
    if (!pointsChildId) return;

    const childPointsRef = doc(db, "childPoints", pointsChildId);
    const unsub = onSnapshot(childPointsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const balance = data.points ?? data.stars ?? data.totalPoints ?? 0;
        setChildPoints(balance);
      } else {
        setChildPoints(0);
      }
    });

    return () => unsub();
  }, [pointsChildId]);

  // Load tasks (date-specific + recurring)
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingTasks(true);

    const start = startOfDay(selectedDate);
    const end = addDays(start, 1);

    const constraints = [
      where("dateTimestamp", ">=", Timestamp.fromDate(start)),
      where("dateTimestamp", "<", Timestamp.fromDate(end)),
    ];
    if (childId) constraints.unshift(where("childId", "==", childId));

    const qDate = query(collection(db, "tasks"), ...constraints);

    const unsubDate = onSnapshot(
      qDate,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // ensure progressPercent is always defined for UI
            progressPercent:
              typeof data.progressPercent === "number"
                ? data.progressPercent
                : data.completed
                ? 100
                : 0,
          };
        });

        setTasksForDate(list);
        setLoadingTasks(false);
      },
      (err) => {
        console.error("tasks onSnapshot error", err);
        setLoadingTasks(false);
      }
    );

    let unsubRecurring = () => {};
    if (currentChildUid) {
      const qRec = query(
        collection(db, "tasks"),
        where("userId", "==", currentChildUid),
        where("isRecurring", "==", true)
      );

      unsubRecurring = onSnapshot(qRec, (snap) => {
        const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const occurs = recs
          .filter((r) => occursOnDate(r, selectedDate))
          .map((r) => ({
            ...r,
            progressPercent:
              typeof r.progressPercent === "number" ? r.progressPercent : r.completed ? 100 : 0,
          }));

        setTasksForDate((prev) => {
          const map = new Map();
          (prev || []).forEach((t) => map.set(t.id, t));
          occurs.forEach((t) => map.set(t.id, t));
          return Array.from(map.values());
        });
      });
    }

    return () => {
      try { unsubDate(); } catch {}
      try { unsubRecurring(); } catch {}
    };
  }, [selectedDate, childId, currentChildUid, occursOnDate]);

  // UI-only live update while sliding (no Firestore spam)
  const updateProgressLocal = (taskId, value) => {
    setTasksForDate((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, progressPercent: value } : t))
    );
  };

  //  Persist progress to Firestore when sliding stops
  const persistProgress = async (taskId, value) => {
    try {
      await runTransaction(db, async (tx) => {
        const taskRef = doc(db, "tasks", taskId);
        tx.update(taskRef, { progressPercent: value });
      });
    } catch (e) {
      console.error("Error saving progress:", e);
    }
  };
/*
  //  Complete task + award points to childPoints (transaction prevents double-award)
  const markTaskComplete = async (task) => {
    if (!task?.id || !currentChildUid) return;

    try {
      await runTransaction(db, async (tx) => {
        const taskRef = doc(db, "tasks", task.id);
        const taskSnap = await tx.get(taskRef);

        if (!taskSnap.exists()) return;

        const current = taskSnap.data();
        if (current.completed === true) return; // 🚫 already completed -> no double points

        const pointsToAdd = Number(task.points || 0);

        // Update task
        tx.update(taskRef, {
          completed: true,
          completedAt: serverTimestamp(),
          completedByChildId: currentChildUid,
          pendingApproval: true,
          completionRequestedAt: serverTimestamp(),
          progressPercent: 100,
        });

        // Update child points
        const childRef = doc(db, "children", currentChildUid); // <-- change if needed
        tx.set(childRef, { points: increment(pointsToAdd) }, { merge: true });

        // Add parent notification if owner exists
        if (current.ownerId) {
          const notifRef = doc(collection(db, "notifications"));
          tx.set(notifRef, {
            toUserId: current.ownerId,
            fromChildId: currentChildUid,
            taskId: task.id,
            type: "completion_request",
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      });

      // Local UI will update from snapshots, but this makes it feel instant:
      setChildPoints((p) => p + Number(task.points || 0));
    } catch (err) {
      console.error("Error completing task + awarding points:", err);
    }
  };
*/
const markTaskComplete = async (task) => {
  if (!task?.id || !currentChildUid) return;

  try {
    await runTransaction(db, async (tx) => {
      const taskRef = doc(db, "tasks", task.id);
      const taskSnap = await tx.get(taskRef);
      if (!taskSnap.exists()) return;

      const current = taskSnap.data();

      // already requested/complete -> don’t spam updates
      if (current.pendingApproval === true || current.verified === true) return;

      tx.update(taskRef, {
        completed: true, // child checked it off
        completedAt: serverTimestamp(),
        completedByChildId: currentChildUid,
        pendingApproval: true, // parent needs to verify
        completionRequestedAt: serverTimestamp(),
        progressPercent: 100,
        status: "pendingApproval", // optional, but helpful
      });

      // parent notification
      if (current.ownerId) {
        const notifRef = doc(collection(db, "notifications"));
        tx.set(notifRef, {
          toUserId: current.ownerId,
          fromChildId: currentChildUid,
          taskId: task.id,
          type: "completion_request",
          createdAt: serverTimestamp(),
          read: false,
        });
      }
    });
  } catch (err) {
    console.error("Error requesting approval:", err);
  }
};

  const titleForDate = (() => {
    const today = new Date();
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();
    if (isToday) return "Today's Tasks";
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    return `${dayName}'s Tasks`;
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Tasks</Text>

      {/* Optional display so you can see points stacking */}
      <Text style={styles.pointsTotal}>My Points: {childPoints}</Text>

      <View style={styles.calendarContainer}>
        <View style={{ flex: 10 }}>
          <WeekCalendar date={selectedDate} onChange={(d) => setSelectedDate(d)} />
        </View>
      </View>

      <Text style={styles.sectionHeader}>{titleForDate}</Text>

      <ScrollView style={{ marginTop: 10 }}>
        {loadingTasks ? (
          <View style={styles.taskBox}>
            <Text style={{ textAlign: "center", color: "#777" }}>Loading...</Text>
          </View>
        ) : tasksForDate.length === 0 ? (
          <View style={styles.taskBox}>
            <Text style={{ textAlign: "center", color: "#777" }}>No tasks for this date.</Text>
          </View>
        ) : (
          tasksForDate.map((task) => {
            const progress = Math.max(0, Math.min(100, Number(task.progressPercent || 0)));

            return (
              <View key={task.id} style={styles.taskBox}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.points}>{task.points} pts</Text>
                </View>

                <Slider
                  value={progress}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  disabled={task.completed}
                  onValueChange={(val) => updateProgressLocal(task.id, val)}
                  onSlidingComplete={(val) => persistProgress(task.id, val)}
                  minimumTrackTintColor="#4CAF50"   // green filled part
                  maximumTrackTintColor="#E0E0E0"   // gray remaining part
                  thumbTintColor="#4CAF50"
               
                />
                <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
                <View style={styles.progressContainer}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>

                {/* ✅ Complete button actually works + awards points */}
                <TouchableOpacity
                  style={[styles.completeButton, task.completed && styles.completeButtonDisabled]}
                  disabled={task.completed}
                  onPress={() => markTaskComplete(task)}
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
            );
          })
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
    marginBottom: 6,
  },
  pointsTotal: {
    fontSize: 14,
    color: "#4CAF50",
    marginBottom: 10,
    fontWeight: "600",
  },
  calendarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 6,
    fontWeight: "600",
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
sliderRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
slider: { flex: 1, height: 40, marginRight: 10 },
percentText: { width: 52, textAlign: "right", fontWeight: "600", color: "#4CAF50" },

  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeText: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#333",
  },
});
