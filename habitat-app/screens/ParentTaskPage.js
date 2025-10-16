// different from parent review task page this is where parents create task
import react from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function ParentTaskPage({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.page}>
        <Text style={styles.title}>Parent Task Management</Text>
        <Text style={styles.subtitle}>Create and manage tasks for your child.</Text>

        <TouchableOpacity style={styles.button} onPress={() => alert("Add Task flow placeholder")}>
          <Text style={styles.buttonText}>Add New Task</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => alert("Edit Task flow placeholder")}>
          <Text style={styles.buttonText}>Edit Existing Tasks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("ParentDashBoard")}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  page: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});