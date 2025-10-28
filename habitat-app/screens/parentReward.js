// Comfort page for parents to create and manage rewards for their children
import React, { useState } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function ParentReward({navigation}) {
  const [rewardName, setRewardName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [frequency, setFrequency] = useState("One-Time");

  const saveReward = () => {
    if (!rewardName || !points) {
      Alert.alert("Missing info", "Please fill in the Reward Name and Points Required.");
      return;
    }
    Alert.alert("Saved", `Reward "${rewardName}" created!`);
    navigation.goBack();
  };

  return (
    <ScrollView
  contentContainerStyle={styles.container}
  keyboardShouldPersistTaps="handled"
>

     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
     <Text style={styles.backText}>← Back</Text>
    </TouchableOpacity> 

      <Text style={styles.header}>Create Reward</Text>

      <View style={styles.formWrapper}>
    <Text style={styles.label}>Reward Name</Text>
    <TextInput
      style={styles.input}
      placeholder="e.g., Movie Night, New Toy"
      value={rewardName}
      onChangeText={setRewardName}
    />

    <Text style={styles.label}>Description</Text>
    <TextInput
      style={[styles.input, { height: 80 }]}
      placeholder="Briefly describe what the reward is about."
      value={description}
      onChangeText={setDescription}
      multiline
    />

    <Text style={styles.label}>Points Required</Text>
    <TextInput
      style={styles.input}
      placeholder="10"
      value={points}
      onChangeText={setPoints}
      keyboardType="numeric"
    />

    <Text style={styles.label}>Reward Frequency</Text>
    <View style={styles.frequencyContainer}>
      {["One-Time", "Daily", "Weekly", "Monthly", "Milestone"].map((freq) => (
        <TouchableOpacity
          key={freq}
          style={[
            styles.freqButton,
            frequency === freq && styles.freqButtonActive,
          ]}
          onPress={() => setFrequency(freq)}
        >
          <Text
            style={[
              styles.freqText,
              frequency === freq && styles.freqTextActive,
            ]}
          >
            {freq}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity style={styles.saveButton} onPress={saveReward}>
      <Text style={styles.saveButtonText}>Save Reward</Text>
    </TouchableOpacity>
  </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  formWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      padding: 14,
      marginBottom: 18,
      backgroundColor: "#fafafa",  
      shadowColor: "#000",            
      shadowOpacity: 0.08,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,                    
  },
  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  freqButton: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  freqButtonActive: {
    backgroundColor: "#4CAF50",
  },
  freqText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  freqTextActive: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: 20,
    marginTop: 40,
    marginBottom: 10,
  },
  backText: {
    fontSize: 18,
    color: "#4CAF50",
    fontWeight: "bold",
  },
});
