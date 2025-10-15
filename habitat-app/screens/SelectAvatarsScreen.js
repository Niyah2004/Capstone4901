import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function SelectAvatarsScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  const avatars = [
    //{ id: "fox", label: "Fox" },
    //{ id: "owl", label: "Owl" },
    //{ id: "turtle", label: "Turtle" },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose an Avatar</Text>
        <View style={styles.avatarRow}>
            {avatars.map((a) => (
            <TouchableOpacity
                key={a.id}
                style={[styles.avatarWrap, selected === a.id && styles.avatarSelected]}
                onPress={() => setSelected(a.id)}
            >
                <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{a.label.charAt(0)}</Text>
                </View>
                <Text style={styles.avatarLabel}>{a.label}</Text>
            </TouchableOpacity>
            ))}
        </View>
      <TouchableOpacity style={[styles.button]} onPress={() => navigation.navigate("Home")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  form: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18, textAlign: "center" },
  avatarRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  avatarWrap: { alignItems: "center", padding: 8, flex: 1, marginHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: "transparent" },
  avatarSelected: { borderColor: "#4CAF50", backgroundColor: "rgba(76,175,80,0.08)" },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#EEE", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "bold", color: "#333" },
  avatarLabel: { marginTop: 8, fontSize: 14 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  requirements: { fontSize: 12, color: "#555", marginLeft: 8 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { textAlign: "center", color: "#4CAF50" },
});