import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

export default function ParentReviewRewards({ navigation }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const colors = theme.colors;

  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setClaims([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "claims"),
      where("parentId", "==", uid),
      where("status", "==", "claimed")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort newest first
        list.sort((a, b) => {
          const aTime = a.claimedAt?.toDate ? a.claimedAt.toDate().getTime() : 0;
          const bTime = b.claimedAt?.toDate ? b.claimedAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setClaims(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching claims:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleFulfill = async (claimId, rewardName, rewardItemId) => {
    try {
      // Mark claim as fulfilled
      await updateDoc(doc(db, "claims", claimId), {
        status: "fulfilled",
        fulfilledAt: new Date(),
      });

      // If it's a one-time reward, delete it from the rewards catalog
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

      Alert.alert("🎉 Reward Given!", `You gave "${rewardName}" to your child!`);
    } catch (e) {
      console.error("Error fulfilling claim:", e);
      Alert.alert("Oops!", "Couldn't mark this reward as given. Try again.");
    }
  };

  const formatDate = (claimedAt) => {
    if (!claimedAt) return "";
    const date = claimedAt.toDate ? claimedAt.toDate() : new Date(claimedAt);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Claimed Rewards</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Sub-header */}
        <Text style={[styles.subHeader, { color: colors.muted }]}>
          Tap "Give Reward" once you've given it to your child! 🌟
        </Text>

        {claims.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>All caught up!</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No rewards waiting to be given right now.
            </Text>
          </View>
        ) : (
          <FlatList
            data={claims}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => (
              <View style={[styles.claimCard, { backgroundColor: colors.card }]}>
                {/* Reward icon + info */}
                <View style={styles.cardTop}>
                  <View style={styles.giftBubble}>
                    <Text style={styles.giftEmoji}>🎁</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.rewardName, { color: colors.text }]}>
                      {item.rewardName}
                    </Text>
                    <View style={styles.costRow}>
                      <Text style={styles.starEmoji}>⭐</Text>
                      <Text style={[styles.costText, { color: colors.muted }]}>
                        {item.cost ?? "?"} stars spent
                      </Text>
                    </View>
                    {item.claimedAt ? (
                      <Text style={[styles.dateText, { color: colors.muted }]}>
                        Claimed {formatDate(item.claimedAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Pending badge */}
                <View style={[styles.pendingBadge, { backgroundColor: colors.inputBg }]}>
                  <Ionicons name="time-outline" size={13} color={colors.muted} />
                  <Text style={[styles.pendingBadgeText, { color: colors.muted }]}>Waiting for you!</Text>
                </View>

                {/* Give reward button */}
                <TouchableOpacity
                  style={[styles.fulfillButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleFulfill(item.id, item.rewardName, item.item_id)}
                >
                  <Text style={styles.fulfillButtonText}>Give Reward 🎉</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 54,
  },
  subHeader: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 18,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  claimCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  giftBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  giftEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  starEmoji: {
    fontSize: 13,
    marginRight: 3,
  },
  costText: {
    fontSize: 13,
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
    gap: 4,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  fulfillButton: {
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  fulfillButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
