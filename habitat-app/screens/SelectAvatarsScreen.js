import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useTheme } from "../theme/ThemeContext";

// Map assetKey → local image require. Add more here as you add image files.
const AVATAR_IMAGES = {
  panda:   require("../assets/panda.png"),
  turtle:  require("../assets/turtle.png"),
  dino:    require("../assets/dino.png"),
  lion:    require("../assets/lion.png"),
  penguin: require("../assets/penguin.png"),
};

export default function SelectAvatarsScreen({ navigation }) {
  const auth = getAuth();
  const { theme } = useTheme();
  const colors = theme.colors;

  const [avatars, setAvatars] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setLoading(false); return; }

    try {
      // 1. Fetch avatars from Firestore, sort client-side to avoid index issues
      const avatarSnap = await getDocs(collection(db, "avatars"));
      const avatarList = avatarSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.order ?? 99) - Number(b.order ?? 99));
      setAvatars(avatarList);

      // 2. Fetch child's lifetime points
      const pointsSnap = await getDoc(doc(db, "childPoints", uid));
      const earned = pointsSnap.exists()
        ? (pointsSnap.data().totalPoints ?? pointsSnap.data().points ?? 0)
        : 0;
      setTotalPoints(earned);

      // 3. Fetch current avatar from children collection
      const childQuery = query(
        collection(db, "children"),
        where("userId", "==", uid)
      );
      const childSnap = await getDocs(childQuery);
      if (!childSnap.empty) {
        const current = childSnap.docs[0].data().avatar || "panda";
        setCurrentAvatar(current);
        setSelected(current);
      }
    } catch (e) {
      console.error("Error loading avatars:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleChoose = async () => {
    if (!selected) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      const childQuery = query(
        collection(db, "children"),
        where("userId", "==", uid)
      );
      const childSnap = await getDocs(childQuery);
      if (!childSnap.empty) {
        await updateDoc(childSnap.docs[0].ref, { avatar: selected });
      }
      Alert.alert("✨ Looking good!", "Your character has been updated!", [
        { text: "Let's go!", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error("Error saving avatar:", e);
      Alert.alert("Oops!", "Couldn't save your character. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // Find next locked avatar to show progress toward
  const nextLocked = avatars.find(
    (a) => (a.milestoneRequired ?? 0) > totalPoints
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Choose Your Character</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stars banner */}
        <View style={styles.starsBanner}>
          <Text style={styles.starsText}>⭐ {totalPoints} Stars Earned</Text>
        </View>

        {/* Next unlock progress */}
        {nextLocked && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>
              {nextLocked.emoji} Next unlock: <Text style={styles.progressBold}>{nextLocked.name}</Text>
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      (totalPoints / nextLocked.milestoneRequired) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {totalPoints} / {nextLocked.milestoneRequired} ⭐
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.gridContainer}>
          <View style={styles.grid}>
            {avatars.map((avatar) => {
              const isUnlocked = totalPoints >= (avatar.milestoneRequired ?? 0);
              const isSelected = selected === avatar.id;
              const hasImage = !!AVATAR_IMAGES[avatar.assetKey];

              return (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarCard,
                    { backgroundColor: colors.card },
                    isSelected && styles.avatarCardSelected,
                    !isUnlocked && styles.avatarCardLocked,
                  ]}
                  onPress={() => {
                    if (!isUnlocked) {
                      Alert.alert(
                        "🔒 Locked!",
                        `Earn ${avatar.milestoneRequired - totalPoints} more ⭐ to unlock ${avatar.name}!`,
                        [{ text: "Got it!", style: "default" }]
                      );
                      return;
                    }
                    setSelected(avatar.id);
                  }}
                  activeOpacity={isUnlocked ? 0.8 : 1}
                >
                  {/* Avatar image or emoji */}
                  <View style={styles.avatarImageWrapper}>
                    {hasImage ? (
                      <Image
                        source={AVATAR_IMAGES[avatar.assetKey]}
                        style={[
                          styles.avatarImage,
                          !isUnlocked && styles.avatarImageLocked,
                        ]}
                      />
                    ) : (
                      <View style={[styles.emojiCircle, !isUnlocked && styles.emojiCircleLocked]}>
                        <Text style={[styles.avatarEmoji, !isUnlocked && styles.avatarEmojiLocked]}>
                          {avatar.emoji || "🐾"}
                        </Text>
                      </View>
                    )}

                    {/* Lock overlay */}
                    {!isUnlocked && (
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={28} color="#fff" />
                        <Text style={styles.lockStars}>
                          {avatar.milestoneRequired} ⭐
                        </Text>
                      </View>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && isUnlocked && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={26} color="#4CAF50" />
                      </View>
                    )}
                  </View>

                  {/* Avatar name */}
                  <Text
                    style={[
                      styles.avatarName,
                      { color: colors.text },
                      !isUnlocked && styles.avatarNameLocked,
                      isSelected && styles.avatarNameSelected,
                    ]}
                  >
                    {avatar.name}
                  </Text>

                  {/* FREE or Stars required badge */}
                  <View
                    style={[
                      styles.badge,
                      (avatar.milestoneRequired ?? 0) === 0
                        ? styles.badgeFree
                        : isUnlocked
                        ? styles.badgeUnlocked
                        : styles.badgeLocked,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {(avatar.milestoneRequired ?? 0) === 0
                        ? "FREE"
                        : isUnlocked
                        ? "UNLOCKED ✓"
                        : `${avatar.milestoneRequired} ⭐`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Choose button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.chooseButton,
              (!selected || selected === currentAvatar) && styles.chooseButtonDisabled,
            ]}
            onPress={handleChoose}
            disabled={!selected || selected === currentAvatar || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.chooseButtonText}>
                {selected === currentAvatar ? "Current Character ✓" : "Choose This Character! 🎉"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 6,
  },
  backButton: {
    padding: 6,
  },
  header: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
  },
  starsBanner: {
    backgroundColor: "#FFF8E1",
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  starsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#C17F00",
  },
  progressCard: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  progressTitle: {
    fontSize: 13,
    color: "#388E3C",
    marginBottom: 6,
    fontWeight: "600",
  },
  progressBold: {
    fontWeight: "800",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#C8E6C9",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: "#388E3C",
    textAlign: "right",
    fontWeight: "600",
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  avatarCard: {
    width: "47%",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarCardSelected: {
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarCardLocked: {
    opacity: 0.85,
  },
  avatarImageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarImageLocked: {
    opacity: 0.25,
  },
  emojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  emojiCircleLocked: {
    opacity: 0.3,
  },
  avatarEmoji: {
    fontSize: 52,
  },
  avatarEmojiLocked: {
    opacity: 0.5,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockStars: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  checkBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 13,
  },
  avatarName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },
  avatarNameLocked: {
    color: "#999",
  },
  avatarNameSelected: {
    color: "#4CAF50",
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeFree: {
    backgroundColor: "#E8F5E9",
  },
  badgeUnlocked: {
    backgroundColor: "#E8F5E9",
  },
  badgeLocked: {
    backgroundColor: "#FFF3E0",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555",
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  chooseButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  chooseButtonDisabled: {
    backgroundColor: "#B0BEC5",
    shadowOpacity: 0,
    elevation: 0,
  },
  chooseButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
