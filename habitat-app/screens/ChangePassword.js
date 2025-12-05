import React, { useState } from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from "react-native";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

const ChangePassword = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    

    const handleResetPassword = async () => {
        const em = email.trim();
        const pw = password.trim();
        const npw = newPassword.trim();
        const cpw = confirmPassword.trim();

        if (!em || !pw || !npw || !cpw) {
            Alert.alert("Missing Info", "Please fill in all fields.");
            return;
        }
        // Validate new password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if ((!passwordRegex.test(npw)) ) {
            Alert.alert("Invalid Password", "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
            return;
        }
        // Validate new passwords match
        if (npw !== cpw) {
            Alert.alert("Mismatch", "Passwords do not match. Please try again.");
            return;
        }

        // Prevent changing to the same password
        if (npw === pw) {
            Alert.alert("No Change", "New password cannot be the same as the current password.");
            return;
        }
        
        setLoading(true);
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user");

            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, pw);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, npw);
            Alert.alert("Success", "Password updated.");
            navigation.goBack();
        } catch (err) {
            console.error("Change password error", err);
            Alert.alert("Error", err.message || "Could not change password.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
        <Text style={styles.header}>Reset Parent Password</Text>

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

        <Text style={styles.label}>New Password</Text>
        <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            keyboardType= "visible-password"
            secureTextEntry
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            keyboardType= "visible-password"
            secureTextEntry
        />

        <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleResetPassword }
            disabled={loading}
        >
            <Text style={styles.buttonText}>
            {loading ? "Updating..." : "Save New Password"}
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

export default ChangePassword;