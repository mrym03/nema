import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator, Text } from "react-native";
import Colors from "@/constants/colors";

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    // Use a timeout to ensure the layout is fully mounted before navigating
    const timer = setTimeout(() => {
      // Navigate to the first onboarding screen (using push instead of replace)
      router.push("/onboarding/dietary");
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Show a loading indicator while redirecting
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 16, fontSize: 16, color: Colors.textLight }}>
        Setting up your meal preferences...
      </Text>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}
