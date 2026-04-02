import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
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
  addDoc,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";
import * as Notifications from "expo-notifications";

export default function ParentReviewTask({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parentChecks, setParentChecks] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const { theme } = useTheme();
  const colors = theme.colors;

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

  const pendingTasks = tasks.filter(
    (t) => t?.verified !== true
  );

  const completedTasks = tasks.filter(
    (t) => t?.verified === true || t?.status === "completed"
  );

  // Helpers to normalize Firestore timestamps and grouping keys
  const toDateFromTask = (t) => {
    const ts = t.verifiedAt || t.completedAt || t.updatedAt || t.createdAt || t.completedAt;
    if (!ts) return null;
    // Firestore Timestamp has toDate()
    try {
      if (typeof ts.toDate === "function") return ts.toDate();
      return new Date(ts);
    } catch (e) {
      return new Date(ts);
    }
  };

  const toDateKey = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  const startOfWeek = (d) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // make Monday=0
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const formatWeekLabel = (weekStartDate) => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const opts = { month: "short", day: "numeric" };
    return `Week of ${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
  };

  // Build grouping: for the current week, group by day; for older weeks, group by week
  const buildCompletedGroups = () => {
    const groups = new Map();
    const today = new Date();
    const currentWeekStartKey = toDateKey(startOfWeek(today));

    completedTasks.forEach((task) => {
      const d = toDateFromTask(task) || new Date();
      const weekStart = startOfWeek(d);
      const weekKey = toDateKey(weekStart);

      if (weekKey === currentWeekStartKey) {
        // group by day
        const dayKey = toDateKey(d);
        const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const gk = `day-${dayKey}`;
        if (!groups.has(gk)) groups.set(gk, { label, items: [] });
        groups.get(gk).items.push(task);
      } else {
        // group by week
        const gk = `week-${weekKey}`;
        if (!groups.has(gk)) groups.set(gk, { label: formatWeekLabel(weekStart), items: [] });
        groups.get(gk).items.push(task);
      }
    });

    // Convert map to array sorted by most recent first
    const arr = Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }));
    arr.sort((a, b) => {
      // extract date key portion
      const aDate = a.key.startsWith("day-") ? a.key.slice(4) : a.key.slice(5);
      const bDate = b.key.startsWith("day-") ? b.key.slice(4) : b.key.slice(5);
      return bDate.localeCompare(aDate);
    });

    return arr;
  };

  const completedGroups = buildCompletedGroups();

  const isChildCompleted = (task) => {
    if (!task) return false;
    return (
      task.pendingApproval === true ||
      task.status === "pendingApproval" ||
      task.completed === true ||
      Boolean(task.completedAt) ||
      Boolean(task.completedByChildId)
    );
  };

  const toggleParentCheck = (taskId) => {
    setParentChecks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setParentChecks((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleVerify = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    let childUid = null;
    let ownerId = null;
    let taskTitle = "";

    try {
      await runTransaction(db, async (tx) => {
        const taskSnap = await tx.get(taskRef);
        if (!taskSnap.exists()) return;

        const t = taskSnap.data();
        ownerId = t.ownerId || getAuth().currentUser?.uid || null;
        taskTitle = t.title || "";

        // prevent double-award
        if (t.pointsAwarded === true || t.verified === true) return;

        // only verify if child actually completed
        if (!isChildCompleted(t)) return;

        childUid = t.completedByChildId || t.childId;
        if (!childUid) throw new Error("Task missing child id to award points");

        const points = Number(t.points || 0);
        const childPointsRef = doc(db, "childPoints", childUid);

        // award points - increment both spendable balance (points) and lifetime counter (totalPoints)
        tx.set(
          childPointsRef,
          {
            childId: childUid,
            parentId: t.ownerId || getAuth().currentUser?.uid || null,
            // current balance
            points: increment(points),
            // lifetime earned
            totalPoints: increment(points),
            updatedAt: serverTimestamp(),
          },
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

      // Create a notification record for the child; Cloud Function will send push.
      if (childUid) {
        try {
          await addDoc(collection(db, "notifications"), {
            toUserId: childUid,
            fromParentId: ownerId,
            taskId,
            type: "task_verified",
            title: "Task Verified",
            body: taskTitle
              ? `Your parent verified: ${taskTitle}`
              : "Your parent verified your task.",
            createdAt: serverTimestamp(),
            read: false,
          });
        } catch (err) {
          console.error("Error creating child notification:", err);
        }
      }

      // Local banner on the current device to confirm to the parent
      try {
        let childNameForLocal = "";

        if (childUid) {
          try {
            const childrenQuery = query(
              collection(db, "children"),
              where("userId", "==", childUid)
            );
            const childrenSnap = await getDocs(childrenQuery);
            const childDoc = childrenSnap.docs[0];
            if (childDoc) {
              const data = childDoc.data() || {};
              childNameForLocal = data.preferredName || data.fullName || "";
            }
          } catch (e) {
            console.warn("Error looking up child for local notification:", e);
          }
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Task verified",
            body: taskTitle
              ? childNameForLocal
                ? `You verified ${childNameForLocal}'s "${taskTitle}" and awarded points.`
                : `You verified "${taskTitle}" and awarded points.`
              : childNameForLocal
                ? `You verified one of ${childNameForLocal}'s tasks and awarded points.`
                : "You verified a task and awarded points.",
          },
          trigger: null,
        });
      } catch (e) {
        console.warn("Local parent notification failed:", e);
      }
    } catch (err) {
      console.error("Error verifying task:", err);
    }
  };

  const [filter, setFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  const getFilteredPendingTasks = () => {
    let list = [...pendingTasks];

    if (filter === "markedComplete") {
      list = list.filter((t) => isChildCompleted(t));
    }

    if (filter === "newest" || filter === "oldest") {
      list.sort((a, b) => {
        const da = toDateFromTask(a) || new Date(0);
        const db = toDateFromTask(b) || new Date(0);
        return filter === "newest" ? db - da : da - db;
      });
    }

    return list;
  };

  const visiblePendingTasks = getFilteredPendingTasks();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5CB85C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.view}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonInline}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.header, { color: colors.text }]}>Review Tasks</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowFilter((prev) => !prev)}>
                <Ionicons name="filter-outline" size={20} color={colors.text} />
              </TouchableOpacity>
              {showFilter && (
                <View style={[styles.filterMenu, { backgroundColor: colors.card }]}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setFilter("all");
                      setShowFilter(false);
                    }}
                  >
                    <Text style={[styles.filterText, { color: colors.text }]}>View All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setFilter("markedComplete");
                      setShowFilter(false);
                    }}
                  >
                    <Text style={[styles.filterText, { color: colors.text }]}>Marked Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setFilter("newest");
                      setShowFilter(false);
                    }}
                  >
                    <Text style={[styles.filterText, { color: colors.text }]}>Newest</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setFilter("oldest");
                      setShowFilter(false);
                    }}
                  >
                    <Text style={[styles.filterText, { color: colors.text }]}>Oldest</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "pending" && styles.tabButtonActive,
                activeTab === "pending" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab("pending")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.muted },
                  activeTab === "pending" && styles.tabTextActive,
                  activeTab === "pending" && { color: colors.primary },
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "completed" && styles.tabButtonActive,
                activeTab === "completed" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab("completed")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.muted },
                  activeTab === "completed" && styles.tabTextActive,
                  activeTab === "completed" && { color: colors.primary },
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "pending" ? (
            pendingTasks.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No pending tasks.</Text>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={visiblePendingTasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const childCompleted = isChildCompleted(item);
                  const parentChecked = item.verified ? true : Boolean(parentChecks[item.id]);
                  return (
                    <View
                      style={[styles.taskCard, { backgroundColor: colors.card, shadowColor: "#000" }]}
                    >
                      <View style={styles.row}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                          <Ionicons name="book-outline" size={24} color="#C8A94B" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                          <Text style={[styles.subtitle, { color: colors.muted }]}>{item.description}</Text>
                        </View>
                        <View style={[styles.pointsBadge, { backgroundColor: colors.background }]}>
                          <Text style={[styles.pointsText, { color: colors.primary }]}>{(item.points ?? 10) + " Pts"}</Text>
                        </View>
                      </View>
                      <View style={styles.statusRow}>
                        <Ionicons name={childCompleted ? "checkbox-outline" : "square-outline"} size={20} color={childCompleted ? "#4CAF50" : "#999"} />
                        <Text style={[styles.completeText, !childCompleted && styles.completeTextMuted, !childCompleted && { color: colors.muted }]}>Marked as Complete</Text>
                      </View>
                      <TouchableOpacity style={styles.statusRow} onPress={() => toggleParentCheck(item.id)} disabled={!childCompleted || item.verified}>
                        <Ionicons name={parentChecked ? "checkbox-outline" : "square-outline"} size={20} color={!childCompleted || item.verified ? "#999" : "#4CAF50"} />
                        <Text style={[styles.completeText, (!childCompleted || item.verified) && styles.completeTextMuted, (!childCompleted || item.verified) && { color: colors.muted }]}>Parent Verified</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.verifyButton, (!childCompleted || item.verified || !parentChecked) && styles.verifyButtonDisabled]} onPress={() => handleVerify(item.id)} disabled={!childCompleted || item.verified || !parentChecked}>
                        <Text style={styles.verifyText}>{item.verified ? "Verified" : "Verify Completed"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="gray" />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )
          ) : (
            // Completed tab: render grouped days for current week and weekly groups for older weeks
            completedGroups.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No completed tasks yet.</Text>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                {completedGroups.map((group) => (
                  <View key={group.key} style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.text }}>{group.label}</Text>
                    {group.items.map((item) => (
                      <View key={item.id} style={[styles.taskCard, { backgroundColor: colors.card, marginBottom: 8 }]}>
                        <View style={styles.row}>
                          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#4CAF50" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>{item.description}</Text>
                          </View>
                          <View style={[styles.pointsBadge, { backgroundColor: colors.background }]}>
                            <Text style={[styles.pointsText, { color: colors.primary }]}>{(item.points ?? 10) + " Pts"}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )
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
  view: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 0,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButtonInline: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  headerSpacer: {
    width: 54,
  },
  backText: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  headerRight: {
    width: 54,
    alignItems: "flex-end",
    justifyContent: "center",
    position: "relative",
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
  completeText: { marginLeft: 5, color: "#4CAF50", fontSize: 14, flex: 1, flexWrap: "wrap" },
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
  filterMenu: {
    position: "absolute",
    top: 32,
    right: 0,
    marginTop: 6,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minWidth: 170,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 20,
  },
  filterOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 14,
    flexShrink: 0,
  },
});
