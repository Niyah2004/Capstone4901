import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import {signUp} from "../auth";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';

export default function SignUpScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleSignUp = async () => {
    if(!email || !password || !confirmPassword) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    //basic password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(!passwordRegex.test(password)) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
      return;
    } 

      try{
        setLoading(true);
        const user = await signUp(email, password);
        console.log("User signed up:", user);
        Alert.alert("Success", "Account created! Please set up your child's profile.");
        navigation.navigate("ChildProfileSetup");
      } catch (error) {
        console.error("Error signing up:", error);
        Alert.alert("Sign Up Failed", "Please try again later.");
      } finally {
        setLoading(false);
      }
  };
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Hey Family!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Create your account to start building healthy habits with Habitat.
        </Text>

        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Enter your email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder="Create your password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showPassword}
            value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
       <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder="Confirm your password"
            placeholderTextColor={colors.muted}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={22}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.requirements, { color: colors.muted }]}>• At least 8 characters</Text>
        <Text style={[styles.requirements, { color: colors.muted }]}>• At least one uppercase letter</Text>
        <Text style={[styles.requirements, { color: colors.muted }]}>• At least one lowercase letter</Text>
        <Text style={[styles.requirements, { color: colors.muted }]}>• At least one number</Text>
        <Text style={[styles.requirements, { color: colors.muted }]}>• At least one special character</Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
          <Text style={[styles.loginText, { color: colors.primary }]}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  form: { marginVertical: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  requirements: { fontSize: 12, marginLeft: 8 },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { textAlign: "center" },
});