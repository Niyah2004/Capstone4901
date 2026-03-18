import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {doc, setDoc} from "firebase/firestore";
import { auth } from "../auth";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

export default function ChildProfileSetupScreen({ navigation, route }) {
  const { theme } = useTheme();
  const colors = theme.colors;
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Child Profile Setup</Text>

        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Enter 4-digit PIN" placeholderTextColor={colors.muted} secureTextEntry value={pin} onChangeText={setPin} keyboardType="number-pad" />
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Confirm PIN" placeholderTextColor={colors.muted} secureTextEntry value={confirmPin} onChangeText={setConfirmPin} keyboardType="number-pad" />

        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Full Name" placeholderTextColor={colors.muted} value={fullName} onChangeText={setFullName} />
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Preferred Name" placeholderTextColor={colors.muted} value={preferredName} onChangeText={setPreferredName} />
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Age (years)" placeholderTextColor={colors.muted} keyboardType="numeric" value={age} onChangeText={setAge} />
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Grade Level" placeholderTextColor={colors.muted} value={grade} onChangeText={setGrade} />
        <TextInput style={[styles.input, { height: 80, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} placeholder="Special Needs or Preferences (Optional)" placeholderTextColor={colors.muted} multiline value={notes} onChangeText={setNotes} />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={addChild}>
          <Text style={styles.buttonText}>Add Child</Text>
        </TouchableOpacity>

        {children.map((child, index) => (
          <View key={index} style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>{child.fullName}</Text>
            <TouchableOpacity onPress={() => removeChild(index)}>
              <Text style={{ color: colors.danger }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={saveAll}>
          <Text style={styles.buttonText}>Finish Setup</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  form: { marginVertical: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  childCard: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});