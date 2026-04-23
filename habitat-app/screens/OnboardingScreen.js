import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Animated } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const SLIDES = [
    {
        id: "1",
        title: "Parent Dashboard",
        description: "Enter your secure Parent PIN anytime to access the lock-protected dashboard where you control everything.",
        icon: "lock-closed",
    },
    {
        id: "2",
        title: "Creating Tasks",
        description: "Set up daily chores, hygiene goals, or homework with positive star bounties your child can earn!",
        icon: "list",
    },
    {
        id: "3",
        title: "Claiming Rewards",
        description: "Kids save up stars to claim fun rewards! You'll be notified automatically to approve and give them out.",
        icon: "gift",
    },
    {
        id: "4",
        title: "Avatar Wardrobe",
        description: "Kids can also spend their earned stars to unlock new characters and dress them up, reinforcing positive habits.",
        icon: "shirt",
    },
];

export default function OnboardingScreen({ navigation }) {
    const { theme } = useTheme();
    const colors = theme.colors;
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            navigation.replace("ChildSelection");
        }
    };

    const renderItem = ({ item }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name={item.icon} size={100} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: colors.muted }]}>{item.description}</Text>
            </View>
        );
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={{ flex: 3 }}>
                    <Animated.FlatList
                        data={SLIDES}
                        renderItem={renderItem}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        keyExtractor={(item) => item.id}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: false }
                        )}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                        ref={slidesRef}
                    />
                </View>

                {/* Paginator */}
                <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 30 }}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: "clamp",
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: "clamp",
                        });

                        return (
                            <Animated.View
                                key={i.toString()}
                                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: colors.primary }]}
                            />
                        );
                    })}
                </View>

                {/* Next / Start Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={scrollToNext}>
                        <Text style={styles.buttonText}>
                            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 180,
        height: 180,
        borderRadius: 90,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 15,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 8,
    },
    footer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    button: {
        width: "100%",
        paddingVertical: 16,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
});
