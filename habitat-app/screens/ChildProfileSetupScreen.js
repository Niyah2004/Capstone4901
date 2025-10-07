import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function ChildProfileSetupScreen({ navigation }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const save = () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      Alert.alert("PIN Error", "PIN must be 4 digits and match confirmation.");
      return;
    }
    // placeholder: save data to state / backend
    Alert.alert("Saved", "Child profile saved.");
    navigation.navigate("SelectAvatars");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Child Profile Setup</Text>

        <TextInput style={styles.input} placeholder="Enter 4-digit PIN" secureTextEntry value={pin} onChangeText={setPin} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="Confirm PIN" secureTextEntry value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" />

        <TextInput style={styles.input} placeholder="Full Name" />
        <TextInput style={styles.input} placeholder="Preferred Name" />
        <TextInput style={styles.input} placeholder="Age (years)" keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Grade Level" />
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Special Needs or Preferences (Optional)" multiline />

        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Save Details</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  form: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
