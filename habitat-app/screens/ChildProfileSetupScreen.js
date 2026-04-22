import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {doc, setDoc} from "firebase/firestore";
import { auth } from "../auth";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ChildProfileSetupScreen({ navigation, route }) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
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

  if (!fullName || fullName.trim().length === 0) {
    Alert.alert("Missing Info", "Please enter the child's full name.");
    return;
  }

  const newChild = {
    fullName: fullName.trim(),
    preferredName: preferredName?.trim() || "",
    age: age ? Number(age) : null,
    grade: grade?.trim() || "",
    notes: notes?.trim() || "",
  };

  setChildren((prev) => [...prev, newChild]);

  setFullName("");
  setPreferredName("");
  setAge("");
  setGrade("");
  setNotes("");
};
/*
    if (!fullName) {
      Alert.alert("Missing Info", "Please enter the child's name.");
      return;
    }
*/
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

  

    let childrenToSave = [...children];

  const hasTypedAChild = fullName && fullName.trim().length > 0;
  if (childrenToSave.length === 0 && hasTypedAChild) {
   childrenToSave.push({
  fullName: fullName.trim(),
  preferredName: preferredName?.trim() || "",
  age: age ? Number(age) : null,
  grade: grade?.trim() || "",
  notes: notes?.trim() || "",
    });
  }

  if (childrenToSave.length === 0) {
    Alert.alert("Missing Info", "Please add at least one child before finishing setup.");
    return;
  }

    try {
     const firebaseAuth = getAuth();
      const user = firebaseAuth.currentUser;
      const userId = user ? user.uid : null;

      if (!userId) {
        Alert.alert("Error", "No logged-in parent user found.");
        return;
      }

      await setDoc(doc(db, "parents", userId), {
        parentPin: pin,
        userId,
        createdAt: new Date().toISOString(),
      });
      console.log("Parent pin saved with Parent Id:", userId);

  const createdChildIds = [];

for (const child of childrenToSave) {
  const childDocRef = await addDoc(collection(db, "children"), {
    ...child,
    userId,
    points: 0,
    avatar: "panda",
    wardrobe: {},
    createdAt: new Date().toISOString(),
  });

  createdChildIds.push(childDocRef.id);
}

   /*   
      const docRef = await addDoc(collection(db, "children"), {
        fullName,
        preferredName,
        age,
        grade,
        notes,
        userId,
      });
      */

      Alert.alert("Saved", "Child profiles saved.");
     // console.log("Parent pin saved with Parent Id:", parentRef.id);
     // console.log("Navigating to AvatarSelection with childId:", docRef.id);
    //  navigation.navigate("AvatarSelection", { childId: docRef.id });
    navigation.replace("ChildSelection");
    } catch (e) {
      console.log("Error adding document: ", e);
      Alert.alert("Error", "Could not save profile.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.form}>
        <Text style={styles.title}>Child Profile Setup</Text>

        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Enter 4-digit PIN" secureTextEntry={!showPin} value={pin} onChangeText={setPin} keyboardType="number-pad" />
          <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon}>
            <Ionicons name={showPin ? "eye-off" : "eye"} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Confirm PIN" secureTextEntry={!showConfirmPin} value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" />
          <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)} style={styles.eyeIcon}>
            <Ionicons name={showConfirmPin ? "eye-off" : "eye"} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Preferred Name" value={preferredName} onChangeText={setPreferredName} />
        <TextInput style={styles.input} placeholder="Age (years)" keyboardType="numeric" value={age} onChangeText={setAge} />
        

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
  passwordContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 12 },
  passwordInput: { flex: 1, padding: 12 },
  eyeIcon: { padding: 12 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});