import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { AuthProvider, useAuth } from "@/utils/AuthContext";
import {
  PreferencesProvider,
  usePreferences,
} from "@/utils/PreferencesContext";
import { validateSupabaseConnection } from "@/utils/supabase";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Test Supabase connection on app load
  useEffect(() => {
    const testConnection = async () => {
      const connected = await validateSupabaseConnection();
      console.log(
        "Supabase connection test:",
        connected ? "success" : "failed"
      );
    };

    testConnection();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreferencesProvider>
          <RootLayoutNav />
        </PreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const { preferences, loading: preferencesLoading } = usePreferences();
  const router = useRouter();
  const [isOnAuthScreen, setIsOnAuthScreen] = useState(false);
  const [isOnOnboardingScreen, setIsOnOnboardingScreen] = useState(false);

  // Check if currently on auth or onboarding screens
  useEffect(() => {
    // This is a workaround since router.pathname isn't directly accessible
    const currentPath = global.location?.pathname || "";
    setIsOnAuthScreen(currentPath === "/auth");
    setIsOnOnboardingScreen(currentPath.startsWith("/onboarding"));
  }, []);

  useEffect(() => {
    if (!authLoading && !preferencesLoading) {
      try {
        if (!user) {
          // If not authenticated, redirect to auth screen
          console.log("Not authenticated, redirecting to auth");
          router.replace("/auth");
        } else if (!preferences.completedOnboarding) {
          // If authenticated but hasn't completed onboarding, redirect to onboarding
          console.log(
            "Authenticated but needs onboarding, redirecting to onboarding"
          );
          // Adding a slight delay can help avoid race conditions in navigation
          setTimeout(() => {
            router.replace("/onboarding");
          }, 100);
        } else {
          // User is authenticated and has completed onboarding
          console.log("Authenticated and onboarded, ensuring on home screen");
          if (isOnAuthScreen || isOnOnboardingScreen) {
            router.replace("/(tabs)");
          }
        }
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  }, [
    user,
    authLoading,
    preferencesLoading,
    preferences.completedOnboarding,
    router,
    isOnAuthScreen,
    isOnOnboardingScreen,
  ]);

  // Show a loading indicator while checking auth status
  if (authLoading || preferencesLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="add-item" options={{ title: "Add Item" }} />
      <Stack.Screen name="edit-item" options={{ title: "Edit Item" }} />
      <Stack.Screen name="item-details" options={{ title: "Item Details" }} />
      <Stack.Screen
        name="recipe-details"
        options={{ title: "Recipe Details" }}
      />
    </Stack>
  );
}
