import React, { useState } from "react";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { signIn } from "../auth";
import { useTheme } from "../theme/ThemeContext";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Information", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const user = await signIn(email.trim(), password);
      if (user) {
        Alert.alert("Welcome Back!", "You have successfully logged in.");
        navigation.navigate("ChildTabs"); // change if needed
      }
    } catch (error) {
      console.error("Login error:", error.message);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Log in to continue building healthy habits with Habitat.
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
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Enter your password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
        >
        <Text style={[styles.forgotText, { color: colors.primary }]}>
          Forgot Password?
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={[styles.loginText, { color: colors.primary }]}>Don’t have an account? Sign Up</Text>
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
  form: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginText: {
    textAlign: "center",
    fontWeight: "500",
  },

  forgotText: {
  textAlign: "center",
  marginBottom: 10,
  fontWeight: "500",
},

});
