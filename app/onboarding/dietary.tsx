import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { usePreferences, DietaryPreference } from "@/utils/PreferencesContext";
import Colors from "@/constants/colors";
import { FontAwesome } from "@expo/vector-icons";

// Define our new option structure
type DietOption = {
  id: string;
  label: string;
  description: string;
  preferences: DietaryPreference[];
};

// Revised diet options with three main categories
const dietOptions: DietOption[] = [
  {
    id: "vegetarian-option",
    label: "Vegetarian",
    description: "No meat, but may include dairy and eggs",
    preferences: ["vegetarian" as DietaryPreference],
  },
  {
    id: "vegan-option",
    label: "Vegan",
    description: "No animal products whatsoever",
    preferences: ["vegan" as DietaryPreference],
  },
  {
    id: "non-vegetarian-option",
    label: "Non-Vegetarian",
    description:
      "Includes breakfast, pasta, desserts, seafood, sides, and starters",
    preferences: [
      "breakfast" as DietaryPreference,
      "seafood" as DietaryPreference,
      "side" as DietaryPreference,
      "starter" as DietaryPreference,
      "pasta" as DietaryPreference,
      "dessert" as DietaryPreference,
    ],
  },
];

export default function MealPreferencesScreen() {
  const { preferences, setDietaryPreferences } = usePreferences();
  const [selectedDiets, setSelectedDiets] = useState<DietaryPreference[]>(
    preferences.dietaryPreferences
  );
  // Track which of our UI options are selected
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const router = useRouter();

  // Initialize selected options based on user's existing preferences
  useEffect(() => {
    const newSelectedOptions: string[] = [];

    dietOptions.forEach((option) => {
      // Check if any of the option's preferences are in the user's selected diets
      const hasMatch = option.preferences.some((pref) =>
        selectedDiets.includes(pref)
      );

      if (hasMatch) {
        newSelectedOptions.push(option.id);
      }
    });

    setSelectedOptions(newSelectedOptions);
  }, []);

  const toggleOption = (optionId: string) => {
    // Find the option being toggled
    const option = dietOptions.find((opt) => opt.id === optionId);
    if (!option) return;

    // Toggle this option in our UI state
    setSelectedOptions((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      } else {
        return [...prev, optionId];
      }
    });

    // Update the actual diet preferences based on this option
    setSelectedDiets((prev) => {
      const newPrefs = [...prev];

      if (prev.some((p) => option.preferences.includes(p))) {
        // Remove all preferences associated with this option
        return newPrefs.filter((p) => !option.preferences.includes(p));
      } else {
        // Add all preferences associated with this option
        option.preferences.forEach((pref) => {
          if (!newPrefs.includes(pref)) {
            newPrefs.push(pref);
          }
        });
        return newPrefs;
      }
    });
  };

  const handleNext = () => {
    setDietaryPreferences(selectedDiets);
    router.push("/onboarding/cuisine");
  };

  const handleSkip = () => {
    router.push("/onboarding/cuisine");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Preferences</Text>
        <Text style={styles.subtitle}>
          Select your dietary preferences to customize your recipe
          recommendations
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.optionsContainer}>
        {dietOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedOptions.includes(option.id) && styles.selectedCard,
            ]}
            onPress={() => toggleOption(option.id)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {selectedOptions.includes(option.id) && (
              <FontAwesome
                name="check-circle"
                size={24}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 16,
  },
  optionsContainer: {
    padding: 16,
  },
  optionCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: `${Colors.primary}10`,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 6,
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  skipButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
    alignItems: "center",
    marginLeft: 8,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
