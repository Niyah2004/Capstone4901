import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { registerRootComponent } from "expo";

// Screens
import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import RewardCreationScreen from "./screens/RewardCreationScreen";
import ParentSignupScreen from "./screens/ParentSignupScreen";
import ReviewTasksScreen from "./screens/ReviewTasksScreen";

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Tasks") iconName = "list-outline";
          else if (route.name === "Rewards") iconName = "gift-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      })}
    >
      <Tab.Screen name="Home" component={ParentSignupScreen} />
      <Tab.Screen name="Tasks" component={ReviewTasksScreen} />
      <Tab.Screen name="Rewards" component={RewardCreationScreen} />
      <Tab.Screen name="Profile" component={ChildProfileSetupScreen} />
    </Tab.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ParentSignup" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ParentSignup" component={ParentSignupScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="RewardCreation" component={RewardCreationScreen} />
        <Stack.Screen name="ReviewTasks" component={ReviewTasksScreen} />
        {/* This replaces your old main navigation area */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);
export default App;