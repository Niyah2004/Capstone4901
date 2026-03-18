import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useTheme } from "../theme/ThemeContext";

export default function GenericTaskLibrary({ navigation, onSelectTask }) {
    const { theme } = useTheme();
    const colors = theme.colors;
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
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                    <View style={[styles.outer, { backgroundColor: colors.background }]}>
                        <Text style={{ textAlign: "center", marginTop: 40, color: colors.muted }}>Loading...</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={[styles.outer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation?.goBack?.()}
                    >
                        <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={[styles.header, { color: colors.text }]}>Generic Task Library</Text>

                    <FlatList
                        data={genericTasks}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.container}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.taskCard, { backgroundColor: colors.card }]}
                                onPress={() => {
                                    if (typeof onSelectTask === "function") {
                                        onSelectTask(item);
                                    }
                                }}
                            >
                                <Text style={[styles.title, { color: colors.text }]}>{item.title || "Unknown Task"}</Text>
                                <Text style={[styles.desc, { color: colors.muted }]}>{item.description || ""}</Text>
                                {item.points !== undefined && item.points !== null && (
                                    <Text style={[styles.points, { color: colors.primary }]}>{String(item.points)} pts</Text>
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={{ textAlign: "center", color: colors.muted }}>
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
    },
    taskCard: {
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: "600" },
    desc: { fontSize: 14, marginTop: 4 },
    points: { fontWeight: "600", marginTop: 6 },
    backButton: {
        alignSelf: "flex-start",
        marginLeft: 20,
        marginTop: 15,
        marginBottom: 10,
    },
    backText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});
