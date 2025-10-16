/*import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function ParentDashBoard({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.dashboard}>
        <Text style={styles.title}>Parent Dashboard</Text>
        <Text style={styles.subtitle}>Manage your child's tasks and monitor progress.</Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ParentTaskPage")}>
          <Text style={styles.buttonText}>Go to Task Management</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => alert("View Progress flow placeholder")}>
          <Text style={styles.buttonText}>View Child's Progress</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  dashboard: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  button: { backgroundColor: "#2196F3", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
}); */ 

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // for icons


export default function ParentDashBoard({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Parent Dashboard</Text>

      {/* Current Balance Card */}
      <View style={styles.card}>
        <View style={styles.balanceHeader}>
          <Ionicons name="star-outline" size={30} color="#000" />
          <Text style={styles.balanceTitle}>Current Balance</Text>
        </View>
        <TouchableOpacity style={styles.balanceContent}>
          <Text style={styles.starCount}>15</Text> 
          <Text style={styles.starLabel}>Stars</Text>
          <Text style={styles.points}>1250 Total Points</Text>
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
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Review Tasks →</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Habitat */}
      <View style={styles.manageContainer}>
        <Text style={styles.sectionTitle}>Manage Habitat</Text>
        <View style={styles.manageGrid}>
          <TouchableOpacity style={styles.manageBox}
           // onPress={() => navigation.navigate("ParentStackScreen", { screen: "parentTaskPage" })}
          onPress={() => navigation.navigate("parentTaskPage")}
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

