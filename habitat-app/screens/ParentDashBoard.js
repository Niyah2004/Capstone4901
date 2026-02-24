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

    const childIdFromRoute = route?.params?.childId;
    let pointsUnsub = () => {};

    if (childIdFromRoute) {
      const childPointsRef = doc(db, "childPoints", childIdFromRoute);
      pointsUnsub = onSnapshot(
        childPointsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const balance = data.points ?? data.stars ?? data.totalPoints ?? 0;
            setChildPoints({ points: balance, loading: false });
          } else {
            setChildPoints({ points: 0, loading: false });
          }
        },
        (error) => {
          console.error("Error listening to childPoints:", error);
          setChildPoints((prev) => ({ ...prev, loading: false }));
        }
      );
    } else {
      // Parent dashboard default: aggregate balances for this parent's children.
      const parentChildPointsQuery = query(
        collection(db, "childPoints"),
        where("parentId", "==", user.uid)
      );
      let fallbackUnsub = () => {};
      let isFallbackActive = false;
      pointsUnsub = onSnapshot(
        parentChildPointsQuery,
        (snap) => {
          if (!snap.empty) {
            try { fallbackUnsub(); } catch {}
            fallbackUnsub = () => {};
            isFallbackActive = false;
            const total = snap.docs.reduce((sum, d) => {
              const data = d.data() || {};
              return sum + Number(data.points ?? data.stars ?? data.totalPoints ?? 0);
            }, 0);
            setChildPoints({ points: total, loading: false });
            return;
          }

          // Backward compatibility if older docs don't have parentId.
          if (!isFallbackActive) {
            const fallbackRef = doc(db, "childPoints", user.uid);
            fallbackUnsub = onSnapshot(
              fallbackRef,
              (fallbackSnap) => {
                if (fallbackSnap.exists()) {
                  const data = fallbackSnap.data();
                  const balance = data.points ?? data.stars ?? data.totalPoints ?? 0;
                  setChildPoints({ points: balance, loading: false });
                } else {
                  setChildPoints({ points: 0, loading: false });
                }
              },
              (fallbackErr) => {
                console.error("Error listening to fallback childPoints:", fallbackErr);
                setChildPoints((prev) => ({ ...prev, loading: false }));
              }
            );
            isFallbackActive = true;
          }
        },
        (err) => {
          console.error("Error listening to parent childPoints:", err);
          setChildPoints((prev) => ({ ...prev, loading: false }));
        }
      );
      const parentPointsUnsub = pointsUnsub;
      pointsUnsub = () => {
        try { parentPointsUnsub(); } catch {}
        try { fallbackUnsub(); } catch {}
      };
    }

    let pendingUnsub = () => {};
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
      try { pointsUnsub(); } catch {}
      try { pendingUnsub(); } catch {}
    };
  }, [route]));


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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Milestone</Text>
        <View style={styles.milestoneContent}>
          <Image
            source={require("../assets/reading.jpeg")} 
            style={styles.milestoneImage}
          />
          <View style={styles.milestoneText}>
            <Text style={[styles.milestoneTitle, { color: colors.text }]}>Completed 'Read 5 Books' Challenge</Text>
            <Text style={[styles.milestoneDesc, { color: colors.muted }]}>
              Leo earned a virtual trophy for diligently reading 5 books.
            </Text>
            <Text style={[styles.milestoneDate, { color: colors.muted }]}>Achieved on August 15, 2024</Text>
          </View>
        </View>
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
            <Text style={[styles.manageText, { color: colors.text }]}>Task Management</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
          //onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentReward" })}>
             onPress={() => navigation.navigate("parentReward")}
             >
            <Ionicons name="gift-outline" size={24} color={colors.text} />
            <Text style={[styles.manageText, { color: colors.text }]}>Create Reward</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("parentReviewTask")}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.text} />
            <Text style={[styles.manageText, { color: colors.text }]}>Review Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.manageBox, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("AccountSetting")}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <Text style={[styles.manageText, { color: colors.text }]}>Settings</Text>
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
    textAlign:"center",
  },
  milestoneContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    textAlign:"center",  
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    flexWrap: "nowrap",
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
