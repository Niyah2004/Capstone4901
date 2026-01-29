import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  where,
  runTransaction,     
  increment,          
  serverTimestamp,    
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ParentReviewTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentChecks, setParentChecks] = useState({});
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setTasks([]);
      setLoading(false);
      return;
    }

    // Filter to only tasks created by this parent
    const q = query(
      collection(db, "tasks"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTasks(list);
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  /*const handleVerify = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), { verified: true });
    } catch (e) {
      console.error("Error verifying task:", e);
    }
  };*/

  const handleVerify = async (taskId) => {
  const taskRef = doc(db, "tasks", taskId);

  try {
    await runTransaction(db, async (tx) => {
      const taskSnap = await tx.get(taskRef);
      if (!taskSnap.exists()) return;

      const t = taskSnap.data();

      // prevent double-award
      if (t.pointsAwarded === true || t.verified === true) return;

      const childUid = t.completedByChildId || t.childId;
      if (!childUid) throw new Error("Task missing child id to award points");

      const points = Number(t.points || 0);
      const childPointsRef = doc(db, "childPoints", childUid);

      // award points
      tx.set(
        childPointsRef,
        { childId: childUid, totalPoints: increment(points), updatedAt: serverTimestamp() },
        { merge: true }
      );

      // mark verified + close out pending approval
      tx.update(taskRef, {
        verified: true,
        verifiedAt: serverTimestamp(),
        pendingApproval: false,
        status: "completed",
        pointsAwarded: true,
      });
    });
  } catch (e) {
    console.error("Error verifying + awarding points:", e);
  }
};


  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  const toggleParentCheck = (taskId) => {
    setParentChecks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const isChildCompleted = (task) =>
    task.pendingApproval === true ||
    task.completed === true ||
    task.status === "pendingApproval" ||
    task.status === "completed";

  const pendingTasks = tasks.filter((t) => !isChildCompleted(t));
  const completedTasks = tasks.filter((t) => isChildCompleted(t));

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5CB85C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.view}>
          <Text style={styles.header}>Review Tasks</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "pending" && styles.tabButtonActive]}
              onPress={() => setActiveTab("pending")}
            >
              <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === "completed" && styles.tabButtonActive]}
              onPress={() => setActiveTab("completed")}
            >
              <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {(activeTab === "pending" ? pendingTasks : completedTasks).length === 0 ? (
            <Text style={styles.empty}>
              {activeTab === "pending"
                ? "No pending tasks."
                : "No completed tasks yet."}
            </Text>
          ) : (
            <FlatList
              data={activeTab === "pending" ? pendingTasks : completedTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const childCompleted = isChildCompleted(item);
                const parentChecked = item.verified
                  ? true
                  : Boolean(parentChecks[item.id]);

                return (
                <View style={styles.taskCard}>
                  {/* Icon and Title Row */}
                  <View style={styles.row}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="book-outline" size={24} color="#C8A94B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.subtitle}>{item.description}</Text>
                    </View>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>
                        {(item.points ?? 10) + " Pts"}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View
                        style={[styles.progressFill, { width: "100%" }]}
                      />
                    </View>
                    <Text style={styles.stepsText}>1/1 Steps</Text>
                  </View>

                  {/* Status Row */}
                { /* <View style={styles.statusRow}>
                    <Ionicons
                      name={
                        item.status === "completed"
                          ? "checkmark-done-circle-outline"
                          : "time-outline"
                      }
                      size={20}
                      color={item.status === "completed" ? "#4CAF50" : "#999"}
                    />
                    <Text style={styles.completeText}>
                      {item.status === "completed"
                        ? "Marked as Complete"
                        : "Pending"}
                    </Text>
                  </View>*/}
                  <View style={styles.statusRow}>
                    <Ionicons
                      name={childCompleted ? "checkbox-outline" : "square-outline"}
                      size={20}
                      color={childCompleted ? "#4CAF50" : "#999"}
                    />
                    <Text
                      style={[
                        styles.completeText,
                        !childCompleted && styles.completeTextMuted,
                      ]}
                    >
                      Marked as Complete
                    </Text>
                  </View>

                  {/* Parent confirmation checkbox */}
                  <TouchableOpacity
                    style={styles.statusRow}
                    onPress={() => toggleParentCheck(item.id)}
                    disabled={!childCompleted || item.verified}
                  >
                    <Ionicons
                      name={parentChecked ? "checkbox-outline" : "square-outline"}
                      size={20}
                      color={
                        !childCompleted || item.verified ? "#999" : "#4CAF50"
                      }
                    />
                    <Text
                      style={[
                        styles.completeText,
                        (!childCompleted || item.verified) && styles.completeTextMuted,
                      ]}
                    >
                      Parent Verified
                    </Text>
                  </TouchableOpacity>

                  {/* Verify Button (parent approval) */}
                 <TouchableOpacity
  style={[
    styles.verifyButton,
    (!childCompleted || item.verified || !parentChecked) &&
      styles.verifyButtonDisabled,
  ]}
  onPress={() => handleVerify(item.id)}
  disabled={!childCompleted || item.verified || !parentChecked}
>
  <Text style={styles.verifyText}>{item.verified ? "Verified" : "Verify Completed"}</Text>
</TouchableOpacity>


                  {/* Optional Delete Icon */}
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
              )}}
            />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#4CAF50",
  },
  tabText: {
    fontSize: 14,
    color: "#8A8FA3",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#4CAF50",
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    backgroundColor: "#FFF8E1",
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  title: { fontSize: 17, fontWeight: "600", color: "#222" },
  subtitle: { fontSize: 13, color: "#555", marginTop: 2 },
  pointsBadge: {
    backgroundColor: "#E9F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pointsText: { color: "#388E3C", fontWeight: "600" },
  progressContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#5CB85C",
  },
  stepsText: { fontSize: 12, color: "#777" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  completeText: { marginLeft: 5, color: "#4CAF50", fontSize: 14 },
  completeTextMuted: { color: "#777" },
  verifyButton: {
    marginTop: 10,
    backgroundColor: "#5CB85C",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  verifyButtonDisabled: { backgroundColor: "#A5D6A7" },
  verifyText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  deleteBtn: { position: "absolute", top: 10, right: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
});
