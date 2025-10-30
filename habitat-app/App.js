
 
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { registerRootComponent } from "expo";
import { Ionicons } from "@expo/vector-icons";


// --- Screen Imports ---
import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import LoginScreen from "./screens/LoginScreen";
import AvatarSelection from "./screens/AvatarSelection";  
import ChildHome from "./screens/ChildHome";
import childTask from "./screens/childTask";
import ChildReward from "./screens/ChildReward";
import parentPinScreen from "./screens/parentPinScreen";
import parentDashBoard from "./screens/ParentDashBoard";
import ParentTaskPage from "./screens/ParentTaskPage";
import parentReviewTask from "./screens/parentReviewTask";
import parentReward from "./screens/parentReward";
import AccountSetting from "./screens/AccountSetting";

// --- Navigator Setup ---
const Stack = createNativeStackNavigator();
const ParentStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Parent stack flow (locked behind PIN)
 */
function ParentStackScreen() {
  return (
    <ParentStack.Navigator screenOptions={{ headerShown: false }}>
      <ParentStack.Screen name="parentPinScreen" component={parentPinScreen} />
      <ParentStack.Screen name="parentDashBoard" component={parentDashBoard} />
      <ParentStack.Screen name="ParentTaskPage" component={ParentTaskPage} />
      <ParentStack.Screen name="parentReviewTask" component={parentReviewTask} />
      <ParentStack.Screen name="parentReward" component={parentReward} />
      <ParentStack.Screen name="AccountSetting" component={AccountSetting} />
    </ParentStack.Navigator>
  );
}

/**
 * Child tab navigation — includes link to parent flow as last tab 
 */
function ChildTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: "#fff5f5ff" },
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#999",
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home-outline";
              break;
            case "Tasks":
              iconName = "list-outline";
              break;
            case "Rewards":
              iconName = "gift-outline";
              break;
            case "Parent":
              iconName = "lock-closed-outline";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={ChildHome} />
      <Tab.Screen name="Tasks" component={childTask} />
      <Tab.Screen name="Rewards" component={ChildReward} />
      <Tab.Screen
        name="Parent"
        component={ParentStackScreen}
        
      />
    </Tab.Navigator>
  );
}

/**
 * Main app navigation stack
 */
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="AvatarSelection" component={AvatarSelection} />
        <Stack.Screen name="ChildHome" component={ChildHome} />
        <Stack.Screen name="ChildTabs" component={ChildTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);
export default App;
