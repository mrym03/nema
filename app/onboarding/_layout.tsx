import { Stack } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function OnboardingLayout() {
  // This ensures the layout is properly mounted before children attempt to use navigation
  useEffect(() => {
    // This effect helps ensure the layout is mounted
    console.log("Onboarding layout mounted");
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: "slide_from_right",
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="dietary" />
      <Stack.Screen name="cuisine" />
      <Stack.Screen name="meals" />
      <Stack.Screen name="groceries" />
    </Stack>
  );
}
