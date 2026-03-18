// Comfort page for parents to create and manage rewards for their children
import { collection, addDoc, updateDoc, getDoc, doc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import React, { useEffect, useState } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { arrayRemove } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";


export default function ParentReward({navigation}) {
  const { theme } = useTheme();
  const colors = theme.colors;
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
                  await saveRewardToFirestore(null);
                }
              }
            ]
          );
          return;
        }
      }

      await saveRewardToFirestore(imageURL);
    } catch (error) {
      console.error("Error saving reward:", error);
      Alert.alert("Error", "Could not save reward. Please try again.");
    }
  };

  const saveRewardToFirestore = async (imageURL) => {
    await addDoc(collection(db, "rewards"), {
      parentId: auth.currentUser.uid,
      name: rewardName,
      description: description,
      points: parseInt(points),
      frequency: frequency,
      image: imageURL,
      createdAt: new Date(),
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
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.header, { color: colors.text }]}>Create Reward</Text>

      <View style={[styles.formWrapper, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text }]}>Reward Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Movie Night, New Toy"
          placeholderTextColor={colors.muted}
          value={rewardName}
          onChangeText={setRewardName}
        />

        <Text style={[styles.label, { color: colors.text }]}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder="Briefly describe what the reward is about."
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: colors.text }]}>Points Required</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder="10"
          placeholderTextColor={colors.muted}
          value={points}
          onChangeText={setPoints}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.text }]}>Reward Frequency</Text>
        <View style={styles.frequencyContainer}>
          {["One-Time", "Daily", "Weekly", "Monthly", "Milestone"].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.freqButton,
                { borderColor: colors.primary },
                frequency === freq && { backgroundColor: colors.primary },
              ]}
              onPress={() => setFrequency(freq)}
            >
              <Text style={[
                styles.freqText,
                { color: frequency === freq ? "#fff" : colors.primary },
              ]}>
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.addImageButton, { backgroundColor: colors.primary }]} onPress={pickImage}>
          <Text style={styles.addImageButtonText}>Add Image</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={saveReward}>
          <Text style={styles.saveButtonText}>Save Reward</Text>
        </TouchableOpacity>

        {rewards.length > 0 && (
          <View style={styles.existingRewardsSection}>
            <Text style={[styles.existingRewardsTitle, { color: colors.text }]}>Available Rewards 🎁 (visible to your child)</Text>
            {rewards.map((reward) => (
              <View key={reward.id} style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.rewardCardLeft}>
                  <Text style={styles.rewardCardEmoji}>🎁</Text>
                  <View style={styles.rewardCardInfo}>
                    <Text style={[styles.rewardCardName, { color: colors.text }]}>{reward.name || "Untitled Reward"}</Text>
                    <View style={styles.rewardCardBadges}>
                      <View style={[styles.pointsBadge, { backgroundColor: colors.starsBanner }]}>
                        <Text style={[styles.pointsBadgeText, { color: colors.starsBannerText }]}>⭐ {reward.points ?? 0} pts</Text>
                      </View>
                      <View style={[styles.freqBadge, { backgroundColor: colors.inputBg }]}>
                        <Text style={[styles.freqBadgeText, { color: colors.muted }]}>{reward.frequency || "One-Time"}</Text>
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
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  formWrapper: {
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
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
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  freqText: {
    fontWeight: "bold",
  },
  saveButton: {
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
    fontWeight: "bold",
  },
  addImageButton: {
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
    marginBottom: 10,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
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
    marginBottom: 5,
  },
  rewardCardBadges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  pointsBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  freqBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freqBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 6,
    marginLeft: 8,
  },
  deleteText: {
    fontSize: 20,
  },
});
