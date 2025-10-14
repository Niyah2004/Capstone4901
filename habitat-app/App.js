import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";

import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import RewardCreationScreen from "./screens/RewardCreationScreen";
import ParentSignupScreen from "./screens/ParentSignupScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ParentSignup" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="RewardCreation" component={RewardCreationScreen} />
        <Stack.Screen name="ParentSignup" component={ParentSignupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the main component
registerRootComponent(App);

export default App;
