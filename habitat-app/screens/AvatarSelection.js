import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image} from "react-native";
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
        {/* View Avatars */}
        <Text style={styles.title}>Select Your Avatar</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarContainer}
        >
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
        </ScrollView>

        {/* Get started button */}
        <TouchableOpacity style={[styles.button]} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, marginTop: 150, color: "#2d2d2d", textAlign: "center" },
  avatarContainer: { justifyContent: "center", alignItems: "center", paddingHorizontal: "10%", marginBottom: 5, marginTop: "5%"  },
  avatar: { width: 250, height: 250, marginHorizontal: 10 },
  selectedAvatar: { borderColor: "#4CAF50", borderWidth: 3 },
  button: { width: "50%", backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginHorizontal: "25%", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});