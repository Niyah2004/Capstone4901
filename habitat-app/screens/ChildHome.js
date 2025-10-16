// this is the child home page import code here 
import React from "react";
//import { View, Text, StyleSheet } from "react-native";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
//import { Ionicons } from "@expo/vector-icons"; // for icons
import { useNavigation } from "@react-navigation/native";

export default function ChildHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the ChildHome screen (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
});