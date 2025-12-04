import React, { useState } from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from "react-native";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";

const ChangeEmail = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        const em = email.trim();
        const pw = password.trim();
        const nem = newEmail.trim();
        const cem = confirmEmail.trim();

        if (!em || !pw || !nem || !cem) {
        Alert.alert("Missing Info", "Please fill in all fields.");
        return;
        }

        // Validate new email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(nem)) {
            Alert.alert("Invalid Email", "Please enter a valid new email address.");
        return;
        }

        // Validate new email are the same
        if (nem !== cem) {
        Alert.alert("Mismatch", "New emails do not match. Please try again.");
        return;
        }
        
        // Prevent changing to the same email
        if (nem === em) {
            Alert.alert("No Change", "New email cannot be the same as the current email.");
            return;
        }

        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user");

            // Re-authenticate
            const credential = EmailAuthProvider.credential(em, pw);
            await reauthenticateWithCredential(user, credential);
            
            // Update email
            await updateEmail(user, nem);
            Alert.alert("Success", "Email updated.");
            navigation.goBack();
        } catch (err) {
            console.error("Change email error", err);
            Alert.alert("Error", err.message || "Could not change email.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
        <Text style={styles.header}>Change Parent Email</Text>

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

        <Text style={styles.label}>New Email</Text>
        <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType= "email-address"
            maxLength={50}
        />

        <Text style={styles.label}>Confirm New Email</Text>
        <TextInput
            style={styles.input}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            autoCapitalize="none"
            keyboardType= "email-address"
            maxLength={50}
        />

        <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleResetPassword}
            disabled={loading}
        >
            <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Save New Email"}
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
    width: "100%",
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

export default ChangeEmail;