import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {doc, setDoc} from "firebase/firestore";
import { auth } from "../auth";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";

export default function ChildProfileSetupScreen({ navigation, route }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [notes, setNotes] = useState("");
  const [children, setChildren] = useState([]);

    const addChild = () => {
    if (children.length >= 3) {
      Alert.alert("Limit Reached", "You can add up to 3 children.");
      return;
    }

    if (!fullName) {
      Alert.alert("Missing Info", "Please enter the child's name.");
      return;
    }

    const newChild = {
      fullName,
      preferredName,
      age,
      grade,
      notes,
    };

    setChildren([...children, newChild]);

    setFullName("");
    setPreferredName("");
    setAge("");
    setGrade("");
    setNotes("");
  };

  const removeChild = (index) => {
    const updated = [...children];
    updated.splice(index, 1);
    setChildren(updated);
  };

  const saveAll = async () => {
    if (pin.length !== 4 || pin !== confirmPin) {
      Alert.alert("PIN Error", "PIN must be 4 digits and match confirmation.");
      return;
    }

    if (children.length === 0) {
      Alert.alert("No Children", "Please add at least one child.");
      return;
    }

    if (!fullName) {
      Alert.alert("Missing Info", "Please enter the child's name.");
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const userId = user ? user.uid : null;
      const parentRef = await setDoc(doc(db, "parents", userId), {
        parentPin: pin,
        userId,
        createdAt: new Date().toISOString(),
      });
      console.log("Parent pin saved with Parent Id:", userId);

      for (const child of children) {
        await addDoc(collection(db, "children"), {
          ...child,
          userId,
        });
      }
      
      const docRef = await addDoc(collection(db, "children"), {
        fullName,
        preferredName,
        age,
        grade,
        notes,
        userId,
      });
      Alert.alert("Saved", "Child profiles saved.");
     // console.log("Parent pin saved with Parent Id:", parentRef.id);
      console.log("Navigating to AvatarSelection with childId:", docRef.id);
      navigation.navigate("AvatarSelection", { childId: docRef.id });
    } catch (e) {
      console.log("Error adding document: ", e);
      Alert.alert("Error", "Could not save profile.");
    }
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

        <TouchableOpacity style={styles.button} onPress={addChild}>
          <Text style={styles.buttonText}>Add Child</Text>
        </TouchableOpacity>

        {children.map((child, index) => (
          <View key={index} style={styles.childCard}>
            <Text>{child.fullName}</Text>
            <TouchableOpacity onPress={() => removeChild(index)}>
              <Text style={{ color: "red" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={saveAll}>
          <Text style={styles.buttonText}>Finish Setup</Text>
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