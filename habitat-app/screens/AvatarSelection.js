import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { AVATARS } from "../data/avatars";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from "react-native";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";

export default function AvatarSelection({ navigation, route }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [equipped, setEquipped] = useState({}); 
  const [loading, setLoading] = useState(true);
  const childId = route?.params?.childId;

  useEffect(() => {
    const loadChildAvatar = async () => {
      if (!childId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "children", childId));
        if (snap.exists()) {
          const child = snap.data();

          const currentBase =
            typeof child.avatar === "string" ? child.avatar : child.avatar?.base;

          if (currentBase) setSelectedAvatar(currentBase);
        }
      } catch (e) {
        console.log("Error loading child avatar:", e);
      } finally {
        setLoading(false);
      }
    };

    loadChildAvatar();
  }, [childId]);

  const handleAvatarSelect = (avatarId) => {
    setSelectedAvatar(avatarId);
  };

  const handleSave = async () => {
    if (!childId) {
      Alert.alert("Error", "Missing childId.");
      return;
    }

    if (!selectedAvatar) {
      Alert.alert("Select an avatar", "Please choose an avatar first.");
      return;
    }

    try {
      const childRef = doc(db, "children", childId);

      await setDoc(
        childRef,
        {
          avatar: {
            base: selectedAvatar,
            equipped: {}, 
          },
        },
        { merge: true }
      );

      navigation.goBack();


    } catch (e) {
      console.error("Error saving avatar:", e);
      Alert.alert("Error", "Could not save avatar.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Select Your Avatar</Text>

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
              selectedAvatar === avatarId && [styles.selectedAvatar, { borderColor: colors.primary }]
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
        style={[styles.button, { backgroundColor: colors.primary }, !selectedAvatar && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={!selectedAvatar}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, marginTop: 150, textAlign: "center" },
  avatarContainer: { justifyContent: "center", alignItems: "center", paddingHorizontal: "10%", marginBottom: 5, marginTop: "5%" },
  avatar: { width: 300, height: 300, marginHorizontal: 10 },
  selectedAvatar: { borderWidth: 3 },
  button: { width: "50%", padding: 15, borderRadius: 8, alignItems: "center", marginHorizontal: "25%", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});