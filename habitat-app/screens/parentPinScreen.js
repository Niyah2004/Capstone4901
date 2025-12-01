import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { updateDoc } from "firebase/firestore";
import { useParentLock } from "../ParentLockContext";


const ParentPinScreen = ({ navigation,route  }) => {
  const [pin, setPin] = useState("");
  const { unlockParent } = useParentLock();

  const correctPin = async () => {
    if (pin.length !== 4) {
      Alert.alert("Invalid PIN", "PIN must be 4 digits.");
      return false;
    }
    try {
      const user = getAuth().currentUser;
      if (!user) {
        Alert.alert("Error", "No authenticated user found.");
        return false;
      }
      const parentRef = doc(db, "parents", user.uid);
      const parentSnap = await getDoc(parentRef);

      if (parentSnap.exists()) {
        const storedPin = parentSnap.data().parentPin;

        if (pin === storedPin) {
          unlockParent(); //testing should allow for navigation
          Alert.alert("Access Granted", "Welcome to your Parent Dashboard!");
          navigation.replace("ParentDashBoard");
        } else {
          Alert.alert("Incorrect PIN", "Please try again.");
        }
      } else {
        Alert.alert("Error", "No PIN found. Please set one up first.");
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      Alert.alert("Error", "Something went wrong verifying your PIN.");
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

      <TouchableOpacity style={styles.button} onPress={correctPin}>
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
