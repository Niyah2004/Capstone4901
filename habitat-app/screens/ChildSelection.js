import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ChildSelectScreen({ navigation }) {
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>Who's Playing?</Text>
<Text style={{ marginBottom: 10, opacity: 0.6 }}>
  Logged in as: {userId || "NO USER"}
</Text>

<FlatList
  data={children}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={
    <Text style={{ opacity: 0.7 }}>
      No children found. If you definitely created one, the child docs may not have `userId`
      matching this account, or Firestore rules are blocking reads.
    </Text>
  }
  renderItem={({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.preferredName || item.fullName}</Text>

      <View style={styles.row}>
        <TouchableOpacity
        style={styles.primaryBtn}
         onPress={() => navigation.replace("ChildTabs", { childId: item.id })}>
       <Text style={styles.btnText}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
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
  container: {
     flex: 1, 
     padding: 20, 
     backgroundColor: "#fff" 
    },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 14 
  },
  card: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  name: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 10 
  },
  row: { 
    flexDirection: "row", 
    gap: 10 
  },
  primaryBtn: { 
    backgroundColor: "#4CAF50", 
    padding: 12, 
    borderRadius: 10, 
    flex: 1, 
    alignItems: "center" 
  },
  secondaryBtn: { 
    backgroundColor: "#2D8CFF", 
    padding: 12, 
    borderRadius: 10, 
    flex: 1, 
    alignItems: "center" 
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  safe: {
    flex: 1,
    backgroundColor: "#fff" 
  },
});