// Comfort page for parents to create and manage rewards for their children
import { collection, addDoc, updateDoc, getDoc, doc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { arrayRemove } from "firebase/firestore";


const REWARD_PRESETS = [
  { id: 'gift',       label: 'Gift',         image: require('../assets/Gifts.png') },
  { id: 'gamenight',  label: 'Game Night',   image: require('../assets/Gamenight.png') },
  { id: 'movie',      label: 'Movie Night',  image: require('../assets/Movienight.png') },
  { id: 'treat',      label: 'Sweet Treats', image: require('../assets/SweetTreats.png') },
  { id: 'outside',   label: 'Outside',      image: require('../assets/outside.png') },
];

export default function ParentReward({navigation}) {
  const auth = getAuth();
  const [rewardName, setRewardName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [frequency, setFrequency] = useState("One-Time");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setRewards([]);
      return;
    }

    const rewardsQuery = query(
      collection(db, "rewards"),
      where("parentId", "==", uid)
    );

    const unsubscribe = onSnapshot(
      rewardsQuery,
      (snap) => {
        const list = snap.docs.map((rewardDoc) => ({
          id: rewardDoc.id,
          ...rewardDoc.data(),
        }));
        setRewards(list);
      },
      (error) => {
        console.error("Error loading rewards:", error);
        setRewards([]);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  
  const saveReward = async () => {
    if (!rewardName || !points) {
      Alert.alert("Missing info", "Please fill in both Reward Name and Points.");
      return;
    }

    const parsedPoints = parseInt(points, 10);
    if (isNaN(parsedPoints) || parsedPoints <= 0) {
      Alert.alert("Invalid Points", "Points must be a number greater than 0.");
      return;
    }

    try {
      await saveRewardToFirestore(selectedPreset, parsedPoints);
    } catch (error) {
      console.error("Error saving reward:", error);
      Alert.alert("Error", "Could not save reward. Please try again.");
    }
  };

  const saveRewardToFirestore = async (imageURL, parsedPoints) => {
    await addDoc(collection(db, "rewards"), {
      parentId: auth.currentUser?.uid,
      name: rewardName,
      description: description,
      points: parsedPoints,
      frequency: frequency,
      image: imageURL,
      createdAt: serverTimestamp(),
    });

    Alert.alert("Success!", "Reward has been added.");
    setRewardName("");
    setDescription("");
    setPoints("");
    setSelectedPreset(null);
    navigation.goBack();
  };
  
  const removeReward = async (rewardId) => {
  try {
    await deleteDoc(doc(db, "rewards", rewardId));
    Alert.alert("Deleted", "Reward removed successfully.");
  } catch (error) {
    console.log("Error removing reward:", error);
    Alert.alert("Error", "Could not remove reward.");
  }
};

//confirm before deleting reward?
{/*}
const confirmRemoveReward = (rewardId) => {
  Alert.alert(
    "Remove Reward",
    "Are you sure you want to delete this reward?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeReward(rewardId) }
    ]
  );
};
*/}


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

    <Text style={styles.label}>Reward Icon</Text>
    <View style={styles.presetGrid}>
      {REWARD_PRESETS.map((preset) => (
        <TouchableOpacity
          key={preset.id}
          style={[styles.presetCard, selectedPreset === preset.id && styles.presetCardSelected]}
          onPress={() => setSelectedPreset(preset.id)}
        >
          <Image source={preset.image} style={styles.presetImage} resizeMode="contain" />
          <Text style={styles.presetLabel}>{preset.label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity style={styles.saveButton} onPress={saveReward}>
      <Text style={styles.saveButtonText}>Save Reward</Text>
    </TouchableOpacity>

    {rewards.length > 0 && (
      <View style={styles.existingRewardsSection}>
        <Text style={styles.existingRewardsTitle}>Available Rewards 🎁 (visible to your child)</Text>
        {rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardCardLeft}>
              {REWARD_PRESETS.find(p => p.id === reward.image)
                ? <Image source={REWARD_PRESETS.find(p => p.id === reward.image).image} style={styles.rewardCardIcon} resizeMode="contain" />
                : <Text style={styles.rewardCardEmoji}>🎁</Text>
              }
              <View style={styles.rewardCardInfo}>
                <Text style={styles.rewardCardName}>{reward.name || "Untitled Reward"}</Text>
                <View style={styles.rewardCardBadges}>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsBadgeText}>⭐ {reward.points ?? 0} pts</Text>
                  </View>
                  <View style={[styles.freqBadge,
                    reward.frequency === "One-Time" && { backgroundColor: "#FFE0E0" },
                    reward.frequency === "Daily" && { backgroundColor: "#E0F0FF" },
                    reward.frequency === "Weekly" && { backgroundColor: "#E8F5E9" },
                    reward.frequency === "Monthly" && { backgroundColor: "#FFF3E0" },
                    reward.frequency === "Milestone" && { backgroundColor: "#F3E5F5" },
                  ]}>
                    <Text style={styles.freqBadgeText}>{reward.frequency || "One-Time"}</Text>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => removeReward(reward.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )}




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
    fontSize: 24,
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
      padding: 10,
      marginBottom: 5,
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
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    textAlign: "center",
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
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },

  presetGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 20,
  marginTop: 4,
},
presetCard: {
  width: "48%",
  backgroundColor: "#fafafa",
  borderWidth: 2,
  borderColor: "#e0e0e0",
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: "center",
  marginBottom: 10,
},
presetCardSelected: {
  borderColor: "#4CAF50",
  backgroundColor: "#e8f5e9",
},
presetImage: {
  width: 56,
  height: 56,
  marginBottom: 4,
},
rewardCardIcon: {
  width: 40,
  height: 40,
  marginRight: 10,
},
presetLabel: {
  fontSize: 13,
  fontWeight: "600",
  color: "#333",
},
existingRewardsSection: {
  marginTop: 24,
},
existingRewardsTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#333",
  marginBottom: 10,
},
rewardCard: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#F9F9F9",
  borderRadius: 14,
  padding: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#ECECEC",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 1,
},
rewardCardLeft: {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
},
rewardCardEmoji: {
  fontSize: 28,
  marginRight: 10,
},
rewardCardInfo: {
  flex: 1,
},
rewardCardName: {
  fontSize: 14,
  fontWeight: "700",
  color: "#222",
  marginBottom: 5,
},
rewardCardBadges: {
  flexDirection: "row",
  gap: 6,
  flexWrap: "wrap",
},
pointsBadge: {
  backgroundColor: "#FFFDE7",
  borderRadius: 10,
  paddingHorizontal: 8,
  paddingVertical: 3,
},
pointsBadgeText: {
  fontSize: 11,
  fontWeight: "600",
  color: "#C19A00",
},
freqBadge: {
  backgroundColor: "#E8F5E9",
  borderRadius: 10,
  paddingHorizontal: 8,
  paddingVertical: 3,
},
freqBadgeText: {
  fontSize: 11,
  fontWeight: "600",
  color: "#555",
},
deleteButton: {
  padding: 6,
  marginLeft: 8,
},
deleteText: {
  fontSize: 20,
},
});
