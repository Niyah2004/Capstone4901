import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { useParentLock } from "../ParentLockContext";
import { db } from "../firebaseConfig";
import {doc,onSnapshot,getDoc,query,collection,where,limit} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function ParentDashBoard({ navigation, route }) {
   const { isParentUnlocked } = useParentLock();

  const [childPoints, setChildPoints] = useState({
    points: 0,
    loading: true,
  });

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

    // Use the same childId logic as ChildTask to keep points aligned.
    const childIdFromRoute = route?.params?.childId;
    const childId = childIdFromRoute || user?.uid;

    if (!childId) {
      setChildPoints({ points: 0, loading: false });
      return;
    }

    const childPointsRef = doc(db, "childPoints", childId);

    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, [route]));


  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.ScrollView}>
          {/* Header */}
          <Text style={styles.header}>Parent Dashboard</Text>

      {/* Current Balance Card */}
      <View style={styles.card}>
        <View style={styles.balanceHeader}>
          <Ionicons name="star-outline" size={30} color="#000" />
          <Text style={styles.balanceTitle}>Current Balance</Text>
        </View>
        <TouchableOpacity style={styles.balanceContent}>
        <Text style={styles.starCount}>
  {childPoints.loading ? "--" : childPoints.points}
</Text>
<Text style={styles.starLabel}>Star Points</Text>
<Text style={styles.points}>
  {childPoints.loading ? "Loading..." : "Current Balance"}
</Text>

        </TouchableOpacity>
      </View>

      {/* Recent Milestone */}
      <View style={styles.milestoneCard}>
        <Text style={styles.sectionTitle}>Recent Milestone</Text>
        <View style={styles.milestoneContent}>
          <Image
           source={require("../assets/reading.jpeg")} 
            style={styles.milestoneImage}
          />
          <View>
            <Text style={styles.milestoneTitle}>Completed 'Read 5 Books' Challenge</Text>
            <Text style={styles.milestoneDesc}>
              Leo earned a virtual trophy for diligently reading 5 books.
            </Text>
            <Text style={styles.milestoneDate}>Achieved on August 15, 2024</Text>
          </View>
        </View>
      </View>

      {/* Tasks Awaiting Approval */}
      <View style={styles.taskCard}>
        <Text style={styles.sectionTitle}>Tasks Awaiting Approval</Text>
        <Text style={styles.pendingCount}>3</Text>
        <Text style={styles.pendingText}>pending tasks</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("parentReviewTask")}>
          <Text style={styles.buttonText}>Review Tasks →</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Habitat */}
      <View style={styles.manageContainer}>
        <Text style={styles.sectionTitle}>Manage Habitat</Text>
        <View style={styles.manageGrid}>
          <TouchableOpacity style={styles.manageBox}
           // onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentTaskPage" })}
          onPress={() => navigation.navigate("ParentTaskPage")}
          >
            <Ionicons name="list-outline" size={24} color="#000" />
            <Text>Task Management</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageBox}
          //onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentReward" })}>
             onPress={() => navigation.navigate("parentReward")}
             >
            <Ionicons name="gift-outline" size={24} color="#000" />
            <Text>Create Reward</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageBox}
          onPress={() => navigation.navigate("parentReviewTask")}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#000" />
            <Text>Review Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manageBox}
          onPress={() => navigation.navigate("AccountSetting")}
          >
            <Ionicons name="settings-outline" size={24} color="#000" />
            <Text>Settings</Text>
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
    padding: 50,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 15,
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
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  balanceContent: {
    alignItems: "center",
  },
  starCount: {
    fontSize: 50,
    fontWeight: "700",
  },
  starLabel: {
    fontSize: 20,
  },
  points: {
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
    border: "1px solid #ddd",
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
    border: "1px solid #ddd",
    padding: 10,
    borderRadius: 8,
    
  },
  milestoneImage: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  milestoneTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  milestoneDesc: {
    color: "gray",
  },
  milestoneDate: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
  },
  pendingCount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#C19A00",
  },
  pendingText: {
    color: "gray",
    marginBottom: 8,
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
    alignItems: "center",
    marginBottom: 10,
  },
});
