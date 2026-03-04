import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useParentLock } from "../ParentLockContext";
import { db } from "../firebaseConfig";
import { doc, onSnapshot, query, collection, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

export default function ParentDashBoard({ navigation, route }) {
  const { isParentUnlocked } = useParentLock();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [childPoints, setChildPoints] = useState({
    points: 0,
    loading: true,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [milestoneAvatar, setMilestoneAvatar] = useState("panda");
  const [recentMilestone, setRecentMilestone] = useState(null);
  const [verifiedCount, setVerifiedCount] = useState(0);

  const avatarImages = {
    panda: require("../assets/panda.png"),
    turtle: require("../assets/turtle.png"),
    dino: require("../assets/dino.png"),
    lion: require("../assets/lion.png"),
    penguin: require("../assets/penguin.png"),
  };

  useFocusEffect(
    useCallback(() => {
      if (!isParentUnlocked) {
        // if locked, don’t allow staying on dashboard
        navigation.replace("parentPinScreen");
      }
    }, [isParentUnlocked, navigation])
  );

  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user && !route?.params?.childId) {
        // optionally redirect to login or show message
        setChildPoints({ points: 0, loading: false });
        return;
      }

      // Decide which childId to use
      // If you're passing childId in navigation params, use that:
      const childIdFromRoute = route?.params?.childId;
      const childId = childIdFromRoute || user?.uid; // adjust this depending on your schema

      if (!childId) {
        setChildPoints({ points: 0, loading: false });
        return;
      }

      const childPointsRef = doc(db, "childPoints", childId);

      const pointsUnsub = onSnapshot(
        childPointsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            // support either "points" or "stars" as the field name
            const balance = data.points ?? data.stars ?? data.totalPoints ?? 0;

            setChildPoints({
              points: balance,
              loading: false,
            });
          } else {
            setChildPoints({
              points: 0,
              loading: false,
            });
          }
        },
        (error) => {
          console.error("Error listening to childPoints:", error);
          setChildPoints((prev) => ({ ...prev, loading: false }));
        }
      );

      let pendingUnsub = () => { };
      if (user?.uid) {
        // Pending tasks = completed by child, not yet verified
        const pendingQuery = query(
          collection(db, "tasks"),
          where("ownerId", "==", user.uid),
          where("pendingApproval", "==", true)
        );
        pendingUnsub = onSnapshot(
          pendingQuery,
          (snap) => {
            const count = snap.docs.filter((d) => d.data()?.verified !== true).length;
            setPendingCount(count);
          },
          (err) => {
            console.error("Error listening to pending tasks:", err);
            setPendingCount(0);
          }
        );
      } else {
        setPendingCount(0);
      }

      return () => {
        try { pointsUnsub(); } catch { }
        try { pendingUnsub(); } catch { }
      };
    }, [route]));

  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      const childIdFromRoute = route?.params?.childId;
      let childProfileUnsub = () => {};

      if (childIdFromRoute) {
        const childRef = doc(db, "children", childIdFromRoute);
        childProfileUnsub = onSnapshot(
          childRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() || {};
              setMilestoneAvatar(data.avatar || "panda");
            } else {
              setMilestoneAvatar("panda");
            }
          },
          (error) => {
            console.error("Error listening to child profile:", error);
            setMilestoneAvatar("panda");
          }
        );
      } else if (user?.uid) {
        const childrenQuery = query(
          collection(db, "children"),
          where("userId", "==", user.uid)
        );
        childProfileUnsub = onSnapshot(
          childrenQuery,
          (snap) => {
            if (!snap.empty) {
              const firstChild = snap.docs[0].data() || {};
              setMilestoneAvatar(firstChild.avatar || "panda");
            } else {
              setMilestoneAvatar("panda");
            }
          },
          (error) => {
            console.error("Error listening to children profile:", error);
            setMilestoneAvatar("panda");
          }
        );
      } else {
        setMilestoneAvatar("panda");
      }

      return () => {
        try { childProfileUnsub(); } catch {}
      };
    }, [route?.params?.childId])
  );

  useFocusEffect(
    useCallback(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setRecentMilestone(null);
        setVerifiedCount(0);
        return;
      }

      const q = query(
        collection(db, "tasks"),
        where("ownerId", "==", user.uid),
        where("verified", "==", true)
      );

      const unsub = onSnapshot(q, (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => {
          const aTime = a.verifiedAt?.toDate ? a.verifiedAt.toDate().getTime() : 0;
          const bTime = b.verifiedAt?.toDate ? b.verifiedAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setRecentMilestone(docs[0] || null);
        setVerifiedCount(docs.length);
      }, (err) => {
        console.error("Error fetching milestones:", err);
        setRecentMilestone(null);
        setVerifiedCount(0);
      });

      return () => { try { unsub(); } catch {} };
    }, [])
  );


  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={[styles.header, { color: colors.text }]}>Parent Dashboard</Text>

          {/* Current Balance Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.balanceHeader}>
              <Ionicons name="star-outline" size={30} color={colors.text} />
              <Text style={[styles.balanceTitle, { color: colors.text }]}>Current Balance</Text>
            </View>
            <TouchableOpacity style={styles.balanceContent}>
              <Text style={[styles.starCount, { color: colors.text }]}>
                {childPoints.loading ? "--" : childPoints.points}
              </Text>
              <Text style={[styles.starLabel, { color: colors.text }]}>Star Points</Text>
              <Text style={[styles.points, { color: colors.muted }]}>
                {childPoints.loading ? "Loading..." : "Current Balance"}
              </Text>

            </TouchableOpacity>
          </View>

      {/* Recent Milestone */}
      <View style={[styles.milestoneCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Milestone{verifiedCount > 0 ? `  ·  ${verifiedCount} completed` : ""}
        </Text>
        {recentMilestone ? (
          <View style={styles.milestoneContent}>
            <Image
              source={avatarImages[milestoneAvatar] || avatarImages.panda}
              style={styles.milestoneImage}
            />
            <View style={styles.milestoneText}>
              <Text style={[styles.milestoneTitle, { color: colors.text }]}>
                Completed '{recentMilestone.title}'
              </Text>
              <Text style={[styles.milestoneDesc, { color: colors.muted }]}>
                {recentMilestone.description || "Task completed and verified!"}
              </Text>
              <Text style={[styles.milestoneDate, { color: colors.muted }]}>
                {recentMilestone.verifiedAt?.toDate
                  ? `Achieved on ${recentMilestone.verifiedAt.toDate().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                  : "Recently completed"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.milestoneDesc, { color: colors.muted, textAlign: "center", paddingVertical: 10 }]}>
            No milestones yet. Complete and verify tasks to see them here!
          </Text>
        )}
      </View>

          {/* Tasks Awaiting Approval */}
          <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks Awaiting Approval</Text>
            <Text style={styles.pendingCount}>{pendingCount}</Text>
            <Text style={[styles.pendingText, { color: colors.muted }]}>pending tasks</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("parentReviewTask")}>
              <Text style={styles.buttonText}>Review Tasks →</Text>
            </TouchableOpacity>
          </View>

          {/* Manage Habitat */}
          <View style={styles.manageContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Manage Habitat</Text>
            <View style={styles.manageGrid}>
              <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
                // onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentTaskPage" })}
                onPress={() => navigation.navigate("ParentTaskPage")}
              >
                <Ionicons name="list-outline" size={24} color={colors.text} />
                <Text style={{ color: colors.text }}>Task Management</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate("GenericTaskLibrary")}
              >
                <Ionicons name="library-outline" size={24} color={colors.text} />
                <Text style={{ color: colors.text }}>Generic Task Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
                //onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentReward" })}>
                onPress={() => navigation.navigate("parentReward")}
              >
                <Ionicons name="gift-outline" size={24} color={colors.text} />
                <Text style={{ color: colors.text }}>Create Reward</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate("parentReviewTask")}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.text} />
                <Text style={{ color: colors.text }}>Review Task</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate("AccountSetting")}
              >
                <Ionicons name="settings-outline" size={24} color={colors.text} />
                <Text style={{ color: colors.text }}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#EAF5E4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  balanceTitle: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
    marginLeft: 8,
  },
  balanceContent: {
    alignItems: "center",
  },
  starCount: {
    width: "100%",
    textAlign: "center",
    fontSize: 50,
    fontWeight: "700",
  },
  starLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 20,
  },
  points: {
    width: "100%",
    textAlign: "center",
    color: "gray",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  milestoneCard: {
    backgroundColor: "#ffffffff",
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: "#ddd",
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    justifyContent: "center",
    textAlign: "center",
  },
  milestoneContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    textAlign: "center",
    border: "1px solid #ddd",
    padding: 10,
    borderRadius: 8,

  },
  milestoneImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  milestoneText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  milestoneTitle: {
    fontWeight: "600",
    fontSize: 14,
    flexWrap: "wrap",
    flexShrink: 1,

  },
  milestoneDesc: {
    color: "gray",
    flexWrap: "wrap",
    flexShrink: 1,

  },
  milestoneDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    flexWrap: "wrap",
    flexShrink: 1,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.25,
    borderColor: "#ddd",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 2,
  },
  pendingCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C19A00",
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
  },
  pendingText: {
    color: "gray",
    marginBottom: 8,
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
  },
  button: {
    backgroundColor: "#C19A00",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    flexWrap: "wrap",
    width: "100%",
  },
  manageContainer: {
    marginBottom: 20,
  },
  manageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  manageBox: {
    width: "48%",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  manageText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 2,
    width: "100%",
    flexShrink: 1,
    flexWrap: "wrap",
  },
});
