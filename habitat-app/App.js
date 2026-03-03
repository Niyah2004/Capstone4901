import React, { useEffect, useState } from "react";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import GenericTaskLibrary from "./screens/GenericTaskLibrary";

import { ParentLockProvider, useParentLock } from "./ParentLockContext";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import ForgotPassword from "./screens/ForgotPassword";


const Stack = createNativeStackNavigator();
const ParentStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


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
      <ParentStack.Screen
        name="GenericTaskLibrary"
        component={GenericTaskLibrary}
      />
      <ParentStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
      />
    </ParentStack.Navigator>
  );
}


function ChildTabs() {
  const { lockParent } = useParentLock();
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
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

function AppNavigator() {
  const [orientation, setOrientation] = useState();
  const { theme } = useTheme();
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    const getOrientation = async () => {
      const current = await ScreenOrientation.getOrientationAsync();
      setOrientation(current);
    };
    getOrientation();
  }, []);

  useEffect(() => {
    let unsubAuth = () => { };
    let receivedSub = null;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoPushToken(token);

      unsubAuth = onAuthStateChanged(getAuth(), async (user) => {
        if (!user || !token) return;
        try {
          const tokenRef = doc(db, 'userPushTokens', user.uid);
          await setDoc(
            tokenRef,
            {
              expoPushToken: token,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error('Error saving expoPushToken:', e);
        }
      });

      receivedSub = Notifications.addNotificationReceivedListener((incoming) => {
        setNotification(incoming);
      });
    })();

    return () => {
      try { if (typeof unsubAuth === 'function') unsubAuth(); } catch { }
      try { receivedSub?.remove?.(); } catch { }
    };
  }, []);

  return (
    <ParentLockProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
          <Stack.Screen name="AvatarSelection" component={AvatarSelection} />
          <Stack.Screen name="ChildHome" component={ChildHome} />
          <Stack.Screen name="ChildTabs" component={ChildTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </ParentLockProvider>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }
  return token;
}


export default function AppWithProviders() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(AppWithProviders);
