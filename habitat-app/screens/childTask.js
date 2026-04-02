import React, { useState, useEffect, useCallback, useRef } from "react";
import WeekCalendar from "./WeekCalendar";
import { addDays, startOfDay } from "date-fns";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
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
import { getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

import { useTheme } from "../theme/ThemeContext";
import { endOfDay } from "date-fns";
import { useSelectedChild } from "../SelectedChildContext";


export default function ChildTask({ route, navigation }) {
const { selectedChildId } = useSelectedChild();
const childId = route?.params?.childId || selectedChildId;
const currentChildUid = getAuth().currentUser?.uid;
const pointsChildId = childId;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasksForDate, setTasksForDate] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [childDocId, setChildDocId] = useState(null);
  const [childName, setChildName] = useState("");
  const { theme } = useTheme();
  const colors = theme.colors;

  // store child points locally (and keep it in sync with Firestore)
  const [childPoints, setChildPoints] = useState(0);

  // Steps modal state
  const [stepModalTask, setStepModalTask] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState(new Set());

  const toggleStep = (index) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const closeStepModal = () => {
    setStepModalTask(null);
    setCheckedSteps(new Set());
  };

  const CARD_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#C3B1E1"];
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

  const toLocalDateKey = useCallback((d) => {
    if (!d) return "";
    const local = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
  }, []);


  // Recurring tasks are currently disabled on the child task calendar.
  // If you later re-enable recurring tasks, restore occursOnDate + recurring listeners.


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
  //changed to the active child id
  useEffect(() => {
  if (!childId) {
    setChildDocId(null);
    setChildName("");
    return;
  }

  let cancelled = false;

  getDoc(doc(db, "children", childId))
    .then((snap) => {
      if (cancelled) return;

      if (snap.exists()) {
        const data = snap.data();
        setChildDocId(childId);
        setChildName(data.preferredName || data.fullName || "");
      } else {
        setChildDocId(null);
        setChildName("");
      }
    })
    .catch((err) => console.error("child doc direct lookup error", err));

  return () => {
    cancelled = true;
  };
}, [childId]);

/* duplicate of the child look up
  useEffect(() => {
    if (!childId) return;

    const ref = doc(db, "children", childId);
    getDoc(ref)
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setChildDocId(childId);
        setChildName(data.preferredName || data.fullName || "");
      })
      .catch((err) => console.error("child doc direct lookup error", err));
  }, [childId]);

  */

  // Load tasks (date-specific + recurring)
  useEffect(() => {
    if (!selectedDate) return;
    if (!childId && !currentChildUid) return;
    setLoadingTasks(true);
    taskBucketsRef.current = { dateUser: [], dateChild: [], recUser: [], recChild: [] };
    recomputeTasksForDate();

    // Fix: define unsubscribers array
    let unsubscribers = [];

    const dateKey = toLocalDateKey(selectedDate);

    const dayStart = Timestamp.fromDate(startOfDay(selectedDate));
    const dayEnd = Timestamp.fromDate(endOfDay(selectedDate));

    // 1) One-time tasks created under the family account (ParentTaskPage writes userId + scheduleDate)
    if (currentChildUid) {
      const qUserDay = query(
        collection(db, "tasks"),
        where("userId", "==", currentChildUid),
        where("scheduleDate", "==", dateKey)
      );
      unsubscribers.push(
        onSnapshot(
          qUserDay,
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((t) => t?.completed !== true && t?.verified !== true)
              .map((t) => ({
                ...t,
                progressPercent:
                  typeof t.progressPercent === "number" ? t.progressPercent : t.completed ? 100 : 0,
              }));
            taskBucketsRef.current.dateUser = list;
            recomputeTasksForDate();
            setLoadingTasks(false);
          },
          (err) => {
            console.error("tasks(userId+scheduleDate) onSnapshot error", err);
            setLoadingTasks(false);
          }
        )
      );

      // Backward compatibility: older tasks may have dateTimestamp but no scheduleDate
      const qUserDayLegacy = query(
        collection(db, "tasks"),
        where("userId", "==", currentChildUid),
        where("dateTimestamp", ">=", dayStart),
        where("dateTimestamp", "<=", dayEnd)
      );
      unsubscribers.push(
        onSnapshot(
          qUserDayLegacy,
          (snap) => {
            const legacy = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((t) => !t?.scheduleDate)
              .filter((t) => t?.completed !== true && t?.verified !== true)
              .map((t) => ({
                ...t,
                progressPercent:
                  typeof t.progressPercent === "number" ? t.progressPercent : t.completed ? 100 : 0,
              }));

            // merge with dateUser, prefer scheduleDate version if duplicate
            const merged = new Map();
            (taskBucketsRef.current.dateUser || []).forEach((t) => merged.set(t.id, t));
            legacy.forEach((t) => {
              if (!merged.has(t.id)) merged.set(t.id, t);
            });
            taskBucketsRef.current.dateUser = Array.from(merged.values());
            recomputeTasksForDate();
          },
          (err) => {
            console.error("tasks(userId+dateTimestamp legacy) onSnapshot error", err);
          }
        )
      );
    }

    // 2) Child-specific one-time tasks (if you ever store tasks with childId)
    if (childDocId) {
      const qChildDay = query(
        collection(db, "tasks"),
        where("childId", "==", childDocId),
        where("scheduleDate", "==", dateKey)
      );
      unsubscribers.push(
        onSnapshot(
          qChildDay,
          (snap) => {
            const list = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((t) => t?.completed !== true && t?.verified !== true)
              .map((t) => ({
                ...t,
                progressPercent:
                  typeof t.progressPercent === "number" ? t.progressPercent : t.completed ? 100 : 0,
              }));
            taskBucketsRef.current.dateChild = list;
            recomputeTasksForDate();
            setLoadingTasks(false);
          },
          (err) => {
            console.error("tasks(childId+scheduleDate) onSnapshot error", err);
          }
        )
      );
    }

    // Recurring tasks intentionally not loaded.

    return () => {
      unsubscribers.forEach((unsub) => {
        try { if (typeof unsub === 'function') unsub(); } catch { }
      });
    };
  }, [selectedDate, childId, currentChildUid, childDocId, recomputeTasksForDate, toLocalDateKey]);

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
    if (!task?.id || !childId) return;

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
          completedByChildId: childId,
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
            fromChildId: childId,
            taskId: task.id,
            type: "completion_request",
            title: childName
              ? `${childName} completed a task`
              : "Task completed",
            body: task.title
              ? childName
                ? `${childName} marked "${task.title}" as complete and it is waiting for your review.`
                : `${task.title} has been marked complete and is waiting for your review.`
              : childName
                ? `${childName} marked a task as complete and it is waiting for your review.`
                : "A task has been marked complete and is waiting for your review.",
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      });

      // Local banner on the child device so they get feedback
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Nice work!",
            body: task.title
              ? `You marked "${task.title}" as complete. Waiting for parent to review.`
              : "You marked a task as complete. Waiting for parent to review.",
          },
          trigger: null,
        });
      } catch (e) {
        console.warn("Local child notification failed:", e);
      }
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
          tasksForDate.map((task, index) => {
            const bannerColor = CARD_COLORS[index % CARD_COLORS.length];
            const hasSteps = Array.isArray(task.steps) && task.steps.filter((s) => s.trim()).length > 0;

            return (
              <View key={task.id} style={styles.questCardShadow}>
                <View style={styles.questCard}>
                {/* Color banner with badge */}
                <View style={[styles.questBanner, { backgroundColor: bannerColor }]}>
                  <Ionicons name="shield" size={36} color="#fff" />
                  <View style={styles.pointsBadge}>
                    <Ionicons name="star" size={14} color="#FFE66D" />
                    <Text style={styles.pointsBadgeText}>{task.points} pts</Text>
                  </View>
                </View>

                {/* Card body */}
                <View style={styles.questBody}>
                  <Text style={styles.questTitle}>{task.title}</Text>

                  {hasSteps ? (
                    <View style={styles.questActions}>
                      <TouchableOpacity
                        style={[styles.viewStepsBtn, { backgroundColor: bannerColor }]}
                        onPress={() => setStepModalTask(task)}
                      >
                        <Ionicons name="eye-outline" size={18} color="#fff" />
                        <Text style={styles.viewStepsBtnText}>View Steps</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.largeCheckbox}
                        disabled={task.completed}
                        onPress={() => markTaskComplete(task)}
                      >
                        <Ionicons
                          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                          size={48}
                          color={task.completed ? bannerColor : "#ccc"}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.questActions}>
                      <View style={styles.bigPointsContainer}>
                        <Ionicons name="star" size={32} color="#FFE66D" />
                        <Text style={[styles.bigPointsText, { color: bannerColor }]}>{task.points} pts</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.largeCheckbox}
                        disabled={task.completed}
                        onPress={() => markTaskComplete(task)}
                      >
                        <Ionicons
                          name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                          size={48}
                          color={task.completed ? bannerColor : "#ccc"}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Steps Modal */}
      <Modal
        visible={!!stepModalTask}
        animationType="slide"
        transparent
        onRequestClose={closeStepModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {stepModalTask?.title}
              </Text>
              <TouchableOpacity onPress={closeStepModal} style={styles.modalClose}>
                <Ionicons name="close" size={26} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.stepsScroll} contentContainerStyle={{ paddingBottom: 20 }}>
              {(stepModalTask?.steps || [])
                .filter((s) => s.trim())
                .map((step, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.stepRow}
                    onPress={() => toggleStep(i)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={checkedSteps.has(i) ? "checkmark-circle" : "ellipse-outline"}
                      size={28}
                      color={checkedSteps.has(i) ? "#4ECDC4" : "#ccc"}
                    />
                    <Text style={[styles.stepText, checkedSteps.has(i) && styles.stepTextDone]}>
                      {step}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCompleteBtn, stepModalTask?.completed && styles.modalCompleteBtnDone]}
              disabled={stepModalTask?.completed}
              onPress={() => {
                markTaskComplete(stepModalTask);
                closeStepModal();
              }}
            >
              <Ionicons
                name={stepModalTask?.completed ? "checkmark-circle" : "checkmark-done-circle-outline"}
                size={24}
                color="#fff"
              />
              <Text style={styles.modalCompleteBtnText}>
                {stepModalTask?.completed ? "Already Complete!" : "Mark Task Complete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  // Quest card
  questCardShadow: {
    borderRadius: 20,
    marginBottom: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.10)",
  },
  questCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  questBanner: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 3,
  },
  questBody: {
    padding: 16,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2d2d",
    marginBottom: 14,
    textAlign: "center",
  },
  questActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewStepsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },
  viewStepsBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  bigPointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bigPointsText: {
    fontSize: 26,
    fontWeight: "800",
  },
  largeCheckbox: {
    padding: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2d2d",
  },
  modalClose: {
    padding: 4,
    marginLeft: 8,
  },
  stepsScroll: {
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  stepTextDone: {
    textDecorationLine: "line-through",
    color: "#aaa",
  },
  modalCompleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4ECDC4",
    borderRadius: 30,
    paddingVertical: 14,
    gap: 8,
  },
  modalCompleteBtnDone: {
    backgroundColor: "#aaa",
  },
  modalCompleteBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});
