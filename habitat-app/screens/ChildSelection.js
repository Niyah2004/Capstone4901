import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useTheme } from "../theme/ThemeContext";

export default function ChildSelectScreen({ navigation }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [children, setChildren] = useState([]);

useEffect(() => {
  if (!userId) {
    console.log("ChildSelect: userId is null (not logged in yet)");
    return;
  }

  console.log("ChildSelect: querying children for userId:", userId);

  const q = query(collection(db, "children"), where("userId", "==", userId));

  const unsub = onSnapshot(
    q,
    (snap) => {
      console.log("ChildSelect: docs found:", snap.size);
      setChildren(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.log("ChildSelect snapshot error:", err);
    }
  );

  return unsub;
}, [userId]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Text style={[styles.title, { color: colors.text }]}>Who's Playing?</Text>
      <Text style={[{ marginBottom: 10, color: colors.muted }]}>
        Logged in as: {userId || "NO USER"}
      </Text>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <Text style={{ color: colors.muted }}>
            No children found. If you definitely created one, the child docs may not have `userId`
            matching this account, or Firestore rules are blocking reads.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.name, { color: colors.text }]}>{item.preferredName || item.fullName}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.replace("ChildTabs", { childId: item.id })}>
                <Text style={styles.btnText}>Open</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate("AvatarSelection", { childId: item.id })}
              >
                <Text style={styles.btnText}>Edit Avatar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  card: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  secondaryBtn: {
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  safe: {
    flex: 1,
    paddingTop: 16,
  },
});