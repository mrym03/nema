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
import { usePreferences, CuisinePreference } from "@/utils/PreferencesContext";
import Colors from "@/constants/colors";
import { FontAwesome } from "@expo/vector-icons";

type CuisineOption = {
  id: CuisinePreference;
  label: string;
};

const cuisineOptions: CuisineOption[] = [
  { id: "american", label: "American" },
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
  { id: "chinese", label: "Chinese" },
  { id: "japanese", label: "Japanese" },
  { id: "thai", label: "Thai" },
  { id: "indian", label: "Indian" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "french", label: "French" },
  { id: "greek", label: "Greek" },
  { id: "korean", label: "Korean" },
  { id: "vietnamese", label: "Vietnamese" },
  { id: "middleEastern", label: "Middle Eastern" },
  { id: "southAsian", label: "South Asian" },
  { id: "spanish", label: "Spanish" },
  { id: "caribbean", label: "Caribbean" },
  { id: "african", label: "African" },
  { id: "latinAmerican", label: "Latin American" },
];

export default function CuisinePreferencesScreen() {
  const { preferences, setCuisinePreferences } = usePreferences();
  const [selectedCuisines, setSelectedCuisines] = useState<CuisinePreference[]>(
    preferences.cuisinePreferences
  );
  const router = useRouter();

  const toggleCuisine = (cuisine: CuisinePreference) => {
    setSelectedCuisines((prev) => {
      if (prev.includes(cuisine)) {
        return prev.filter((c) => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
  };

  const handleNext = () => {
    setCuisinePreferences(selectedCuisines);
    router.push("/onboarding/meals");
  };

  const handleSkip = () => {
    router.push("/onboarding/meals");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          What cuisines do you want to cook today?
        </Text>
        <Text style={styles.subtitle}>
          Select your favorite culinary traditions for this session
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.optionsContainer}>
        <View style={styles.grid}>
          {cuisineOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.cuisineCard,
                selectedCuisines.includes(option.id) && styles.selectedCard,
              ]}
              onPress={() => toggleCuisine(option.id)}
            >
              <Text style={styles.cuisineLabel}>{option.label}</Text>
              {selectedCuisines.includes(option.id) && (
                <FontAwesome
                  name="check-circle"
                  size={16}
                  color={Colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cuisineCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
    minHeight: 60,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cuisineLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  checkIcon: {
    position: "absolute",
    top: 8,
    right: 8,
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
