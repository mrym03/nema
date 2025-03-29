import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { AuthProvider, useAuth } from "@/utils/AuthContext";
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
      console.log('Supabase connection test:', connected ? 'success' : 'failed');
    };
    
    testConnection();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // If not loading and no user is authenticated, redirect to auth screen
      router.replace('/auth');
    }
  }, [user, loading, router]);

  // Show a loading indicator while checking auth status
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="add-item" options={{ title: "Add Item" }} />
      <Stack.Screen name="edit-item" options={{ title: "Edit Item" }} />
      <Stack.Screen name="item-details" options={{ title: "Item Details" }} />
      <Stack.Screen name="recipe-details" options={{ title: "Recipe Details" }} />
    </Stack>
  );
}
