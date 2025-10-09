import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

const ParentPinScreen = ({ navigation }) => {
  const [pin, setPin] = useState("");

  const correctPin = "1234"; // 🔒 placeholder — later, we can fetch this from Firebase

  const handleSubmit = () => {
    if (pin === correctPin) {
      navigation.replace("ParentDashBoard"); // go to dashboard
    } else {
      Alert.alert("Incorrect PIN", "Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Parent Access</Text>

      <Text style={styles.label}>Enter Your PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit PIN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    width: "60%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ParentPinScreen;
