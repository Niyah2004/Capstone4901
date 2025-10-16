import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Hey Family!</Text>
        <Text style={styles.subtitle}>
          Create your account to start building healthy habits with Habitat.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Create your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.requirements}>• At least 8 characters</Text>
        <Text style={styles.requirements}>• At least one uppercase letter</Text>
        <Text style={styles.requirements}>• At least one lowercase letter</Text>
        <Text style={styles.requirements}>• At least one number</Text>
        <Text style={styles.requirements}>• At least one special character</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("ChildProfileSetup")}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => alert("Log In flow placeholder")}>
          <Text style={styles.loginText}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
  form: { marginVertical: 20 },
  title: { fontFamily: "", fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
  requirements: { fontSize: 12, color: "#555", marginLeft: 8 },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loginText: { textAlign: "center", color: "#4CAF50" },
});
