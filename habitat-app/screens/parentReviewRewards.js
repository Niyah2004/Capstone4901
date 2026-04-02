import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";
import { useSelectedChild } from "../SelectedChildContext";

export default function ParentReviewRewards({ navigation, route }) {
  const [rewards, setRewards] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [activeTab, setActiveTab] = useState("created");
  const { theme } = useTheme();
  const colors = theme.colors;
  const { selectedChildId } = useSelectedChild();
  const activeChildId = route?.params?.childId || selectedChildId;

  // Listener: rewards catalog
  useEffect(() => {
    if (!activeChildId) {
      setRewards([]);
      return;
    }

    const q = query(
      collection(db, "rewards"),
      where("childId", "==", activeChildId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRewards(list);
      },
      (err) => {
        console.error("rewards onSnapshot error:", err);
      }
    );

    return () => unsub();
  }, [activeChildId]);

  // Listener: claims
  useEffect(() => {
    if (!activeChildId) {
      setClaims([]);
      setLoadingClaims(false);
      return;
    }

  const q = query(
    collection(db, "claims"),
    where("childId", "==", activeChildId)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const aTime = a.claimedAt?.toDate ? a.claimedAt.toDate().getTime() : 0;
        const bTime = b.claimedAt?.toDate ? b.claimedAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      setClaims(list);
      setLoadingClaims(false);
    },
    (err) => {
      console.error("claims onSnapshot error:", err);
      setLoadingClaims(false);
    }
  );

  return () => unsub();
}, [activeChildId]);


  const handleDelete = async (rewardId) => {
    try {
      await deleteDoc(doc(db, "rewards", rewardId));
    } catch (err) {
      console.error("Error deleting reward:", err);
      Alert.alert("Error", "Could not delete reward. Try again.");
    }
  };

  const handleFulfill = async (claimId, rewardName, rewardItemId) => {
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status: "fulfilled",
        fulfilledAt: serverTimestamp(),
      });
      if (rewardItemId) {
        try {
          const rewardSnap = await getDoc(doc(db, "rewards", rewardItemId));
          if (rewardSnap.exists() && rewardSnap.data().frequency === "One-Time") {
            await deleteDoc(doc(db, "rewards", rewardItemId));
          }
        } catch (e) {
          console.warn("Could not check/delete one-time reward:", e);
        }
      }
      Alert.alert("Reward Given!", `You gave "${rewardName}" to your child!`);
    } catch (e) {
      console.error("Error fulfilling claim:", e);
      Alert.alert("Oops!", "Couldn't mark this reward as given. Try again.");
    }
  };

  // --- Date grouping helpers (same pattern as parentReviewTask.js) ---
  const toDateFromClaim = (c) => {
    const ts = c.fulfilledAt || c.claimedAt;
    if (!ts) return null;
    try {
      if (typeof ts.toDate === "function") return ts.toDate();
      return new Date(ts);
    } catch { return new Date(ts); }
  };

  const toDateKey = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  const startOfWeek = (d) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7;
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

  const buildFulfilledGroups = () => {
    const fulfilled = claims.filter((c) => c.status === "fulfilled");
    const groups = new Map();
    const today = new Date();
    const currentWeekStartKey = toDateKey(startOfWeek(today));

    fulfilled.forEach((claim) => {
      const d = toDateFromClaim(claim) || new Date();
      const weekStart = startOfWeek(d);
      const weekKey = toDateKey(weekStart);

      if (weekKey === currentWeekStartKey) {
        const dayKey = toDateKey(d);
        const label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const gk = `day-${dayKey}`;
        if (!groups.has(gk)) groups.set(gk, { label, items: [] });
        groups.get(gk).items.push(claim);
      } else {
        const gk = `week-${weekKey}`;
        if (!groups.has(gk)) groups.set(gk, { label: formatWeekLabel(weekStart), items: [] });
        groups.get(gk).items.push(claim);
      }
    });

    const arr = Array.from(groups.entries()).map(([key, val]) => ({ key, ...val }));
    arr.sort((a, b) => {
      const aDate = a.key.startsWith("day-") ? a.key.slice(4) : a.key.slice(5);
      const bDate = b.key.startsWith("day-") ? b.key.slice(4) : b.key.slice(5);
      return bDate.localeCompare(aDate);
    });
    return arr;
  };

  const pendingClaims = claims.filter((c) => c.status === "claimed");
  const fulfilledGroups = buildFulfilledGroups();
  const loading = loadingClaims;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5CB85C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.view}>

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonInline}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.header, { color: colors.text }]}>Review Rewards</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "created" && styles.tabButtonActive,
                activeTab === "created" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab("created")}
            >
              <Text style={[
                styles.tabText,
                { color: colors.muted },
                activeTab === "created" && styles.tabTextActive,
                activeTab === "created" && { color: colors.primary },
              ]}>
                Created Rewards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "claimed" && styles.tabButtonActive,
                activeTab === "claimed" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab("claimed")}
            >
              <Text style={[
                styles.tabText,
                { color: colors.muted },
                activeTab === "claimed" && styles.tabTextActive,
                activeTab === "claimed" && { color: colors.primary },
              ]}>
                Claimed Rewards
              </Text>
            </TouchableOpacity>
          </View>

          {/* Created Rewards Tab */}
          {activeTab === "created" ? (
            rewards.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No rewards created yet.</Text>
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={rewards}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.taskCard, { backgroundColor: colors.card, shadowColor: "#000" }]}>
                    <View style={styles.row}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                        <Ionicons name="gift-outline" size={24} color="#C8A94B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: colors.text }]}>{item.rewardName ?? item.name}</Text>
                        {item.description ? (
                          <Text style={[styles.subtitle, { color: colors.muted }]}>{item.description}</Text>
                        ) : null}
                        {item.frequency ? (
                          <Text style={[styles.subtitle, { color: colors.muted }]}>{item.frequency}</Text>
                        ) : null}
                      </View>
                      <View style={[styles.pointsBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.pointsText, { color: colors.primary }]}>
                          {(item.points ?? item.cost ?? 0) + " Pts"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="gray" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )

          ) : (
            /* Claimed Rewards Tab */
            pendingClaims.length === 0 && fulfilledGroups.length === 0 ? (
              <Text style={[styles.empty, { color: colors.muted }]}>No claimed rewards yet.</Text>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>

                {/* Pending fulfillment section */}
                {pendingClaims.length > 0 && (
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.text }}>
                      Needs Your Attention
                    </Text>
                    {pendingClaims.map((item) => (
                      <View key={item.id} style={[styles.taskCard, { backgroundColor: colors.card, marginBottom: 8 }]}>
                        <View style={styles.row}>
                          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="gift-outline" size={24} color="#C8A94B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text }]}>{item.rewardName}</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>{item.cost ?? "?"} stars spent</Text>
                          </View>
                          <View style={[styles.pointsBadge, { backgroundColor: colors.background }]}>
                            <Text style={[styles.pointsText, { color: colors.primary }]}>{(item.cost ?? "?") + " Pts"}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.verifyButton}
                          onPress={() => handleFulfill(item.id, item.rewardName, item.item_id)}
                        >
                          <Text style={styles.verifyText}>Give Reward</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Fulfilled history grouped by date */}
                {fulfilledGroups.map((group) => (
                  <View key={group.key} style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.text }}>
                      {group.label}
                    </Text>
                    {group.items.map((item) => (
                      <View key={item.id} style={[styles.taskCard, { backgroundColor: colors.card, marginBottom: 8 }]}>
                        <View style={styles.row}>
                          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
                            <Ionicons name="checkmark-done-outline" size={20} color="#4CAF50" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text }]}>{item.rewardName}</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>{item.cost ?? "?"} stars spent</Text>
                          </View>
                          <View style={[styles.pointsBadge, { backgroundColor: colors.background }]}>
                            <Text style={[styles.pointsText, { color: colors.primary }]}>{(item.cost ?? "?") + " Pts"}</Text>
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
  verifyButton: {
    marginTop: 10,
    backgroundColor: "#5CB85C",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  verifyText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  deleteBtn: { position: "absolute", top: 10, right: 10 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#777", marginTop: 40 },
});
