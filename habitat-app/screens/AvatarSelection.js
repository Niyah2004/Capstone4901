import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { AVATARS } from "../data/avatars";

export default function AvatarSelection({ navigation, route }) {
  const [selectedAvatar, setSelected] = useState(null);
  const [equipped, setEquipped] = useState({}); 
  const childId = route?.params?.childId;

  const avatars = [
    { id: "panda", image: require("../assets/panda.png") },
    { id: "turtle", image: require("../assets/turtle.jpg")},
    { id: "giraffe", image: require("../assets/giraffe.jpg") },
  ];

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