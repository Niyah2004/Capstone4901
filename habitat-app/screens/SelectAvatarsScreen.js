import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView , Image} from "react-native";

export default function SelectAvatarsScreen({ navigation }) {
  const [selectedAvatar, setSelected] = useState(null);

  const avatars = [
    { id: "panda", image: require("../assets/images/panda.png") }
  ];
  const handleAvatarSelect = (avatarId) => {
        setSelected(avatarId); // Update selected avatar
    };

    const handleGetStarted = () => {
        if (selectedAvatar) {
            navigation.navigate("Home"); // Navigate to the next screen
        }
    };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
                        selectedAvatar === avatar.id && styles.selectedAvatar, // Highlight if selected
                    ]}
                />
            </TouchableOpacity>
            ))}
        </View>
        {/* Get started button */}
        <TouchableOpacity style={[styles.button]} onPress={handleGetStarted} disabled={!selectedAvatar}>
            <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 18, textAlign: "center" },
  avatarContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 5 },
  avatar: { width: 200, height: 200, borderRadius: 45, borderWidth: 2, borderColor: "#cccbcbff" },
  selectedAvatar: { borderColor: "#4CAF50", backgroundWidth: 4 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});