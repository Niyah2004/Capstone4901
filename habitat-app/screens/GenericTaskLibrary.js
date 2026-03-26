import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function GenericTaskLibrary({ navigation, onSelectTask }) {
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

    if (loading) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                    <View style={styles.outer}>
                        <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                <View style={styles.outer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation?.goBack?.()}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.header}>Generic Task Library</Text>

                    <FlatList
                        data={genericTasks}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.container}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.taskCard}
                                onPress={() => {
                                    if (typeof onSelectTask === "function") {
                                        onSelectTask(item);
                                    }
                                }}
                            >
                                <Text style={styles.title}>{item.title || "Unknown Task"}</Text>
                                <Text style={styles.desc}>{item.description || ""}</Text>
                                {item.points !== undefined && item.points !== null && (
                                    <Text style={styles.points}>{String(item.points)} pts</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={{ textAlign: "center", color: "#888" }}>
                                No generic tasks yet.
                            </Text>
                        }
                    />
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    outer: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        padding: 20,
        paddingTop: 0,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#333",
    },
    /*header: { fontSize: 22, fontWeight: "600", textAlign: "center", marginVertical: 10 },*/
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
    backButton: {
        alignSelf: "flex-start",
        marginLeft: 20,
        marginTop: 15,
        marginBottom: 10,
    },
    backText: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "bold",
    },
});
