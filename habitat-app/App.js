import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";

import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";
import SelectAvatarsScreen from "./screens/SelectAvatarsScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
        <Stack.Screen name="SelectAvatars" component={SelectAvatarsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the main component
registerRootComponent(App);

export default App;
