/*import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";
import { createbottomTabNavigator }from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // for icons

// import any screens here so they can be used in the navigator try to keep in order of user flow
import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/childProfileSetupScreen";
import AvatarSelection from "./screens/AvatarSelection";
import ChildHome from "./screens/ChildHome";
import childTask from "./screens/childTask";
import ChildReward from "./screens/ChildReward";
import ParentPinScreen from "./screens/parentPinScreen";
import ParentDashBoard from "./screens/parentDashBoard";
import ParentTaskPage from "./screens/parentTaskPage";
import parentReviewTask from "./screens/parentReviewTask";
import parentReward from "./screens/parentReward";



//const Stack = createNativeStackNavigator();
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="ParentDashBoard" component={ParentDashBoard} />
        <Stack.Screen name="ParentPinScreen" component={ParentPinScreen} />
        <Stack.Screen name="ParentTaskPage" component={ParentTaskPage} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the main component
registerRootComponent(App);

export default App;
// stack to control parent icon flow 
//  This nested stack controls Parent icon flow
function ParentStackScreen() {
  return (
    <ParentStack.Navigator screenOptions={{ headerShown: false }}>
      <ParentStack.Screen name="ParentPinScreen" component={ParentPinScreen} />
      <ParentStack.Screen name="ParentDashBoard" component={ParentDashBoard} />
    </ParentStack.Navigator>
  );
}

// for tabs navigation in bottom
//const Tab = createBottomTabNavigator();
// add the neccessary code for the bottom tab navigation here
*/

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { registerRootComponent } from "expo";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react"
import * as ScreenOrientation from "expo-screen-orientation"


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
import parentTaskPage from "./screens/ParentTaskPage";
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
      <ParentStack.Screen name="parentTaskPage" component={parentTaskPage} />
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
export default function App() {
  const { orientation, setOrientation } = useState();

  useEffect(() => {
    const getOrientation = async () => {
      const current = await ScreenOrientation.get
    }
  }, [])

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ChildTabs" screenOptions={{ headerShown: false }}>
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
