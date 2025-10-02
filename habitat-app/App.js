import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";

import SignUpScreen from "./screens/SignUpScreen";
import ChildProfileSetupScreen from "./screens/ChildProfileSetupScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ChildProfileSetup" component={ChildProfileSetupScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register the main component
registerRootComponent(App);

export default App;
