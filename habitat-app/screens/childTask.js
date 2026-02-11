import React, { useState, useEffect, useCallback, useRef } from "react";
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
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";

import Slider from "@react-native-community/slider";
import { useTheme } from "../theme/ThemeContext";
import { endOfDay } from "date-fns";


export default function ChildTask({ route, navigation }) {
  const childId = route?.params?.childId;
  const currentChildUid = getAuth().currentUser?.uid;
  const pointsChildId = childId || currentChildUid;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [childDocId, setChildDocId] = useState(null);
  const { theme } = useTheme();
  const colors = theme.colors;

  // store child points locally (and keep it in sync with Firestore)
  const [childPoints, setChildPoints] = useState(0);
  const taskBucketsRef = useRef({
    dateUser: [],
    dateChild: [],
    recUser: [],
    recChild: [],
  });

  const recomputeTasksForDate = useCallback(() => {
    const buckets = taskBucketsRef.current;
    const map = new Map();
    [buckets.dateUser, buckets.dateChild, buckets.recUser, buckets.recChild].forEach(
      (list) => (list || []).forEach((t) => map.set(t.id, t))
    );
    setTasksForDate(Array.from(map.values()));
  }, []);


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

  // Resolve child document id when running as the child user
  useEffect(() => {
    if (!currentChildUid || childId) return;

    let cancelled = false;
    const q = query(collection(db, "children"), where("userId", "==", currentChildUid));
    getDocs(q)
      .then((snap) => {
        if (cancelled) return;
        const docMatch = snap.docs[0];
        setChildDocId(docMatch ? docMatch.id : null);
      })
      .catch((err) => console.error("child doc lookup error", err));

    return () => {
      cancelled = true;
    };
  }, [currentChildUid, childId]);

  // Load tasks (date-specific + recurring)
  useEffect(() => {
    if (!selectedDate) return;
    if (!childId && !currentChildUid) return;
    setLoadingTasks(true);
    taskBucketsRef.current = { dateUser: [], dateChild: [], recUser: [], recChild: [] };

    // Fix: define unsubscribers array
    let unsubscribers = [];

    const start = Timestamp.fromDate(startOfDay(selectedDate));
    const end = Timestamp.fromDate(endOfDay(selectedDate));

    const constraints = [
      where("dateTimestamp", ">=", start),
      where("dateTimestamp", "<=", end),
    ];

    if (childId) {
      constraints.unshift(where("childId", "==", childId));
    } else if (currentChildUid) {
      constraints.unshift(where("userId", "==", currentChildUid));
    }

    const qDate = query(collection(db, "tasks"), ...constraints);

    // DEBUG: Log query parameters
    console.log("[DEBUG] Querying tasks for:", {
      selectedDate: selectedDate && selectedDate.toISOString ? selectedDate.toISOString() : selectedDate,
      start: start && start.toISOString ? start.toISOString() : start,
      end: end && end.toISOString ? end.toISOString() : end,
      childId,
      currentChildUid,
      constraints,
    });

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

        // DEBUG: Log fetched tasks
        console.log("[DEBUG] Tasks fetched for date:", selectedDate.toISOString(), list);

        setTasksForDate(list);
        setLoadingTasks(false);
      },
      (err) => {
        console.error("tasks onSnapshot error", err);
        setLoadingTasks(false);
      }
    );

    unsubscribers.push(unsubDate);

    if (childId) {
      const qRec = query(
        collection(db, "tasks"),
        where("childId", "==", childId),
        where("isRecurring", "==", true)
      );

      unsubscribers.push(
        onSnapshot(qRec, (snap) => {
          const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          taskBucketsRef.current.recChild = recs
            .filter((r) => occursOnDate(r, selectedDate))
            .map((r) => ({
              ...r,
              progressPercent:
                typeof r.progressPercent === "number" ? r.progressPercent : r.completed ? 100 : 0,
            }));
          recomputeTasksForDate();
        })
      );
    } else if (currentChildUid) {
      const qRecUser = query(
        collection(db, "tasks"),
        where("userId", "==", currentChildUid),
        where("isRecurring", "==", true)
      );

      unsubscribers.push(
        onSnapshot(qRecUser, (snap) => {
          const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          taskBucketsRef.current.recUser = recs
            .filter((r) => occursOnDate(r, selectedDate))
            .map((r) => ({
              ...r,
              progressPercent:
                typeof r.progressPercent === "number" ? r.progressPercent : r.completed ? 100 : 0,
            }));
          recomputeTasksForDate();
        })
      );

      if (childDocId) {
        const qRecChild = query(
          collection(db, "tasks"),
          where("childId", "==", childDocId),
          where("isRecurring", "==", true)
        );

        unsubscribers.push(
          onSnapshot(qRecChild, (snap) => {
            const recs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            taskBucketsRef.current.recChild = recs
              .filter((r) => occursOnDate(r, selectedDate))
              .map((r) => ({
                ...r,
                progressPercent:
                  typeof r.progressPercent === "number" ? r.progressPercent : r.completed ? 100 : 0,
              }));
            recomputeTasksForDate();
          })
        );
      }
    }

    return () => {
      unsubscribers.forEach((unsub) => {
        try { if (typeof unsub === 'function') unsub(); } catch { }
      });
    };
  }, [selectedDate, childId, currentChildUid, childDocId, occursOnDate, recomputeTasksForDate]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Today's Tasks</Text>

      {/* Optional display so you can see points stacking */}
      <Text style={[styles.pointsTotal, { color: colors.primary }]}>My Points: {childPoints}</Text>

      <View style={styles.calendarContainer}>
        <View style={{ flex: 10 }}>
          <WeekCalendar date={selectedDate} onChange={(d) => setSelectedDate(d)} />
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.text }]}>{titleForDate}</Text>

      <ScrollView style={{ marginTop: 10 }}>
        {loadingTasks ? (
          <View style={[styles.taskBox, { backgroundColor: colors.card }]}>
            <Text style={{ textAlign: "center", color: colors.muted }}>Loading...</Text>
          </View>
        ) : tasksForDate.length === 0 ? (
          <View style={[styles.taskBox, { backgroundColor: colors.card }]}>
            <Text style={{ textAlign: "center", color: colors.muted }}>No tasks for this date.</Text>
          </View>
        ) : (
          tasksForDate.map((task) => {
            const progress = Math.max(0, Math.min(100, Number(task.progressPercent || 0)));

            return (
              <View key={task.id} style={[styles.taskBox, { backgroundColor: colors.card }]}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  <Text style={[styles.points, { color: colors.primary }]}>{task.points} pts</Text>
                </View>

                <Slider
                  value={progress}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  disabled={task.completed}
                  onValueChange={(val) => updateProgressLocal(task.id, val)}
                  onSlidingComplete={(val) => persistProgress(task.id, val)}
                  minimumTrackTintColor={colors.primary}   // filled part
                  maximumTrackTintColor={colors.border}    // remaining part
                  thumbTintColor={colors.primary}

                />
                <Text style={[styles.progressLabel, { color: colors.text }]}>{Math.round(progress)}%</Text>
                <View style={styles.progressContainer}>
                  <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
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
                    color={task.completed ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.completeText, { color: colors.text }]}>
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
