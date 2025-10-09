import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export default function HomeScreen({ navigation }) {

const MyTabs = createBottomTabNavigator({
  screens: {
    Home: HomeScreen,
    Task: TaskScreen,
    Rewards: RewardsScreen,
    ParentDashboard: ParentDashboardScreen,
  },
});
return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Home Page</Text>
        <View>
            
        </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: "#fff", justifyContent: "center", padding: 20 },
    form: { marginVertical: 20 },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, color: "#2d2d2d", textAlign: "center" },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12 },
    tabBarLabelStyle: { fontSize: 16, fontFamily: 'Georgia', fontWeight: 300,
    },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 8, alignItems: "center", marginVertical: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});