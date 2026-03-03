import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { getAuth } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function ChildSelectScreen({ navigation }) {
  const auth = getAuth();
  const parentUid = auth.currentUser?.uid;

  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (!parentUid) return;

    const q = query(collection(db, "children"), where("parentUid", "==", parentUid));
    const unsub = onSnapshot(q, (snap) => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [parentUid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who’s playing?</Text>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.preferredName || item.fullName}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate("ChildHome", { childId: item.id })}
              >
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 14 },
  card: { borderWidth: 1, borderColor: "#ddd", padding: 14, borderRadius: 12, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  primaryBtn: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
  secondaryBtn: { backgroundColor: "#2D8CFF", padding: 12, borderRadius: 10, flex: 1, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
});