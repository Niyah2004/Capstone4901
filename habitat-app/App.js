import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { registerRootComponent } from "expo";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";

// --- Screen Imports ---
import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import LoginScreen from "./screens/LoginScreen";
import AvatarSelection from "./screens/AvatarSelection";
import ChildHome from "./screens/ChildHome";
import childTask from "./screens/childTask";
import ChildReward from "./screens/ChildReward";
import ParentPinScreen from "./screens/parentPinScreen"; 
import ParentDashBoard from "./screens/ParentDashBoard";     
import ParentTaskPage from "./screens/ParentTaskPage";
import ParentReviewTask from "./screens/parentReviewTask";
import ParentReward from "./screens/parentReward";
import AccountSetting from "./screens/AccountSetting";
import ForgotPinScreen from "./screens/ForgotPin";
import ChangePassword from "./screens/ChangePassword";
import ChangeEmail from "./screens/ChangeEmail";
import ChangePin from "./screens/ChangePin";

import { ParentLockProvider, useParentLock } from "./ParentLockContext";


const Stack = createNativeStackNavigator();
const ParentStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function ParentStackScreen() {
  return (
    <ParentStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="parentPinScreen"             
    >
      <ParentStack.Screen
        name="parentPinScreen"
        component={ParentPinScreen}
      />
      <ParentStack.Screen
        name="ParentDashBoard"                        
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
      <ParentStack.Screen
        name="ForgotPin"
        component={ForgotPinScreen}
      />
      <ParentStack.Screen 
        name="ChangePassword" 
        component={ChangePassword} 
      />
      <ParentStack.Screen 
        name="ChangeEmail" 
        component={ChangeEmail} 
      />
      <ParentStack.Screen
        name="ChangePin" 
        component={ChangePin} 
      />
    </ParentStack.Navigator>
  );
}


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
      <Tab.Screen name="Parent" component={ParentStackScreen} 
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
 * Main app navigation stack
 */
export default function App() {
  const [orientation, setOrientation] = useState();

  useEffect(() => {
    const getOrientation = async () => {
      const current = await ScreenOrientation.getOrientationAsync();
      setOrientation(current);
    };
    getOrientation();
  }, []);

  return (
      <ParentLockProvider>
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
    </ParentLockProvider>
  );
}

registerRootComponent(App);
