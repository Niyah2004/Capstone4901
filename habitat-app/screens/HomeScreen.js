import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, Image} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from "../theme/ThemeContext";

export default function HomeScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const [progress] = useState(new Animated.Value(0));

    useEffect(() => {
        Animated.timing(progress, {
        toValue: 150,     //max value of progress bar
        duration: 2000,
        useNativeDriver: false
        }).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Top Section: Greeting and Progress Bar */}
            <View style={styles.topSection}>
                <Text style={[styles.title, { color: colors.text }]}>Hello Child's Name!</Text>
                <Text style={[styles.date, { color: colors.muted }]}>Today's Date</Text>
                <View style={styles.progressBarRow}>
                    <Icon name="star" style={{ color: "#ffea00", fontSize: 30 }} />
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                        <Animated.View
                            style={[
                                styles.progressBar, {
                                    width: progress.interpolate({
                                        inputRange: [0, 150],
                                        outputRange: ['0%', '100%']
                                    }),
                                },
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: colors.text }]}>150</Text>
                </View>
            </View>


            {/* Middle Section: Avatar */}
            <View style={styles.avatarContainer}>
                {/* Avatar Image */}
                <Image
                    source={require("../assets/images/panda.png")} //Avatar image path
                    style={styles.avatar}
                />
            </View>

            {/* Bottom Section: Milestone Celebrations/task view?*/}
            <View style={styles.bottomSection}>
                <Text style={[styles.subtitle, { color: colors.text }]}>Milestone Celebrations</Text>
                <View style={[styles.milestone, { borderColor: colors.border }]}>
                    <Ionicons name="trophy-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                    <View style={{ marginLeft: 2 }}>
                        <Text style={[styles.milestoneText, { color: colors.text }]}>First Task Completed!</Text>
                        <Text style={[styles.milestoneStatus, { backgroundColor: colors.successBg, color: colors.success }]}>Achieved</Text>
                    </View>
                </View>
                <View style={[styles.milestone, { borderColor: colors.border }]}>
                    <Ionicons name="star-outline" style={{ color: "#ffd700", fontSize: 30 }} />
                    <View style={{ marginLeft: 2 }}>
                        <Text style={[styles.milestoneText, { color: colors.text }]}>Collected 50 Stars!</Text>
                        <Text style={[styles.milestoneStatus, { backgroundColor: colors.successBg, color: colors.success }]}>Achieved</Text>
                    </View>
                </View>

            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    topSection: { marginTop: 20, alignItems: "center" },
    title: { fontSize: 24, fontWeight: "bold", marginTop: 5, textAlign: "center" },
    date: { fontSize: 10, textAlign: "center" },
    progressBarRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
    progressBarContainer: { height: 12, borderRadius: 5, overflow: "hidden", width: '80%', marginVertical: 10 },
    progressBar: { height: '100%', borderRadius: 5, backgroundColor: "#ffea00ff" },
    progressText: { fontSize: 12, marginLeft: 10 },
    avatarContainer: { alignItems: "center", marginVertical: 20 },
    avatar: { width: 300, height: 300, borderRadius: 10 },
    bottomSection: { flex: 1, justifyContent: "flex-start" },
    subtitle: { fontSize: 16, marginTop: 20, marginBottom: 10, textAlign: "left" },
    milestone: { flexDirection: "row", marginVertical: 5, borderWidth: .5, borderRadius: 8, padding: 10, alignItems: "center" },
    milestoneText: { marginLeft: 10, fontSize: 14 },
    milestoneStatus: { marginLeft: 10, fontSize: 10, paddingVertical: 1, paddingHorizontal: 10, borderRadius: 10, textAlign: "center", alignSelf: "flex-start" },
});