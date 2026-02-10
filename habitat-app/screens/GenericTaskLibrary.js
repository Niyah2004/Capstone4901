import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function GenericTaskLibrary({ onSelectTask }) {
    const [genericTasks, setGenericTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchGenericTasks() {
            try {
                const snap = await getDocs(collection(db, "genericTasks"));
                setGenericTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Error loading generic tasks:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchGenericTasks();
    }, []);

    if (loading) return <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Generic Task Library</Text>
            <FlatList
                data={genericTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.taskCard} onPress={() => onSelectTask(item)}>
                        <Text style={styles.title}>{item["Task title"] || "Unknown Task"}</Text>
                        <Text style={styles.desc}>{item.description}</Text>
                        {item.points !== undefined && (
                            <Text style={styles.points}>{item.points} pts</Text>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={{ textAlign: "center", color: "#888" }}>No generic tasks yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    header: { fontSize: 22, fontWeight: "600", textAlign: "center", marginVertical: 10 },
    taskCard: {
        backgroundColor: "#f1f1f1",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: "600", color: "#222" },
    desc: { fontSize: 14, color: "#555", marginTop: 4 },
    points: { color: "#388E3C", fontWeight: "600", marginTop: 6 },
});
