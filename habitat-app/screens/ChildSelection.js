import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from "react-native";
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { AVATARS } from "../data/avatars";
import { useSelectedChild } from "../SelectedChildContext";

export default function ChildSelectScreen({ navigation }) {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const { setSelectedChildId } = useSelectedChild();
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

  return () => unsub;
}, [userId]);

  return (
  <SafeAreaView style={styles.safe} edges={["top"]}>
    <View style={styles.container}>
      <Text style={styles.title}>Who's Playing?</Text>
{/*
<Text style={{ marginBottom: 10, opacity: 0.6 }}>
  Logged in as: {userId || "NO USER"}
</Text>
*/}
<FlatList
  data={children}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={
    <Text style={{ opacity: 0.7 }}>
      No children found. If you definitely created one, the child docs may not have `userId`
      matching this account, or Firestore rules are blocking reads.
    </Text>
  }
  renderItem={({ item }) => {
    const avatarKey =
              typeof item.avatar === "string"
                ? item.avatar
                : item.avatar?.base || "panda";

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Image
            source={AVATARS[avatarKey]?.base}
            style={styles.avatar}
            resizeMode="contain"
          />
          <Text style={styles.name}>
            {item.preferredName || item.fullName}
          </Text>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => {
              setSelectedChildId(item.id);
              navigation.replace("ChildTabs", { childId: item.id });
            }}
          >
            <Text style={styles.btnText}>Open</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.EditAvatarBtn}
            onPress={() => navigation.navigate("AvatarSelection", { childId: item.id })}
          >
            <Text style={styles.SecondbtnText}>Edit Avatar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }}
    />
    </View>
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
    marginBottom: 20,
    alignSelf: "center",
  },
  card: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  name: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 10,
    marginTop: 5,
  },
  row: { 
    flexDirection: "row", 
    gap: 10 
  },
  openBtn: { 
    backgroundColor: "#4CAF50", 
    padding: 12, 
    borderRadius: 10, 
    flex: 1, 
    alignItems: "center" 
  },
  EditAvatarBtn: { 
    backgroundColor: "#ffff", 
    padding: 12, 
    borderRadius: 10, 
    flex: 1, 
    alignItems: "center" 
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  SecondbtnText: { 
    color: "#4CAF50", 
    fontWeight: "700" 
  },
  safe: {
    flex: 1,
    backgroundColor: "#fff" 
  },
  avatar: {
    width: 75,
    height: 75,
    marginRight: 12,
  },
});