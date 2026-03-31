// Comfort page for parents to create and manage rewards for their children
import { collection, addDoc, updateDoc, getDoc, doc, deleteDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import React, { useEffect, useState } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { arrayRemove } from "firebase/firestore";


export default function ParentReward({navigation}) {
  const auth = getAuth();
  const [rewardName, setRewardName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [frequency, setFrequency] = useState("One-Time");
  const [rewardImage, setRewardImage] = useState (null);
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
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

  
  //adding the picture to the reward
const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1,1],
    quality: 0.7,
  });

  if (!result.canceled){
    setRewardImage(result.assets[0].uri);
  }
};

  //uploading image to the firebase
const uploadImageAsync = async (uri) => {
  //setUploading(true);

  const response = await fetch(uri);
  const blob = await response.blob();

  const filename = `rewardImages/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);

  await uploadBytes(storageRef, blob);
  //const downloadUrl = await getDownloadURL(storageRef);
  //setUploading(false);
  return await getDownloadURL(storageRef);

};
  
  const saveReward = async () => {
    if (!rewardName || !points) {
      Alert.alert("Missing info", "Please fill in both Reward Name and Points.");
      return;
    }

    const parsedPoints = parseInt(points);
    if (isNaN(parsedPoints) || parsedPoints <= 0) {
      Alert.alert("Invalid Points", "Points must be a number greater than 0.");
      return;
    }

    try {
      let imageURL = null;

      // Try to upload image, but don't block if it fails
      if (rewardImage) {
        try {
          imageURL = await uploadImageAsync(rewardImage);
        } catch (imageError) {
          console.warn("Image upload failed, saving reward without image:", imageError);
          Alert.alert(
            "Image Upload Failed",
            "The image couldn't be uploaded, but we'll save your reward without it. Continue?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Save Without Image",
                onPress: async () => {
                  await saveRewardToFirestore(null, parsedPoints);
                }
              }
            ]
          );
          return;
        }
      }

      await saveRewardToFirestore(imageURL, parsedPoints);
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
    setRewardImage(null);
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

<TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
    <Text style={styles.addImageButtonText}>Add Image</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.saveButton} onPress={saveReward}>
      <Text style={styles.saveButtonText}>Save Reward</Text>
    </TouchableOpacity>

    {rewards.length > 0 && (
      <View style={styles.existingRewardsSection}>
        <Text style={styles.existingRewardsTitle}>Available Rewards 🎁 (visible to your child)</Text>
        {rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardCardLeft}>
              <Text style={styles.rewardCardEmoji}>🎁</Text>
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



{rewardImage && (
  <View style={styles.imagePreviewContainer}>
    <Image
      source={{ uri: rewardImage }}
      style={styles.imagePreview}
    />
    <TouchableOpacity
      style={styles.removeImageButton}
      onPress={() => setRewardImage(null)}
    >
      <Text style={styles.removeImageText}>✕</Text>
    </TouchableOpacity>
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

  addImageButton: {
  backgroundColor: "#4CAF50",
  padding: 15,
  borderRadius: 10,
  alignItems: "center",
  marginTop: 10,
},
addImageButtonText: {
  color: "#fff",
  fontWeight: "bold",
},
imagePreviewContainer: {
  position: "relative",
  marginTop: 10,
  alignSelf: "center",
},
imagePreview: {
  width: 100,
  height: 100,
  borderRadius: 10,
},
removeImageButton: {
  position: "absolute",
  top: -8,
  right: -8,
  backgroundColor: "#FF4444",
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
},
removeImageText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
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
