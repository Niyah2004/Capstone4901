import React, { useState } from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert} from "react-native";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

const ChangeEmail = ({ navigation }) => {
    const { theme } = useTheme();
    const colors = theme.colors;
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.text }]}>Change Parent Email</Text>

        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { color: colors.text }]}>New Email</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            maxLength={50}
            placeholderTextColor={colors.muted}
        />

        <Text style={[styles.label, { color: colors.text }]}>Confirm New Email</Text>
        <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            maxLength={50}
            placeholderTextColor={colors.muted}
        />

        <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
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
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
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
    fontWeight: "500",
  },
});

export default ChangeEmail;