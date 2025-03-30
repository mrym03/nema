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
  Modal,
  ScrollView,
  Platform,
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
import { usePantryStore } from "@/store/pantryStore";

// Define a type for recipes with score and analysis information
interface ScoredRecipe extends Recipe {
  score: number;
  calculatedScore?: {
    baseScore: number;
    overlapBonus: number;
    totalScore: number;
  };
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
  const [showHelpModal, setShowHelpModal] = useState(false);

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

      // Get all pantry items with their expiry dates
      const pantryItems = usePantryStore.getState().items;

      // Total number of meals needed based on user preference (default is 21 = 3 meals x 7 days)
      const totalMealsNeeded = Math.min(
        (preferences.mealsPerDay || 3) * 7,
        suggestedRecipes.length
      );

      // Track selected ingredients to apply bonus to other recipes
      const selectedIngredients = new Set<string>();
      // Track selected recipes to avoid duplicates
      const selectedRecipes: ScoredRecipe[] = [];
      // Store meals that will be added to the plan
      const mealsToAdd: {
        recipe: ScoredRecipe;
        day: number;
        mealType: string;
      }[] = [];

      // Clone the recipes array to manipulate scores
      let workingRecipes = [...suggestedRecipes] as ScoredRecipe[];

      console.log(`Starting meal planning: Need ${totalMealsNeeded} meals`);

      // Main selection loop - select one recipe at a time
      while (
        selectedRecipes.length < totalMealsNeeded &&
        workingRecipes.length > 0
      ) {
        // Calculate scores for each recipe
        workingRecipes = workingRecipes.map((recipe) => {
          const recipeIngredients = getIngredientListFromRecipe(recipe);
          let score = 0;

          // Calculate base score: Sum(10 / days_left for each pantry item used)
          for (const ingredient of recipeIngredients) {
            const matchingPantryItems = pantryItems.filter((item) =>
              item.name.toLowerCase().includes(ingredient.toLowerCase())
            );

            for (const pantryItem of matchingPantryItems) {
              if (pantryItem.expiryDate) {
                const daysLeft = getDaysUntilExpiry(pantryItem.expiryDate);
                score += 10 / Math.max(1, daysLeft);
              }
            }
          }

          // Add bonus for overlapping ingredients with already selected recipes
          let overlapBonus = 0;
          for (const ingredient of recipeIngredients) {
            if (selectedIngredients.has(ingredient.toLowerCase())) {
              overlapBonus += 3;
            }
          }

          return {
            ...recipe,
            score: score + overlapBonus,
            calculatedScore: {
              baseScore: score,
              overlapBonus: overlapBonus,
              totalScore: score + overlapBonus,
            },
          };
        });

        // Sort recipes by score (highest first)
        workingRecipes.sort((a, b) => b.score - a.score);

        // Select the highest scoring recipe
        const selectedRecipe = workingRecipes[0];
        selectedRecipes.push(selectedRecipe);

        // Remove the selected recipe from working set
        workingRecipes = workingRecipes.filter(
          (r) => r.id !== selectedRecipe.id
        );

        // Add the recipe's ingredients to the selected ingredients set (for future bonuses)
        const ingredients = getIngredientListFromRecipe(selectedRecipe);
        ingredients.forEach((ing) =>
          selectedIngredients.add(ing.toLowerCase())
        );

        console.log(
          `Selected recipe: ${selectedRecipe.title} with score ${selectedRecipe.score}`
        );

        // Determine which day and meal type to assign this recipe
        const mealIndex = selectedRecipes.length - 1;
        const day = Math.floor(mealIndex / mealsPerDay); // 0-6 for days of week
        const mealTypeIndex = mealIndex % mealsPerDay; // 0-2 for breakfast, lunch, dinner
        const mealType = MEAL_TYPES[mealTypeIndex] as
          | "breakfast"
          | "lunch"
          | "dinner";

        // Make sure we don't exceed valid day range (0-6)
        const validDay = Math.min(day, 6);

        // Store meal to add (we'll add them all at once at the end)
        mealsToAdd.push({
          recipe: selectedRecipe,
          day: validDay,
          mealType,
        });
      }

      console.log(
        `Selected ${selectedRecipes.length} recipes for the meal plan`
      );

      // Now add all selected meals to the meal plan
      for (const meal of mealsToAdd) {
        // Add a short delay between adds to allow state updates
        await new Promise((resolve) => setTimeout(resolve, 20));
        addToMealPlan(meal.recipe, meal.day, meal.mealType as any);
      }

      // Navigate to the first day to show the user their meal plan
      setActiveDay(0);
    } catch (err) {
      console.error("Error generating optimized meal plan:", err);
      Alert.alert(
        "Error",
        "There was a problem generating your optimized meal plan. Please try again."
      );
    } finally {
      setIsGeneratingOptimizedPlan(false);
    }
  }, [suggestedRecipes, addToMealPlan, clearMealPlan, preferences.mealsPerDay]);

  // Helper function to get days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 100; // Default if no expiry

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(1, diffDays); // Ensure at least 1 day
  };

  // Helper to extract ingredients from a recipe
  const getIngredientListFromRecipe = (recipe: Recipe): string[] => {
    if (
      !recipe.extendedIngredients ||
      !Array.isArray(recipe.extendedIngredients)
    ) {
      return [];
    }

    return recipe.extendedIngredients
      .map((ing) => ing.name?.trim())
      .filter((name) => name && name.length > 0) as string[];
  };

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

    // Try to find the original recipe to get detailed score info
    const recipeDetails = suggestedRecipes.find(
      (r) => r.id === meal.recipeId
    ) as ScoredRecipe;

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
          {recipeDetails?.calculatedScore && (
            <Text style={styles.scoreBreakdownText}>
              ({recipeDetails.calculatedScore.baseScore.toFixed(1)} +{" "}
              {recipeDetails.calculatedScore.overlapBonus.toFixed(1)})
            </Text>
          )}
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
                {item.calculatedScore && (
                  <View style={styles.scoreBreakdownContainer}>
                    <Text style={styles.scoreBreakdownText}>
                      Score: Base {item.calculatedScore.baseScore.toFixed(1)} +
                      Overlap {item.calculatedScore.overlapBonus.toFixed(1)}
                    </Text>
                  </View>
                )}
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

  // Add a help modal to explain the scoring system
  const renderHelpModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHelpModal}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How Recipe Scoring Works</Text>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalSubtitle}>
                Our Goal: Minimize Food Waste
              </Text>
              <Text style={styles.modalText}>
                The meal planner uses a special algorithm to create a meal plan
                that helps reduce food waste by prioritizing ingredients that
                will expire soon.
              </Text>

              <Text style={styles.modalSubtitle}>Recipe Scoring Formula:</Text>
              <Text style={styles.formulaText}>
                Base Score = Sum(10 / days_left) for each pantry item
              </Text>
              <Text style={styles.modalText}>
                Recipes using ingredients that will expire sooner get higher
                scores. For example, an ingredient expiring in 2 days adds 5
                points, while one expiring in 10 days adds only 1 point.
              </Text>

              <Text style={styles.modalSubtitle}>
                Ingredient Overlap Bonus:
              </Text>
              <Text style={styles.formulaText}>
                +3 points for each shared ingredient with other selected meals
              </Text>
              <Text style={styles.modalText}>
                As recipes are selected, other recipes that use the same
                ingredients get bonus points. This encourages efficient use of
                ingredients across multiple meals.
              </Text>

              <Text style={styles.modalSubtitle}>Selection Process:</Text>
              <Text style={styles.modalText}>
                1. Calculate scores for all recipes
              </Text>
              <Text style={styles.modalText}>
                2. Select the recipe with highest score
              </Text>
              <Text style={styles.modalText}>
                3. Add +3 point bonus to remaining recipes for each shared
                ingredient
              </Text>
              <Text style={styles.modalText}>
                4. Repeat until we have filled the meal plan
              </Text>

              <Text style={styles.modalSubtitle}>Score Breakdown:</Text>
              <Text style={styles.modalText}>
                Each recipe shows its score as (Base + Overlap Bonus)
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowHelpModal(true)}
        >
          <Info size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Your meal plan is optimized to reduce food waste by prioritizing
          ingredients that will expire soon. Recipes are scored based on: (1)
          how soon their ingredients expire and (2) ingredient overlap with
          other meals to minimize waste.
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

      {renderHelpModal()}
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
  scoreBreakdownContainer: {
    marginVertical: 2,
  },
  scoreBreakdownText: {
    fontSize: 10,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  helpButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: "85%",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  formulaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
    backgroundColor: Colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  closeButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
