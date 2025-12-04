import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Ionicons from 'react-native-vector-icons/Ionicons';
import { updateDoc } from "firebase/firestore";


const ParentPinScreen = ({ navigation,route  }) => {
  const [pin, setPin] = useState("");

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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" style={styles.backButton} />
          </TouchableOpacity>
          
          <Text style={styles.header}>Parent Access</Text>
      </View> 
        <Text style={styles.label}>Enter Your Pin</Text>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  backButton: {
    fontSize: 20,
    marginTop: 5,
  },
  label: {
    fontSize: 16,
    marginTop: 150,
    marginBottom: 10,
    width: "100%",
    textAlign: "center",
    alignSelf: "center",
    flexWrap: "wrap",
  },
  input: {
    width: "60%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 20,
    alignSelf: "center",
    marginBottom: 20,
  },
  button: {
    alignSelf: "center",
    width: "50%",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ParentPinScreen;
