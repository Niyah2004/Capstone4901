// App.js
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
import ParentPinScreen from "./screens/parentPinScreen";      // 👈 use same case as file
import ParentDashBoard from "./screens/ParentDashBoard";
import ParentTaskPage from "./screens/ParentTaskPage";
import ParentReviewTask from "./screens/parentReviewTask";
import ParentReward from "./screens/parentReward";
import AccountSetting from "./screens/AccountSetting";

import { ParentLockProvider, useParentLock } from "./ParentLockContext";

// --- Navigator Setup ---
const RootStack = createNativeStackNavigator();
const ParentStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Parent stack: THIS is where ParentPinScreen and ParentDashBoard live.
 */
function ParentStackScreen() {
  return (
    <ParentStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="parentPinScreen"              // 👈 must match the screen name below
    >
      <ParentStack.Screen
        name="parentPinScreen"
        component={ParentPinScreen}
      />
      <ParentStack.Screen
        name="ParentDashBoard"                        // 👈 EXACT name used in navigation.replace
        component={ParentDashBoard}
      />
      <ParentStack.Screen
        name="ParentTaskPage"
        component={ParentTaskPage}
      />
      <ParentStack.Screen
        name="parentReviewTask"
        component={ParentReviewTask}
      />
      <ParentStack.Screen
        name="parentReward"
        component={ParentReward}
      />
      <ParentStack.Screen
        name="AccountSetting"
        component={AccountSetting}
      />
    </ParentStack.Navigator>
  );
}

/**
 * Child tab navigation — Parent tab holds the ParentStack
 */
function ChildTabs() {
  const { lockParent } = useParentLock();

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
        listeners={{
          blur: () => {
            // whenever you leave the Parent tab, lock it
            lockParent();
          },
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root stack – NO parent screens here.
 */
function RootNavigator() {
  return (
    <RootStack.Navigator
      initialRouteName="SignUp"
      screenOptions={{ headerShown: false }}
    >
      <RootStack.Screen name="LoginScreen" component={LoginScreen} />
      <RootStack.Screen name="SignUp" component={SignUpScreen} />
      <RootStack.Screen
        name="ChildProfileSetup"
        component={ChildProfileSetupScreen}
      />
      <RootStack.Screen name="AvatarSelection" component={AvatarSelection} />
      <RootStack.Screen name="ChildHome" component={ChildHome} />
      <RootStack.Screen name="ChildTabs" component={ChildTabs} />
    </RootStack.Navigator>
  );
}

function App() {
  return (
    <ParentLockProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ParentLockProvider>
  );
}

registerRootComponent(App);
export default App;
