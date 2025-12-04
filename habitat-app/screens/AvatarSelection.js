import { View, Text, TouchableOpacity, StyleSheet, Animated, Image} from "react-native";
import React, {useState} from "react";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function AvatarSelection({navigation, route}) {
  const [selectedAvatar, setSelected] = useState(null);
  const childId = route?.params?.childId;

  const avatars = [
    { id: "panda", image: require("../assets/panda.png") },
    { id: "turtle", image: require("../assets/turtle.jpg")},
    { id: "giraffe", image: require("../assets/giraffe.jpg") },
  ];

  const handleAvatarSelect = (avatarId) => {
        setSelected(avatarId); //Update selected avatar
    };
  
  {/* Add avatar to database->navigate to ChildHome screen */}
  const handleGetStarted = async () => {
    try {
      if (selectedAvatar && childId) {
      const docRef = doc(db, "children", childId);
      await updateDoc(docRef, {avatar: selectedAvatar});
      navigation.navigate("ChildTabs");
      }
    }
    catch (e) {
      console.error("Error saving avatar: ", e);
    }
    // Navigate to ChildTabs screen
    navigation.navigate("ChildTabs");
  };

  return (
    <SafeAreaView>
      <Text style={styles.title}>Select Your Avatar</Text>

        {/* View Avatars */}
        <View style={styles.avatarContainer}>
            {avatars.map((avatar) => (
            <TouchableOpacity
              key={avatar.id}
              onPress={() => handleAvatarSelect(avatar.id)}
            >
              <Image 
              source={avatar.image} 
              style={[
                styles.avatar,
                selectedAvatar === avatar.id && styles.selectedAvatar, //Highlight if selected
                ]}
              />
            </TouchableOpacity>
            ))}
        </View>

        {/* Get started button */}
        <TouchableOpacity style={[styles.button]} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  avatarContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 5 },
  avatar: { width: 200, height: 200, borderRadius: 15, borderWidth: 2, borderColor: "#cccbcbff", backgroundColor: "#ffffffff" },
  selectedAvatar: { borderColor: "#4CAF50", borderWidth: 2 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});