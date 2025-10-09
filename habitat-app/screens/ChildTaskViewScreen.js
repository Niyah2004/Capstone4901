import React, { useState } from "react";
import Calendar from "react-calendar";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";

export default function ChildTaskViewScreen({ route, navigation }) {
    const { task, onUpdateTask } = route.params;
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [isCompleted, setIsCompleted] = useState(task.isCompleted);

    // Removed unused Calendar function
    <View style={styles.form}>
        <Text style={styles.title}>Today's Task</Text>



    </View>


}


const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    form: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        color: "#333",
    },
});
