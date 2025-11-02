/*import React, { useState } from "react";
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
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc } from "firebase/firestore";

export default function ParentReviewTask({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
      setLoading(false);
    });

    return unsubscribe; // cleanup listener
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5CB85C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Parent Review Tasks</Text>

      {tasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet. Create one from the dashboard!</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.description}</Text>
                <Text style={styles.date}>
                  📅 {item.scheduleDate} at ⏰ {item.time}
                </Text>
              </View>

              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash" size={22} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f7f7f7", paddingTop: 50 },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20, textAlign: "center", color: "#222" },
  
  taskCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 15,
  
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#555", marginVertical: 5 },
  date: { fontSize: 13, color: "#777" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#555", marginTop: 40 },
});*/
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function ParentReviewTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks(taskList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleVerify = async (id) => {
    try {
      await updateDoc(doc(db, "tasks", id), {
        verified: true,
      });
    } catch (error) {
      console.error("Error verifying task:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5CB85C" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review Tasks</Text>

      {tasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet. Create one from the dashboard!</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
                  <Text style={styles.pointsText}>{item.points || "10"} Pts</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View style={[styles.progressFill, { width: "100%" }]} />
                </View>
                <Text style={styles.stepsText}>1/1 Steps</Text>
              </View>

              {/* Completion & Verify Row */}
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-done-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.completeText}>Marked as Complete</Text>
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, item.verified && { backgroundColor: "#A5D6A7" }]}
                onPress={() => handleVerify(item.id)}
                disabled={item.verified}
              >
                <Text style={styles.verifyText}>
                  {item.verified ? "Verified" : "Verify Completed"}
                </Text>
              </TouchableOpacity>

              {/* Optional Delete Icon */}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
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

