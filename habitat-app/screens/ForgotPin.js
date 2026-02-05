// screens/ForgotPinScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const ForgotPinScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Info", "Please enter your email and password.");
      return;
    }

    if (newPin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Invalid PIN", "PIN must be 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("Mismatch", "PINs do not match. Please try again.");
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();

      // Re-authenticate / verify the parent using email + password
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      if (!user) {
        Alert.alert("Error", "Could not verify your account.");
        setLoading(false);
        return;
      }

      const parentRef = doc(db, "parents", user.uid);
      await updateDoc(parentRef, { parentPin: newPin });

      setLoading(false);
      Alert.alert("PIN Updated", "Your parent PIN has been reset.");
      navigation.replace("parentPinScreen"); // go back to PIN entry screen
    } catch (err) {
      console.error("Error resetting PIN:", err);
      setLoading(false);

      // basic error messaging
      Alert.alert(
        "Authentication Failed",
        "Could not verify your email or password. Please try again."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reset Parent PIN</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>New PIN</Text>
      <TextInput
        style={styles.input}
        value={newPin}
        onChangeText={setNewPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
      />

      <Text style={styles.label}>Confirm New PIN</Text>
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleResetPin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Save New PIN"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <Text style={styles.cancelText}>Cancel</Text>
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
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    alignSelf: "flex-start",
    marginLeft: "20%",
    marginBottom: 5,
  },
  input: {
    width: "60%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
  },
  cancelText: {
    color: "#4CAF50",
    fontWeight: "500",
  },
});

export default ForgotPinScreen;
