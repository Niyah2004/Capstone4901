import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";
//import { createbottomTabNavigator }from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // for icons

// import any screens here so they can be used in the navigator try to keep in order of user flow
import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import ParentDashBoard from "./screens/ParentDashBoard";
import ParentTaskPage from "./screens/ParentTaskPage";
import ParentPinScreen from "./screens/parentPinScreen";
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
// 👇 This nested stack controls Parent icon flow
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
