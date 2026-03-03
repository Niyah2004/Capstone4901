import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { AVATARS } from "../data/avatars";

export default function AvatarSelection({ navigation, route }) {
  const [selectedAvatar, setSelected] = useState(null);
  const childId = route?.params?.childId;

  const handleAvatarSelect = (avatarId) => {
    setSelected(avatarId);
  };

  const handleGetStarted = async () => {
    try {
      if (selectedAvatar && childId) {
        const docRef = doc(db, "children", childId);
        await updateDoc(docRef, { avatar: selectedAvatar });
        navigation.navigate("ChildTabs");
      }
    } catch (e) {
      console.error("Error saving avatar: ", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Your Avatar</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.avatarContainer}
      >
        {Object.entries(AVATARS).map(([avatarId, avatarData]) => (
          <TouchableOpacity
            key={avatarId}
            onPress={() => handleAvatarSelect(avatarId)}
            style={[
              selectedAvatar === avatarId && styles.selectedAvatar
            ]}
          >
            <Image
              source={avatarData.base}
              style={styles.avatar}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.button, !selectedAvatar && { opacity: 0.5 }]}
        onPress={handleGetStarted}
        disabled={!selectedAvatar}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, marginTop: 150, color: "#2d2d2d", textAlign: "center" },
  avatarContainer: { justifyContent: "center", alignItems: "center", paddingHorizontal: "10%", marginBottom: 5, marginTop: "5%"  },
  avatar: { width: 300, height: 300, marginHorizontal: 10},
  selectedAvatar: { borderColor: "#4CAF50", borderWidth: 3 },
  button: { width: "50%", backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginHorizontal: "25%", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});