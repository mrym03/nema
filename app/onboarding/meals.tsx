import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { usePreferences } from "@/utils/PreferencesContext";
import Colors from "@/constants/colors";
import { FontAwesome } from "@expo/vector-icons";

type MealOption = {
  value: number;
  label: string;
  description: string;
};

const mealOptions: MealOption[] = [
  {
    value: 2,
    label: "2 meals per day",
    description: "This will plan for 14 meals per week",
  },
  {
    value: 3,
    label: "3 meals per day",
    description: "This will plan for 21 meals per week",
  },
  {
    value: 1,
    label: "1 meal per day",
    description: "This will plan for 7 meals per week",
  },
];

export default function MealsPerDayScreen() {
  const { preferences, setMealsPerDay } = usePreferences();
  const [selectedMeals, setSelectedMeals] = useState<number>(
    preferences.mealsPerDay
  );
  const router = useRouter();

  const handleNext = () => {
    setMealsPerDay(selectedMeals);
    router.push("/onboarding/groceries");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How many meals do you want per day?</Text>
        <Text style={styles.subtitle}>
          This helps us create your personalized meal plan.
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {mealOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              selectedMeals === option.value && styles.selectedCard,
            ]}
            onPress={() => setSelectedMeals(option.value)}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {selectedMeals === option.value && (
              <FontAwesome
                name="check-circle"
                size={24}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
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
    flex: 1,
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
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    alignItems: "center",
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
