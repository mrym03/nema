import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useMealPlannerStore, MealPlanItem } from "@/store/mealPlannerStore";
import { useRecipeStore } from "@/store/recipeStore";
import { usePreferences } from "@/utils/PreferencesContext";
import Colors from "@/constants/colors";
import { Image } from "expo-image";
import {
  ChevronLeft,
  Plus,
  Calendar,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Star,
  Info,
  Clock,
  RefreshCw,
  Brain,
} from "lucide-react-native";
import { Recipe } from "@/types";

// Define a type for recipes with score and analysis information
interface ScoredRecipe extends Recipe {
  score: number;
  analysis?: {
    pantryItemsUsed: number;
    newIngredients: number;
    overlappingCount: number;
    isFavorite: boolean;
  };
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Define text disabled color without modifying the Colors object
const TEXT_DISABLED = "#C5C5C5"; // Light gray for disabled text

export default function MealPlannerScreen() {
  const router = useRouter();
  const {
    mealPlan,
    suggestedRecipes,
    generateMealPlan,
    addToMealPlan,
    removeFromMealPlan,
    clearMealPlan,
    isLoading,
    error,
  } = useMealPlannerStore();
  const { selectedRecipes } = useRecipeStore();
  const { preferences } = usePreferences();

  const [activeDay, setActiveDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMealType, setActiveMealType] = useState<
    "breakfast" | "lunch" | "dinner"
  >("breakfast");
  const [isGeneratingOptimizedPlan, setIsGeneratingOptimizedPlan] =
    useState(false);

  // Calculate number of meals needed based on user preferences
  const mealsPerDay = preferences.mealsPerDay || 3;

  useEffect(() => {
    // Generate meal plan when component mounts if we have selected recipes
    if (selectedRecipes.length > 0 && suggestedRecipes.length === 0) {
      handleGenerateMealPlan();
    }
  }, [selectedRecipes]);

  const handleGenerateMealPlan = () => {
    generateMealPlan(
      preferences.dietaryPreferences,
      preferences.cuisinePreferences
    );
  };

  const handleAddToMealPlan = (
    recipe: ScoredRecipe,
    dayIndex: number,
    mealType: "breakfast" | "lunch" | "dinner"
  ) => {
    addToMealPlan(recipe, dayIndex, mealType);
    setShowSuggestions(false);
    setExpandedMeal(null);
  };

  const handleRemoveFromMealPlan = (id: string) => {
    Alert.alert(
      "Remove Meal",
      "Are you sure you want to remove this meal from your plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromMealPlan(id),
        },
      ]
    );
  };

  const toggleMealExpansion = (mealType: "breakfast" | "lunch" | "dinner") => {
    if (expandedMeal === mealType) {
      setExpandedMeal(null);
      setShowSuggestions(false);
    } else {
      setExpandedMeal(mealType);
      setActiveMealType(mealType);
    }
  };

  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  const navigateToDay = (direction: "next" | "prev") => {
    if (direction === "next" && activeDay < 6) {
      setActiveDay(activeDay + 1);
    } else if (direction === "prev" && activeDay > 0) {
      setActiveDay(activeDay - 1);
    }
  };

  // Generate an optimized meal plan automatically
  const generateOptimizedMealPlan = useCallback(async () => {
    if (suggestedRecipes.length === 0) {
      Alert.alert(
        "Missing Recipe Data",
        "Please wait while recipe suggestions are loaded or retry generating suggestions."
      );
      return;
    }

    setIsGeneratingOptimizedPlan(true);

    try {
      // Clear existing meal plan
      clearMealPlan();

      // Our goal is to minimize waste by using ingredients that expire soon
      // And maximize ingredient overlap between meals
      const scoredRecipes = suggestedRecipes as ScoredRecipe[];

      // Create a meal plan to distribute meals across the week
      // Ensuring variety while optimizing for waste reduction
      for (let day = 0; day < 7; day++) {
        // For each meal type (breakfast, lunch, dinner)
        for (let mealIndex = 0; mealIndex < mealsPerDay; mealIndex++) {
          const mealType = MEAL_TYPES[mealIndex] as
            | "breakfast"
            | "lunch"
            | "dinner";

          // Rescore recipes based on current meal plan
          // This ensures that as we add meals, we prioritize recipes that
          // leverage ingredients already being used in other meals
          const currentPlanRecipes = [...(suggestedRecipes as ScoredRecipe[])];

          // Select the top-rated recipe for this slot
          // Skip if we've already used this recipe or a very similar one
          const existingMealTitles = mealPlan.map((m) => m.title.toLowerCase());

          let selectedRecipe = null;
          for (let i = 0; i < Math.min(10, currentPlanRecipes.length); i++) {
            const candidate = currentPlanRecipes[i];
            // Skip if we've already used this recipe (or a similar-named one)
            if (
              !existingMealTitles.some(
                (title) =>
                  title.includes(candidate.title.toLowerCase()) ||
                  candidate.title.toLowerCase().includes(title)
              )
            ) {
              selectedRecipe = candidate;
              break;
            }
          }

          // If still no recipe found, just use the top-scored one
          if (!selectedRecipe && currentPlanRecipes.length > 0) {
            selectedRecipe = currentPlanRecipes[0];
          }

          // Add the selected recipe to the meal plan
          if (selectedRecipe) {
            // Add a small delay to allow react state updates
            await new Promise((resolve) => setTimeout(resolve, 50));
            addToMealPlan(selectedRecipe, day, mealType);
          }
        }
      }
    } catch (err) {
      console.error("Error generating optimized meal plan:", err);
      Alert.alert(
        "Error",
        "There was a problem generating your optimized meal plan. Please try again."
      );
    } finally {
      setIsGeneratingOptimizedPlan(false);
    }
  }, [suggestedRecipes, mealsPerDay, mealPlan, addToMealPlan, clearMealPlan]);

  const renderMealForSlot = (
    dayIndex: number,
    mealType: "breakfast" | "lunch" | "dinner"
  ) => {
    const meal = mealPlan.find(
      (m) => m.dayIndex === dayIndex && m.mealType === mealType
    );

    if (!meal) {
      return (
        <TouchableOpacity
          style={styles.emptyMealSlot}
          onPress={() => {
            setActiveMealType(mealType);
            setExpandedMeal(mealType);
            setShowSuggestions(true);
          }}
        >
          <Plus size={24} color={Colors.primary} />
          <Text style={styles.emptyMealText}>Add {mealType}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.mealItem}>
        <Image
          source={meal.imageUrl}
          style={styles.mealImage}
          contentFit="cover"
        />
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle} numberOfLines={2}>
            {meal.title}
          </Text>
          <View style={styles.scoreContainer}>
            <Star size={14} color={Colors.warning} />
            <Text style={styles.scoreText}>{meal.score.toFixed(1)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeMealButton}
          onPress={() => handleRemoveFromMealPlan(meal.id)}
        >
          <Text style={styles.removeMealButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestedRecipes = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating meal suggestions...</Text>
        </View>
      );
    }

    if (suggestedRecipes.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No recipe suggestions available</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleGenerateMealPlan}
          >
            <Text style={styles.buttonText}>Generate Suggestions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={suggestedRecipes as ScoredRecipe[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() =>
              handleAddToMealPlan(
                item as ScoredRecipe,
                activeDay,
                activeMealType
              )
            }
          >
            <Image
              source={item.imageUrl}
              style={styles.suggestionImage}
              contentFit="cover"
            />
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.suggestionMeta}>
                <View style={styles.scoreContainer}>
                  <Star size={14} color={Colors.warning} />
                  <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Clock size={14} color={Colors.textLight} />
                  <Text style={styles.timeText}>{item.readyInMinutes} min</Text>
                </View>
              </View>
              <View style={styles.analysisContainer}>
                {item.analysis && item.analysis.pantryItemsUsed > 0 && (
                  <View style={styles.analysisItem}>
                    <CheckCircle2 size={12} color={Colors.success} />
                    <Text style={styles.analysisText}>
                      Uses {item.analysis.pantryItemsUsed} pantry items
                    </Text>
                  </View>
                )}
                {item.analysis && item.analysis.newIngredients > 0 && (
                  <View style={styles.analysisItem}>
                    <Info size={12} color={Colors.warning} />
                    <Text style={styles.analysisText}>
                      Needs {item.analysis.newIngredients} new ingredients
                    </Text>
                  </View>
                )}
                {item.analysis && item.analysis.overlappingCount > 0 && (
                  <View style={styles.analysisItem}>
                    <Plus size={12} color={Colors.primary} />
                    <Text style={styles.analysisText}>
                      Shares {item.analysis.overlappingCount} ingredients with
                      plan
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        style={styles.suggestionsList}
        contentContainerStyle={styles.suggestionsContent}
      />
    );
  };

  // Prepare data for SectionList to avoid nesting FlatList in ScrollView
  const prepareSectionData = () => {
    return MEAL_TYPES.slice(0, mealsPerDay).map((mealType) => ({
      title: mealType,
      data: [mealType], // We just need one item per section
      mealType: mealType as "breakfast" | "lunch" | "dinner",
      isExpanded: expandedMeal === mealType,
    }));
  };

  // Render each meal section
  const renderMealSection = ({ section }: { section: any }) => {
    const mealType = section.mealType as "breakfast" | "lunch" | "dinner";

    return (
      <View style={styles.mealSection}>
        <TouchableOpacity
          style={styles.mealHeader}
          onPress={() => toggleMealExpansion(mealType)}
        >
          <Text style={styles.mealTypeText}>
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          <ChevronDown
            size={20}
            color={Colors.text}
            style={{
              transform: [{ rotate: section.isExpanded ? "180deg" : "0deg" }],
            }}
          />
        </TouchableOpacity>

        {renderMealForSlot(activeDay, mealType)}

        {section.isExpanded && (
          <View style={styles.expandedSection}>
            <TouchableOpacity
              style={[
                styles.suggestionsButton,
                showSuggestions && styles.suggestionsButtonActive,
              ]}
              onPress={toggleSuggestions}
            >
              <Text
                style={[
                  styles.suggestionsButtonText,
                  showSuggestions && styles.suggestionsButtonTextActive,
                ]}
              >
                {showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
              </Text>
            </TouchableOpacity>

            {showSuggestions && renderSuggestedRecipes()}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Weekly Meal Plan</Text>
        {isGeneratingOptimizedPlan ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={generateOptimizedMealPlan}
          >
            <Brain size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Your meal plan is optimized to reduce food waste by using pantry items
          before they expire.
        </Text>
        <TouchableOpacity
          style={styles.optimizeMealPlanButton}
          onPress={generateOptimizedMealPlan}
          disabled={isGeneratingOptimizedPlan}
        >
          <Brain size={16} color="#FFF" />
          <Text style={styles.optimizeMealPlanButtonText}>
            {isGeneratingOptimizedPlan
              ? "Optimizing..."
              : "Auto-Generate Optimized Meal Plan"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateToDay("prev")}
          disabled={activeDay === 0}
        >
          <ChevronLeft
            size={20}
            color={activeDay === 0 ? TEXT_DISABLED : Colors.text}
          />
        </TouchableOpacity>

        <View style={styles.dayIndicator}>
          <Calendar size={16} color={Colors.primary} />
          <Text style={styles.dayText}>{DAYS_OF_WEEK[activeDay]}</Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateToDay("next")}
          disabled={activeDay === 6}
        >
          <ChevronRight
            size={20}
            color={activeDay === 6 ? TEXT_DISABLED : Colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Replace ScrollView with SectionList to fix the nested VirtualizedList error */}
      <SectionList
        sections={prepareSectionData()}
        keyExtractor={(item, index) => item + index}
        renderItem={() => null} // We don't use this render function
        renderSectionHeader={renderMealSection}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.sectionListContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  optimizeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  instructions: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.card,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 10,
  },
  optimizeMealPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    gap: 8,
  },
  optimizeMealPlanButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  dayNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  navButton: {
    padding: 8,
  },
  dayIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  container: {
    flex: 1,
  },
  sectionListContent: {
    paddingBottom: 20,
  },
  mealSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 8,
  },
  mealTypeText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  emptyMealSlot: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  emptyMealText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  mealItem: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mealImage: {
    width: 100,
    height: 100,
  },
  mealInfo: {
    flex: 1,
    padding: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: Colors.text,
  },
  expandedSection: {
    marginTop: 12,
  },
  suggestionsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 12,
  },
  suggestionsButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  suggestionsButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionsButtonTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    height: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    color: Colors.textLight,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionsContent: {
    paddingBottom: 16,
  },
  suggestionItem: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionImage: {
    width: 80,
    height: 80,
  },
  suggestionInfo: {
    flex: 1,
    padding: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: Colors.text,
  },
  suggestionMeta: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 12,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  analysisContainer: {
    gap: 2,
  },
  analysisItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  analysisText: {
    fontSize: 10,
    color: Colors.textLight,
  },
  removeMealButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 8,
    right: 8,
  },
  removeMealButtonText: {
    fontSize: 16,
    color: Colors.danger,
    fontWeight: "bold",
  },
});
