import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function ChildProfileSetupScreen({ navigation, route }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  
  const save = async () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      Alert.alert("PIN Error", "PIN must be 4 digits and match confirmation.");
      return;
    }
    // placeholder: save data to state / backend
    Alert.alert("Saved", "Child profile saved.");
    navigation.navigate("AvatarSelection");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Child Profile Setup</Text>

        <TextInput style={styles.input} placeholder="Enter 4-digit PIN" secureTextEntry value={pin} onChangeText={setPin} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="Confirm PIN" secureTextEntry value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" />

        <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Preferred Name" value={preferredName} onChangeText={setPreferredName} />
        <TextInput style={styles.input} placeholder="Age (years)" keyboardType="numeric" value={age} onChangeText={setAge} />
        <TextInput style={styles.input} placeholder="Grade Level" value={grade} onChangeText={setGrade} />
        <TextInput style={[styles.input, { height: 80 }]} placeholder="Special Needs or Preferences (Optional)" multiline value={notes} onChangeText={setNotes} />

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
