  import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ParentReviewTask({navigation}) {
    const [tasks, setTasks] = useState([
    { id: "1", title: "Read a book for 15 minutes", points: 20, steps: "1/1 Steps", icon: "book-outline", completed: false },
    { id: "2", title: "Brush teeth for 2 minutes", points: 10, steps: "1/1 Steps", icon: "brush-outline", completed: false },
    { id: "3", title: "Make your bed neatly", points: 10, steps: "1/1 Steps", icon: "bed-outline", completed: false },
    { id: "4", title: "Tidy up your room", points: 25, steps: "3/3 Steps", icon: "home-outline", completed: false },
  ]);

  const toggleComplete = (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const renderTask = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.taskHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={22} color="#C6A700" />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsText}>{item.points} Pts</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressFill}></View>
      </View>

      <View style={styles.taskFooter}>
        <TouchableOpacity
          style={styles.checkBoxContainer}
          onPress={() => toggleComplete(item.id)}
        >
          <View
            style={[
              styles.checkBox,
              item.completed && { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </View>
          <Text style={styles.checkText}>
            {item.completed ? "Marked as Complete" : "Mark as Complete"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.verifyButton}>
          <Text style={styles.verifyText}>Verify Completed</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stepsText}>{item.steps}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
        <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name="arrow-back-outline" size={24} color="#4CAF50" />
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
      <Text style={styles.header}>Review Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
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
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    backgroundColor: "#FFF8E1",
    borderRadius: 50,
    padding: 10,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  pointsContainer: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  pointsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    width: "100%",
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  stepsText: {
    color: "#777",
    fontSize: 13,
    marginTop: 4,
    textAlign: "right",
  },
  taskFooter: {
    marginTop: 5,
  },
  checkBoxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkText: {
    color: "#333",
    fontSize: 14,
  },
  verifyButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 10,
  },
  verifyText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});