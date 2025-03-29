import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { usePreferences } from "@/utils/PreferencesContext";
import Colors from "@/constants/colors";
import { FontAwesome5 } from "@expo/vector-icons";

export default function GroceryInputScreen() {
  const { completeOnboarding } = usePreferences();
  const router = useRouter();

  const handleComplete = (nextScreen: string) => {
    // Mark onboarding as complete first
    completeOnboarding();

    // Wait a moment to ensure the state update is processed
    setTimeout(() => {
      // Navigate to the selected screen
      try {
        if (nextScreen === "photo") {
          // Navigate to home screen since we'll redirect to add-item from there
          router.replace("/(tabs)");
        } else if (nextScreen === "manual") {
          // Navigate to home screen since we'll redirect to add-item from there
          router.replace("/(tabs)");
        } else {
          // Navigate to home screen since we'll redirect to shopping-list from there
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback - just go to the home screen
        router.replace("/(tabs)");
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Your Groceries</Text>
        <Text style={styles.subtitle}>
          Let's capture what you already have to reduce food waste
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>
          How would you like to add your groceries?
        </Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleComplete("photo")}
        >
          <View style={styles.optionIconContainer}>
            <FontAwesome5 name="camera" size={36} color={Colors.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Take a Photo</Text>
            <Text style={styles.optionDescription}>
              Our AI will identify your groceries from a picture
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleComplete("manual")}
        >
          <View style={styles.optionIconContainer}>
            <FontAwesome5 name="list" size={36} color={Colors.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Manual Entry</Text>
            <Text style={styles.optionDescription}>
              Add your groceries manually one by one
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleComplete("create-list")}
        >
          <View style={styles.optionIconContainer}>
            <FontAwesome5
              name="shopping-cart"
              size={36}
              color={Colors.primary}
            />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              I don't have groceries, help me make a list
            </Text>
            <Text style={styles.optionDescription}>
              We'll help you create a shopping list based on recipes you like
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: "#4CAF50", // Green background for header
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 16,
  },
  optionsContainer: {
    flex: 1,
    padding: 24,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 24,
    textAlign: "center",
  },
  optionCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
