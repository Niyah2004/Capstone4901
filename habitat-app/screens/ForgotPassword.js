// screens/ForgotPassword.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

const ForgotPassword = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Info", "Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();

      await sendPasswordResetEmail(auth, email.trim());

      setLoading(false);
      Alert.alert(
        "Email Sent",
        "A password reset link has been sent to your email.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error("Error resetting password:", err);
      setLoading(false);

      let message = "Something went wrong. Please try again.";

      if (err.code === "auth/user-not-found") {
        message = "No account found with this email.";
      }

      Alert.alert("Reset Failed", message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Reset Password</Text>

      <Text style={[styles.label, { color: colors.text }]}>Email</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Reset Email"}
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

export default ForgotPassword;

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
    width : "100%",
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
