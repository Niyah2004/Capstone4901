import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, updateDoc, where } from "firebase/firestore";
import {getAuth} from "firebase/auth";

export default function ParentReviewTask() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) { setTasks([]); setLoading(false); return; }

    // Filter to only tasks created by this parent
    const q = query(
      collection(db, "tasks"),
      where("ownerId", "==", uid),       // <-- your field: ownerId/parentId/userId
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(list);
      setLoading(false);
    }, (err) => {
      console.error("onSnapshot error:", err);
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleVerify = async (id) => {
    try { await updateDoc(doc(db, "tasks", id), { verified: true }); }
    catch (e) { console.error("Error verifying task:", e); }
  };

  const handleDelete = async (id) => {
    try { await deleteDoc(doc(db, "tasks", id)); }
    catch (e) { console.error("Error deleting task:", e); }
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

