import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { useNavigation } from "@react-navigation/native";

export default function ChildReward() {
    const navigation = useNavigation(); 
    return (
        <View style={styles.container}>
          <Text style={styles.text}>This is the child reward screen (placeholder)</Text>
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