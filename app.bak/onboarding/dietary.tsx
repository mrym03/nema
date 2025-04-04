import React, { useState } from "react";
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

type DietOption = {
  id: DietaryPreference;
  label: string;
  description: string;
};

const dietOptions: DietOption[] = [
  {
    id: "vegetarian",
    label: "Vegetarian",
    description: "No meat, but may include dairy and eggs",
  },
  {
    id: "vegan",
    label: "Vegan",
    description: "No animal products whatsoever",
  },
  {
    id: "breakfast",
    label: "Breakfast",
    description: "Morning meals and breakfast foods",
  },
  {
    id: "dessert",
    label: "Desserts",
    description: "Sweet treats and dessert recipes",
  },
  {
    id: "pasta",
    label: "Pasta",
    description: "Pasta dishes and noodle-based recipes",
  },
  {
    id: "seafood",
    label: "Seafood",
    description: "Fish and seafood dishes",
  },
  {
    id: "side",
    label: "Side Dishes",
    description: "Accompaniments and side dishes",
  },
  {
    id: "starter",
    label: "Starters",
    description: "Appetizers and first courses",
  },
];

export default function MealPreferencesScreen() {
  const { preferences, setDietaryPreferences } = usePreferences();
  const [selectedDiets, setSelectedDiets] = useState<DietaryPreference[]>(
    preferences.dietaryPreferences
  );
  const router = useRouter();

  const toggleDiet = (diet: DietaryPreference) => {
    setSelectedDiets((prev) => {
      if (prev.includes(diet)) {
        return prev.filter((d) => d !== diet);
      } else {
        return [...prev, diet];
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
          Select dietary preferences and meal types to customize your recipe
          recommendations
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.optionsContainer}>
        {dietOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedDiets.includes(option.id) && styles.selectedCard,
            ]}
            onPress={() => toggleDiet(option.id)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {selectedDiets.includes(option.id) && (
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: Colors.text,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.textLight,
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
