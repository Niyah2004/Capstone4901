import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";


export default function AvatarSelection() {
  const navigation = useNavigation();
{/* Avatar Selection page paste code in here */}
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
       

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("ChildTabs")}
        >
          <Text style={styles.buttonText}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  form: { marginVertical: 20 },
  font: { fontFamily: "Phosphate", fontSize: 28, color: "#333" },
  title: { fontFamily: "Phosphate", fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000", textAlign: "center" },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  avatarItem: { width: "30%", alignItems: "center", marginBottom: 20 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  avatarName: { marginTop: 10, fontSize: 14, color: "#555" },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
