import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMealPlannerStore, MealPlanItem } from "@/store/mealPlannerStore";
import { useRecipeStore } from "@/store/recipeStore";
import { usePreferences } from "@/utils/PreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Image } from "expo-image";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  ChevronDown,
  CheckCircle2,
  Star,
  Info,
  Clock,
  RefreshCw,
  Brain,
  Search,
  Coffee,
  UtensilsCrossed,
  Soup,
} from "lucide-react-native";
import { Recipe } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import EmptyState from "@/components/EmptyState";

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
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
type MealType = (typeof MEAL_TYPES)[number]; // This creates a union type of the array values

// Define text disabled color without modifying the Colors object
const TEXT_DISABLED = "#C5C5C5"; // Light gray for disabled text

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animatable: any = { View };

// Try to import the libraries, but use fallbacks if they fail
try {
  // First try the Expo version of LinearGradient
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  try {
    // Fall back to react-native-linear-gradient if Expo version fails
    LinearGradient = require("react-native-linear-gradient").LinearGradient;
  } catch (e) {
    console.warn("Linear gradient not available, using fallback");
  }
}

try {
  Animatable = require("react-native-animatable");
} catch (e) {
  console.warn("react-native-animatable not available, using fallback");
}

// Calculate days until expiry for an ingredient
const getDaysUntilExpiry = (expiryDate: string): number => {
  if (!expiryDate) return 100; // Default large number if no expiry

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays); // Ensure at least 1 day
};

export default function MealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    mealType: MealType
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

  const viewRecipeDetails = (recipeId: string) => {
    // First check if the recipe exists in suggested recipes
    const recipe = suggestedRecipes.find((r) => r.id === recipeId);

    if (recipe) {
      // Navigate to recipe details
      router.push({
        pathname: "/recipe-details",
        params: { id: recipeId },
      });
    } else {
      // Alert the user if recipe is not found
      Alert.alert(
        "Recipe Not Found",
        "The recipe details could not be loaded. It may have been removed or the data has changed.",
        [{ text: "OK" }]
      );
    }
  };

  const navToRecipes = () => {
    router.push("/recipes");
  };

  // Helper function to get the meal display name
  const getMealDisplayName = (
    mealType: "breakfast" | "lunch" | "dinner"
  ): string => {
    switch (mealType) {
      case "breakfast":
        return "1st Meal";
      case "lunch":
        return "2nd Meal";
      case "dinner":
        return "3rd Meal";
      default:
        return mealType; // Fallback
    }
  };

  // Render a meal item that's already in the plan
  const renderMealItem = (meal: MealPlanItem) => {
    // Find the recipe in suggested recipes to get the detailed score info
    const recipeDetails = suggestedRecipes.find(
      (r) => r.id === meal.recipeId
    ) as ScoredRecipe;

    // Calculate how many times this meal appears in the plan
    const occurrenceCount = mealPlan.filter(
      (m) => m.recipeId === meal.recipeId
    ).length;
    const isRepeated = occurrenceCount > 1;

    return (
      <View style={styles.mealCard}>
        <Pressable
          style={({ pressed }) => [
            styles.mealCardInner,
            pressed && styles.pressed,
          ]}
          onPress={() => viewRecipeDetails(meal.recipeId)}
        >
          <View style={styles.mealImageContainer}>
            <Image
              source={meal.imageUrl}
              style={styles.mealImage}
              contentFit="cover"
              transition={200}
            />
            {isRepeated && (
              <View style={styles.repeatBadge}>
                <Text style={styles.repeatBadgeText}>{occurrenceCount}x</Text>
              </View>
            )}
          </View>
          <View style={styles.mealInfo}>
            <Text style={styles.mealTitle} numberOfLines={2}>
              {meal.title}
            </Text>
            <View style={styles.mealMeta}>
              <Clock size={14} color={Colors.textLight} />
              <Text style={styles.mealMetaText}>20-30 min</Text>

              {meal.score > 0 && (
                <View style={styles.scoreRow}>
                  <Star
                    size={14}
                    color={Colors.warning}
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={styles.scoreText}>{meal.score.toFixed(1)}</Text>

                  {recipeDetails?.calculatedScore && (
                    <Text style={styles.scoreBreakdown}>
                      ({recipeDetails.calculatedScore.baseScore.toFixed(1)} +{" "}
                      {recipeDetails.calculatedScore.overlapBonus.toFixed(1)})
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.removeMealBtn}
            onPress={() => handleRemoveFromMealPlan(meal.id)}
          >
            <Text style={styles.removeMealText}>✕</Text>
          </TouchableOpacity>
        </Pressable>
      </View>
    );
  };

  // Update the renderEmptyMealSlot function to properly show suggestions
  const renderEmptyMealSlot = (mealType: "breakfast" | "lunch" | "dinner") => (
    <TouchableOpacity
      style={styles.emptyMealSlot}
      onPress={() => {
        // First set the active meal type
        setActiveMealType(mealType);
        // Then toggle the expansion and suggestions states
        setExpandedMeal(mealType);
        setShowSuggestions(true);

        // If we don't have suggested recipes yet, generate them
        if (suggestedRecipes.length === 0 && !isLoading) {
          handleGenerateMealPlan();
        }
      }}
    >
      <Plus size={24} color={Colors.textLight} />
      <Text style={styles.emptyMealText}>
        Add {getMealDisplayName(mealType)}
      </Text>
    </TouchableOpacity>
  );

  // Add a renderSuggestedRecipes function to show recipe options
  const renderSuggestedRecipes = () => {
    if (isLoading) {
      return (
        <View style={styles.suggestionsLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.suggestionsLoaderText}>
            Loading suggestions...
          </Text>
        </View>
      );
    }

    if (suggestedRecipes.length === 0) {
      return (
        <View style={styles.suggestionsEmpty}>
          <Text style={styles.suggestionsEmptyText}>
            No recipe suggestions available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Select a recipe:</Text>
        <ScrollView style={styles.suggestionsList} nestedScrollEnabled={true}>
          {suggestedRecipes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() =>
                handleAddToMealPlan(
                  item as ScoredRecipe,
                  activeDay,
                  activeMealType as any
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
                {item.score > 0 && (
                  <View style={styles.suggestionMeta}>
                    <Star size={14} color={Colors.warning} />
                    <Text style={styles.suggestionScore}>
                      {item.score.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Update the renderMealSlot function to show suggestions when expanded
  const renderMealSlot = (mealType: "breakfast" | "lunch" | "dinner") => {
    const mealsForSlot = mealPlan.filter(
      (meal) => meal.dayIndex === activeDay && meal.mealType === mealType
    );

    // Get the appropriate icon for the meal type
    const getMealIcon = () => {
      switch (mealType) {
        case "breakfast":
          return (
            <Coffee
              size={16}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
          );
        case "lunch":
          return (
            <UtensilsCrossed
              size={16}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
          );
        case "dinner":
          return (
            <Soup size={16} color={Colors.primary} style={{ marginRight: 8 }} />
          );
        default:
          return null;
      }
    };

    const isExpanded = expandedMeal === mealType;

    return (
      <View style={styles.mealSlot}>
        <View style={styles.mealSlotHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {getMealIcon()}
            <Text style={styles.mealTypeText}>
              {getMealDisplayName(mealType)}
            </Text>
          </View>

          {mealsForSlot.length === 0 && (
            <TouchableOpacity
              onPress={() => {
                setActiveMealType(mealType);
                setExpandedMeal(isExpanded ? null : mealType);
                setShowSuggestions(!isExpanded);
              }}
              style={styles.expandButton}
            >
              <ChevronDown
                size={18}
                color={Colors.textLight}
                style={{
                  transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
                }}
              />
            </TouchableOpacity>
          )}
        </View>

        {mealsForSlot.length > 0 ? (
          <View>
            {mealsForSlot.map((item) => (
              <React.Fragment key={item.id}>
                {renderMealItem(item)}
              </React.Fragment>
            ))}
          </View>
        ) : (
          renderEmptyMealSlot(mealType)
        )}

        {/* Show suggestions when this meal slot is expanded */}
        {isExpanded && showSuggestions && renderSuggestedRecipes()}
      </View>
    );
  };

  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;
  const AnimatableView = Animatable.View || View;

  // Header component with conditional gradient
  const HeaderComponent = shouldUseGradient ? LinearGradient : View;
  const headerProps = shouldUseGradient
    ? {
        colors: [Colors.primary, Colors.primaryDark || Colors.primary],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: [
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top : 16 },
        ],
      }
    : {
        style: [
          styles.header,
          { backgroundColor: Colors.primary },
          { paddingTop: insets.top > 0 ? insets.top : 16 },
        ],
      };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating your meal plan...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        title="No Recipes Selected"
        message={`Go to the Recipes tab first and select the recipes you want in your meal plan. You'll need at least ${mealsPerDay} recipes per day (${
          mealsPerDay * 7
        } total for a week).`}
        imageUrl="https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?q=80&w=300"
        actionButton={{
          title: "Select Recipes",
          onPress: navToRecipes,
        }}
      />
    );
  };

  // Calculate the bottom padding to avoid the tab bar
  const tabBarHeight = Platform.OS === "ios" ? 90 : 75;
  const bottomPadding = insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10;

  // Update the generateOptimizedMealPlan function to respect user's meal preference count
  const generateOptimizedMealPlan = useCallback(async () => {
    if (selectedRecipes.length === 0) {
      Alert.alert(
        "No Recipes Selected",
        "Please select recipes from the Recipes tab first.",
        [{ text: "OK" }]
      );
      setIsGeneratingOptimizedPlan(false);
      return;
    }

    setIsGeneratingOptimizedPlan(true);
    // Hide any expanded meal slots and suggestions during generation to prevent nested scroll issues
    setExpandedMeal(null);
    setShowSuggestions(false);

    try {
      // Clear existing meal plan
      clearMealPlan();

      // Get all pantry items with their expiry dates
      const pantryItems = usePantryStore.getState().items;

      // Total number of meals needed based on user preference
      const mealsPerDay = preferences.mealsPerDay || 3;
      const totalMealsNeeded = mealsPerDay * 7;

      console.log(
        `Starting meal planning: Need ${totalMealsNeeded} meals with ${selectedRecipes.length} selected recipes`
      );

      // Store meals that will be added to the plan
      const mealsToAdd: {
        recipe: ScoredRecipe;
        day: number;
        mealType: MealType;
      }[] = [];

      // Track selected ingredients to apply bonus to other recipes
      const selectedIngredients = new Set<string>();

      // Track recipes usage (how many times each recipe has been used)
      const recipeUsage: Record<
        string,
        { count: number; lastUsedDay: number }
      > = {};

      // Initialize recipeUsage tracking for all selected recipes to make sure we use them all
      selectedRecipes.forEach((recipe) => {
        recipeUsage[recipe.id] = { count: 0, lastUsedDay: -1 };
      });

      // Clone the selected recipes array to manipulate scores
      // Combine with suggestedRecipes to get the score information
      const recipesWithScores = selectedRecipes.map((recipe) => {
        // Try to find this recipe in suggestedRecipes to get its score
        const scoredVersion = suggestedRecipes.find((r) => r.id === recipe.id);
        if (scoredVersion) {
          return scoredVersion;
        }

        // If not found in suggestedRecipes, calculate a score based on pantry items
        // Calculate expiry-based score as described in help modal
        let baseScore = 0;
        const recipeIngredients = recipe.extendedIngredients
          ? recipe.extendedIngredients
              .map((ing) => ing.name?.toLowerCase() || "")
              .filter((name) => name)
          : [];

        // Check if recipe ingredients match any pantry items
        recipeIngredients.forEach((ingredient) => {
          const matchingPantryItems = pantryItems.filter((item) =>
            item.name.toLowerCase().includes(ingredient)
          );

          // Add score for each matching pantry item (10/days_left)
          matchingPantryItems.forEach((item) => {
            if (item.expiryDate) {
              const daysLeft = getDaysUntilExpiry(item.expiryDate);
              baseScore += 10 / Math.max(1, daysLeft);
            }
          });
        });

        // Ensure minimum score of 1
        baseScore = Math.max(1, baseScore);

        return {
          ...recipe,
          score: baseScore,
          calculatedScore: {
            baseScore: baseScore,
            overlapBonus: 0,
            totalScore: baseScore,
          },
        };
      });

      let workingRecipes = [...recipesWithScores] as ScoredRecipe[];

      // Sort recipes by score in descending order
      workingRecipes.sort((a, b) => b.score - a.score);

      console.log(`Using ${workingRecipes.length} selected recipes`);

      // Loop through each day and each meal type to fill the plan
      for (let day = 0; day < 7; day++) {
        // Only loop through the number of meals per day that the user wants
        const mealsForThisDay = Math.min(mealsPerDay, MEAL_TYPES.length);

        for (
          let mealTypeIndex = 0;
          mealTypeIndex < mealsForThisDay;
          mealTypeIndex++
        ) {
          if (
            workingRecipes.length === 0 &&
            Object.keys(recipeUsage).length === 0
          ) {
            console.log(
              `No more recipes available at day ${day}, meal ${mealTypeIndex}`
            );
            break;
          }

          // Get the meal type for this slot
          const mealType = MEAL_TYPES[mealTypeIndex];

          // Find the best recipe considering usage limitations
          // First, try to find recipes that haven't been used yet or haven't been used on consecutive days
          const availableRecipes = workingRecipes.filter((r) => {
            const usage = recipeUsage[r.id];
            // Allow a recipe if:
            // 1. It hasn't been used too many times (max 3 times per week)
            // 2. It wasn't used the previous day (to avoid repetition on consecutive days)
            return (
              usage &&
              usage.count < 3 &&
              (usage.lastUsedDay === -1 || day - usage.lastUsedDay > 1)
            );
          });

          // If no recipes meet our ideal criteria, relax the consecutive day restriction
          const fallbackRecipes =
            availableRecipes.length > 0
              ? availableRecipes
              : workingRecipes.filter(
                  (r) => recipeUsage[r.id] && recipeUsage[r.id].count < 3
                );

          // If still no available recipes, reset all recipes for reuse
          if (fallbackRecipes.length === 0) {
            console.log(
              `All recipes have been used max times, resetting recipe usage for day ${day}`
            );
            // Reset recipe usage for recipes not used in the last 2 days
            Object.keys(recipeUsage).forEach((id) => {
              if (day - recipeUsage[id].lastUsedDay > 2) {
                recipeUsage[id].count = 0;
              }
            });
            // Recalculate available recipes after reset
            const resetRecipes = workingRecipes.filter(
              (r) => recipeUsage[r.id].count < 3
            );
            if (resetRecipes.length === 0) {
              console.log(
                `Still no available recipes after reset, using all recipes`
              );
              // If still no recipes available, use all recipes
              Object.keys(recipeUsage).forEach((id) => {
                recipeUsage[id].count = 0;
              });
            }
          }

          // Get the best recipe from available ones (or all if none are available)
          const recipesToChooseFrom =
            fallbackRecipes.length > 0 ? fallbackRecipes : workingRecipes;
          const topRecipe =
            recipesToChooseFrom.length > 0
              ? recipesToChooseFrom[0]
              : workingRecipes[0];

          if (!topRecipe) {
            console.log(
              `No recipes available for day ${day}, meal ${mealTypeIndex}`
            );
            continue;
          }

          // Update recipe usage tracking
          recipeUsage[topRecipe.id].count++;
          recipeUsage[topRecipe.id].lastUsedDay = day;

          console.log(
            `Adding ${
              topRecipe.title
            } to day ${day} for ${mealType}, usage count: ${
              recipeUsage[topRecipe.id].count
            }`
          );

          // Store for later addition to the meal plan
          mealsToAdd.push({
            recipe: topRecipe,
            day,
            mealType,
          });

          // Extract ingredients from the selected recipe to boost scores of recipes with overlapping ingredients
          const recipeIngredients = topRecipe.extendedIngredients
            ? topRecipe.extendedIngredients
                .map((ing) => ing.name?.toLowerCase() || "")
                .filter((name) => name)
            : [];

          // Add these ingredients to our tracking set
          recipeIngredients.forEach((ing) => selectedIngredients.add(ing));

          // Adjust scores for remaining recipes based on ingredient overlap
          workingRecipes = workingRecipes
            .map((recipe) => {
              // If this recipe has been used too many times, reduce its score dramatically
              if (recipeUsage[recipe.id].count >= 3) {
                return {
                  ...recipe,
                  score: 0,
                };
              }

              // Reduce score slightly if used recently
              let recencyPenalty = 0;
              if (recipeUsage[recipe.id].lastUsedDay !== -1) {
                const daysSinceLastUse =
                  day - recipeUsage[recipe.id].lastUsedDay;
                if (daysSinceLastUse <= 1) {
                  recencyPenalty = 10; // Big penalty for consecutive days
                } else if (daysSinceLastUse <= 3) {
                  recencyPenalty = 5; // Smaller penalty for recent use
                }
              }

              const recipeIngs = recipe.extendedIngredients
                ? recipe.extendedIngredients
                    .map((ing) => ing.name?.toLowerCase() || "")
                    .filter((name) => name)
                : [];

              // Count ingredients that overlap with our selection
              const overlapCount = recipeIngs.filter((ing) =>
                selectedIngredients.has(ing)
              ).length;

              // Apply a bonus to the score for ingredient overlap
              const overlapBonus = overlapCount * 3; // 3 points per overlapping ingredient

              // Store the original and new scores for display
              const baseScore = recipe.score || 0;
              const calculatedScore = {
                baseScore: baseScore,
                overlapBonus: overlapBonus,
                totalScore: Math.max(
                  0,
                  baseScore + overlapBonus - recencyPenalty
                ),
              };

              return {
                ...recipe,
                score: calculatedScore.totalScore,
                calculatedScore,
              };
            })
            .sort((a, b) => b.score - a.score); // Resort by new scores
        }
      }

      // Now actually add all the meals to the plan
      mealsToAdd.forEach(({ recipe, day, mealType }) => {
        // We need to cast mealType to ensure TypeScript recognizes it as a valid meal type
        addToMealPlan(
          recipe,
          day,
          mealType as "breakfast" | "lunch" | "dinner"
        );
      });

      console.log(
        `Optimized meal plan created with ${mealsToAdd.length} meals out of ${totalMealsNeeded} needed`
      );

      // If we didn't create a full week, let the user know
      if (mealsToAdd.length < totalMealsNeeded) {
        setTimeout(() => {
          Alert.alert(
            "Partial Meal Plan Created",
            `Created ${mealsToAdd.length} out of ${totalMealsNeeded} meal slots. To fill more slots, add more recipes from the Recipes tab.`,
            [{ text: "OK" }]
          );
        }, 500);
      } else if (selectedRecipes.length < totalMealsNeeded) {
        setTimeout(() => {
          Alert.alert(
            "Meal Plan Created With Repetition",
            `Your meal plan has been created with some recipes appearing multiple times during the week. Add more recipes in the Recipes tab for more variety.`,
            [{ text: "OK" }]
          );
        }, 500);
      }
    } catch (error) {
      console.error("Error generating optimized meal plan:", error);
      Alert.alert(
        "Error",
        "An error occurred while generating your optimized meal plan."
      );
    } finally {
      setIsGeneratingOptimizedPlan(false);
    }
  }, [selectedRecipes, preferences, clearMealPlan, addToMealPlan]);

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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>How Recipe Scoring Works</Text>

            <ScrollView
              style={styles.modalScrollContent}
              contentContainerStyle={styles.modalContentContainer}
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>
                  Our Goal: Minimize Food Waste
                </Text>
                <Text style={styles.modalText}>
                  The meal planner uses a special algorithm to create a meal
                  plan that helps reduce food waste by prioritizing ingredients
                  that will expire soon.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>
                  Recipe Scoring Formula:
                </Text>
                <Text style={styles.formulaText}>
                  Base Score = Sum(10 / days_left) for each pantry item
                </Text>
                <Text style={styles.modalText}>
                  Recipes using ingredients that will expire sooner get higher
                  scores. For example, an ingredient expiring in 2 days adds 5
                  points, while one expiring in 10 days adds only 1 point.
                </Text>
              </View>

              <View style={styles.modalSection}>
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
              </View>

              <View style={styles.modalSection}>
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
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>Recipe Repetition:</Text>
                <Text style={styles.modalText}>
                  When you have fewer recipes than needed for a full week, the
                  app will intelligently repeat recipes while trying to maintain
                  variety. Recipes can be used up to 3 times per week, but not
                  on consecutive days when possible. Repeated meals are marked
                  with a small badge showing how many times they appear in your
                  plan.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>Score Breakdown:</Text>
                <Text style={styles.modalText}>
                  Each recipe shows its score as (Base + Overlap Bonus)
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>Meals Per Day:</Text>
                <Text style={styles.modalText}>
                  The meal planner respects your preference for how many meals
                  you want per day. This is configured in your Settings tab.
                  Currently, you have {mealsPerDay}{" "}
                  {mealsPerDay === 1 ? "meal" : "meals"} per day configured.
                  This means your meal plan will include only the first{" "}
                  {mealsPerDay} meal types:{" "}
                  {MEAL_TYPES.slice(0, mealsPerDay)
                    .map((mealType) => getMealDisplayName(mealType))
                    .join(", ")}
                  .
                </Text>
              </View>
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
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <HeaderComponent {...headerProps}>
        <Text style={styles.title}>Meal Plan</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            onPress={handleGenerateMealPlan}
            disabled={isLoading || selectedRecipes.length === 0}
            onLongPress={() => {
              Alert.alert(
                "Refresh Suggestions",
                "This refreshes the suggested recipes based on your pantry items and preferences. It does not automatically arrange them into a meal plan."
              );
            }}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            onPress={() => setShowHelpModal(true)}
          >
            <Info size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            onPress={navToRecipes}
          >
            <Search size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </HeaderComponent>

      <View style={styles.contentContainer}>
        {selectedRecipes.length > 0 ? (
          <>
            <View style={styles.optimizeContainer}>
              <TouchableOpacity
                style={styles.optimizeButton}
                onPress={() => {
                  Alert.alert(
                    "Auto-Generate Meal Plan",
                    "This will create an optimal meal plan for the week based on your pantry items, with a focus on ingredients that will expire soon. Any existing plan will be replaced.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Generate Plan",
                        onPress: generateOptimizedMealPlan,
                      },
                    ]
                  );
                }}
                disabled={isGeneratingOptimizedPlan}
              >
                <Brain size={16} color="#FFFFFF" />
                <Text style={styles.optimizeButtonText}>
                  {isGeneratingOptimizedPlan
                    ? "Optimizing..."
                    : "Auto-Generate Smart Meal Plan"}
                </Text>
              </TouchableOpacity>

              {mealPlan.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.optimizeButton,
                    { marginTop: 8, backgroundColor: Colors.primary },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Regenerate Meal Plan",
                      "This will clear your current meal plan and create a new one. Continue?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Regenerate",
                          onPress: () => {
                            clearMealPlan();
                            generateOptimizedMealPlan();
                          },
                        },
                      ]
                    );
                  }}
                  disabled={isGeneratingOptimizedPlan}
                >
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.optimizeButtonText}>
                    Refresh With Different Recipes
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.daySelector}>
              <TouchableOpacity
                style={styles.dayNavButton}
                onPress={() => navigateToDay("prev")}
                disabled={activeDay === 0}
              >
                <ChevronLeft
                  size={24}
                  color={activeDay === 0 ? TEXT_DISABLED : Colors.text}
                />
              </TouchableOpacity>

              <View>
                <Text style={styles.dayTitle}>{DAYS_OF_WEEK[activeDay]}</Text>
                <Text style={styles.mealCountText}>
                  {mealsPerDay} {mealsPerDay === 1 ? "meal" : "meals"}/day
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dayNavButton}
                onPress={() => navigateToDay("next")}
                disabled={activeDay === 6}
              >
                <ChevronRight
                  size={24}
                  color={activeDay === 6 ? TEXT_DISABLED : Colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: bottomPadding },
              ]}
              nestedScrollEnabled={true}
            >
              {MEAL_TYPES.slice(0, mealsPerDay).map((mealType) => (
                <React.Fragment key={`meal-type-${mealType}`}>
                  {renderMealSlot(mealType as "breakfast" | "lunch" | "dinner")}
                </React.Fragment>
              ))}
            </ScrollView>
          </>
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Render the help modal */}
      {renderHelpModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: Colors.shadowDark || "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
  },
  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.card,
    marginBottom: 8,
  },
  dayNavButton: {
    padding: 4,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mealSlot: {
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderRadius: 8,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  mealSlotHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background + "80",
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    textTransform: "capitalize",
  },
  mealCard: {
    width: "100%",
    backgroundColor: Colors.background,
    marginBottom: 1,
  },
  mealCardInner: {
    flexDirection: "row",
    padding: 12,
  },
  mealImageContainer: {
    position: "relative",
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealMetaText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  removeMealBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.danger + "20",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeMealText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: "bold",
  },
  emptyMealSlot: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 16,
  },
  emptyMealText: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textLight,
  },
  optimizeContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  optimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    padding: 12,
    borderRadius: 8,
    shadowColor: Colors.shadowDark || "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optimizeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "90%",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: Colors.text,
    textAlign: "center",
  },
  modalScrollContent: {
    maxHeight: 400,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 8,
    color: Colors.text,
    lineHeight: 20,
  },
  formulaText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 8,
    backgroundColor: Colors.border + "40",
    padding: 8,
    borderRadius: 4,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.warning,
    marginLeft: 4,
  },
  scoreBreakdown: {
    fontSize: 11,
    color: Colors.textLight,
    marginLeft: 4,
  },
  repeatBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  repeatBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  mealCountText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: "center",
    marginTop: 2,
  },
  expandButton: {
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: Colors.background,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  suggestionsList: {
    maxHeight: 320,
  },
  suggestionItem: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + "40",
    alignItems: "center",
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  suggestionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  suggestionScore: {
    fontSize: 12,
    color: Colors.warning,
    marginLeft: 4,
    fontWeight: "500",
  },
  suggestionsLoader: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  suggestionsLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  suggestionsEmpty: {
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  suggestionsEmptyText: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
