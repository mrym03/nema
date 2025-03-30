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
  ShoppingCart,
  Sparkles,
} from "lucide-react-native";
import { Recipe, RecipeIngredient, FoodCategory } from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingListStore } from "@/store/shoppingListStore";
import EmptyState from "@/components/EmptyState";
import {
  enhanceRecipeIngredients,
  normalizeIngredientName,
  standardizeUnit,
  convertToPracticalQuantity,
} from "@/utils/openaiHelper";
import { generateId } from "@/utils/helpers";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "@/components/HeaderBar";
import { OpenAI } from "openai";

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

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
  const { addRecipeIngredients } = useShoppingListStore();

  const [activeDay, setActiveDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMealType, setActiveMealType] = useState<
    "breakfast" | "lunch" | "dinner"
  >("breakfast");
  const [isGeneratingOptimizedPlan, setIsGeneratingOptimizedPlan] =
    useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isGeneratingSmartPlan, setIsGeneratingSmartPlan] = useState(false);
  const [hasShownFeatureNotice, setHasShownFeatureNotice] = useState(true);

  // Check number of meals needed based on user preferences
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

  // Helper function to check if a recipe was originally selected by the user
  const isUserSelectedRecipe = useCallback(
    (recipeId: string) => {
      const userSelectedIds = new Set(selectedRecipes.map((r) => r.id));
      return userSelectedIds.has(recipeId);
    },
    [selectedRecipes]
  );

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

    // Check if this is a user-selected recipe or an AI suggestion
    const isUserSelected = isUserSelectedRecipe(meal.recipeId);

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
            {!isUserSelected && (
              <View style={styles.aiSuggestedBadge}>
                <Text style={styles.aiSuggestedText}>AI</Text>
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
      return;
    }

    setIsGeneratingOptimizedPlan(true);
    // Hide any expanded meal slots and suggestions during generation
    setExpandedMeal(null);
    setShowSuggestions(false);

    try {
      // Clear the existing meal plan first
      await useMealPlannerStore.getState().clearMealPlan();

      // Call the original meal planning function
      await useMealPlannerStore
        .getState()
        .generateMealPlan(
          Array.from(preferences.dietaryPreferences || new Set()),
          Array.from(preferences.cuisinePreferences || new Set())
        );

      // Show success message with Alert
      Alert.alert(
        "Meal Plan Created",
        "Your meal plan has been optimized using our rule-based algorithm to reduce food waste. It ensures no recipes are repeated within the same day.",
        [{ text: "Great!" }]
      );
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

  // Update the generateSmartMealPlan function to remove the New Feature popup
  const generateSmartMealPlan = useCallback(async () => {
    if (selectedRecipes.length === 0) {
      Alert.alert(
        "No Recipes Selected",
        "Please select recipes from the Recipes tab first.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsGeneratingSmartPlan(true);
    // Hide any expanded meal slots and suggestions during generation
    setExpandedMeal(null);
    setShowSuggestions(false);

    try {
      // Collect existing selections to preserve them
      const existingSelections = mealPlan.map((meal) => ({
        recipeId: meal.recipeId,
        dayIndex: meal.dayIndex,
        mealType: meal.mealType,
      }));

      // Call the smart meal planning function with the correct preferences properties
      await useMealPlannerStore
        .getState()
        .generateSmartMealPlan(
          Array.from(preferences.dietaryPreferences || new Set()),
          Array.from(preferences.cuisinePreferences || new Set()),
          preferences.mealsPerDay || 3,
          existingSelections
        );

      // Get the explanation from the store if available
      const planExplanation = useMealPlannerStore.getState().error;

      // Show standard success message without special notification
      Alert.alert(
        "Meal Plan Created",
        "Your meal plan has been optimized with AI to minimize food waste and use expiring items first. Similar recipes have been suggested to enhance variety.",
        [{ text: "Great!" }]
      );

      // Clear the explanation from the store
      useMealPlannerStore.getState().error = null;
    } catch (error) {
      console.error("Error generating smart meal plan:", error);

      // Check if it might be an API key issue
      const errorString = String(error);
      if (
        errorString.includes("API key") ||
        errorString.includes("authentication")
      ) {
        Alert.alert(
          "API Key Required",
          "To use the AI-powered meal planning, you need to add your OpenAI API key in the .env file. For now, a rule-based approach will be used instead.",
          [
            {
              text: "Learn More",
              onPress: () => setShowHelpModal(true),
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "An error occurred while generating your meal plan. Falling back to rule-based optimization."
        );
      }
    } finally {
      setIsGeneratingSmartPlan(false);
    }
  }, [selectedRecipes, preferences, mealPlan, setShowHelpModal]);

  // Update the renderHelpModal function to include information about the new smart meal planning feature
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
            <Text style={styles.modalTitle}>Meal Planning Features</Text>

            <ScrollView
              style={styles.modalScrollContent}
              contentContainerStyle={styles.modalContentContainer}
            >
              <View style={styles.modalSection}>
                <Text style={[styles.modalSubtitle, { color: Colors.primary }]}>
                  Our Goal: Minimize Food Waste
                </Text>
                <Text style={styles.modalText}>
                  The meal planner uses special algorithms to create meal plans
                  that help reduce food waste by prioritizing ingredients that
                  will expire soon.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalSubtitle, { color: Colors.success }]}>
                  NEW: AI Smart Meal Planning with Similar Recipe Suggestions
                </Text>
                <Text style={styles.modalText}>
                  Our enhanced AI-powered meal planning system now goes beyond
                  your selected recipes to find similar, complementary dishes
                  that can help reduce food waste and add variety:
                </Text>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Preserves your existing meal selections
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Intelligently finds similar recipes based on your
                    preferences
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Prioritizes recipes that use ingredients about to expire
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Ensures no recipe repetition on the same day
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Uses AI to discover complementary recipes that work well
                    together
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <View style={styles.bullet} />
                  <Text style={styles.modalText}>
                    Provides AI insights about why recipes were selected
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalSubtitle, { color: Colors.primary }]}>
                  Regular Optimization
                </Text>
                <Text style={styles.modalText}>
                  The basic optimization uses our scoring formula to assign
                  recipes to each day, but only considers your selected recipes:
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
                  How to Identify AI Suggested Recipes:
                </Text>
                <Text style={styles.modalText}>
                  Recipes that were automatically suggested by the AI (not part
                  of your original selection) are marked with a small green "AI"
                  badge in the bottom left corner.
                </Text>
                <View style={styles.badgeExample}>
                  <View style={styles.aiSuggestedBadge}>
                    <Text style={styles.aiSuggestedText}>AI</Text>
                  </View>
                  <Text
                    style={[
                      styles.modalText,
                      { marginLeft: 8, marginBottom: 0 },
                    ]}
                  >
                    This label indicates a recipe suggested by AI
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>
                  Difference Between Options:
                </Text>
                <View style={styles.comparisonTable}>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonHeader}>Feature</Text>
                    <Text style={styles.comparisonHeader}>Optimize</Text>
                    <Text style={styles.comparisonHeader}>AI Smart Plan</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Preserves selections
                    </Text>
                    <Text style={styles.comparisonCell}>No</Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Uses expiry dates
                    </Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                    <Text style={styles.comparisonCell}>Yes+</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Avoids same-day repetition
                    </Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Suggests similar recipes
                    </Text>
                    <Text style={styles.comparisonCell}>No</Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Recipe suggestions
                    </Text>
                    <Text style={styles.comparisonCell}>Selected only</Text>
                    <Text style={styles.comparisonCell}>AI enhanced</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>Uses OpenAI</Text>
                    <Text style={styles.comparisonCell}>No</Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                  </View>
                  <View style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      Provides insights
                    </Text>
                    <Text style={styles.comparisonCell}>No</Text>
                    <Text style={styles.comparisonCell}>Yes</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.modalText,
                    { marginTop: 10, fontStyle: "italic" },
                  ]}
                >
                  Both options now avoid recipe repetition within the same day!
                  The AI Smart Plan also adds similar recipe suggestions based
                  on your preferences and pantry ingredients to maximize variety
                  and minimize waste.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSubtitle}>Meals Per Day:</Text>
                <Text style={styles.modalText}>
                  The meal planner respects your preference for how many meals
                  you want per day. This is configured in your Settings tab.
                  Currently, you have {preferences.mealsPerDay || 3}{" "}
                  {preferences.mealsPerDay === 1 ? "meal" : "meals"} per day
                  configured.
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

  // Helper function to categorize ingredients based on their names
  const categorizeIngredient = (ingredientName: string): FoodCategory => {
    const name = ingredientName.toLowerCase();

    // Fruits category
    if (
      name.includes("fruit") ||
      /apple|banana|orange|berry|berries|grape|melon|pear|peach|mango|pineapple|cherry|lemon|lime|avocado/.test(
        name
      )
    ) {
      return "fruits";
    }

    // Vegetables category
    if (
      name.includes("vegetable") ||
      /carrot|potato|onion|garlic|pepper|tomato|lettuce|spinach|broccoli|cabbage|corn|pea|bean|mushroom/.test(
        name
      )
    ) {
      return "vegetables";
    }

    // Meat category
    if (
      name.includes("meat") ||
      /chicken|beef|pork|turkey|ham|bacon|sausage|ground|steak|mince|lamb|veal/.test(
        name
      )
    ) {
      return "meat";
    }

    // Seafood category
    if (
      name.includes("fish") ||
      name.includes("seafood") ||
      /shrimp|salmon|tuna|crab|lobster|oyster|clam|mussel|prawn|cod|tilapia/.test(
        name
      )
    ) {
      return "seafood";
    }

    // Dairy category
    if (
      name.includes("dairy") ||
      /milk|cheese|yogurt|butter|cream|halloumi|cheddar|mozzarella|parmesan|feta/.test(
        name
      )
    ) {
      return "dairy";
    }

    // Grains category
    if (
      name.includes("grain") ||
      /rice|pasta|flour|bread|cereal|oat|wheat|barley|quinoa|noodle|pizza|bun/.test(
        name
      )
    ) {
      return "grains";
    }

    // Condiments category
    if (
      name.includes("condiment") ||
      /oil|vinegar|sauce|ketchup|mustard|mayo|mayonnaise|dressing|bbq|honey|syrup/.test(
        name
      )
    ) {
      return "condiments";
    }

    // Spices category
    if (
      name.includes("spice") ||
      name.includes("herb") ||
      /salt|pepper|oregano|basil|thyme|cinnamon|cumin|paprika|powder|seasoning|garlic powder|chili/.test(
        name
      )
    ) {
      return "spices";
    }

    // Fall back to 'other' for anything that doesn't match
    return "other";
  };

  // Add a new function to optimize the shopping list using GPT-4o
  const optimizeShoppingList = async (
    shoppingItems: RecipeIngredient[],
    recipes: ScoredRecipe[]
  ): Promise<RecipeIngredient[]> => {
    try {
      // Build context for GPT-4o with all recipes and their ingredients
      const recipeContexts = recipes
        .map((recipe) => {
          return `Recipe: ${
            recipe.title || (recipe as any).strMeal || "Unknown Recipe"
          }
Ingredients: ${
            recipe.extendedIngredients?.map((ing) => ing.name).join(", ") ||
            "No ingredients available"
          }
        `;
        })
        .join("\n\n");

      // Create the shopping list context with current quantities
      const shoppingListContext = shoppingItems
        .map((item) => {
          return `${item.name}: ${item.amount || 1} ${
            item.unit || "item"
          } (category: ${item.category || "other"})`;
        })
        .join("\n");

      // Prompt for GPT-4o to optimize the shopping list
      const prompt = `
I have a meal plan with the following recipes:

${recipeContexts}

Here's my current shopping list with ${shoppingItems.length} items:

${shoppingListContext}

Please optimize this shopping list to reduce the number of different ingredients while still making it possible to cook all the planned meals. Specifically:

1. Identify similar ingredients that can be substituted (e.g., using one type of pasta for multiple dishes)
2. For perishable items (especially vegetables and fruits), suggest using the same vegetable across multiple recipes to avoid waste
3. Consolidate similar spices or condiments where possible
4. Consider what a typical home cook would realistically buy and use
5. Consider substituting ingredients that serve similar purposes in recipes (e.g. green vegetables)

Your response should be structured in valid JSON format that I can parse, like this:
{
  "optimizedIngredients": [
    {
      "name": "ingredient name",
      "amount": number,
      "unit": "unit",
      "category": "category",
      "recipeName": "recipe names this is used in",
      "substitutionNotes": "explanation of any substitutions made (if applicable)"
    },
    ...
  ],
  "substitutionRationale": "Brief explanation of the overall substitution strategy"
}

Focus on practicality - the goal is a realistic shopping list for a home cook who wants to minimize waste and grocery purchases.
`;

      console.log("Sending shopping list optimization request to OpenAI...");

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a practical meal planning assistant that helps optimize shopping lists to reduce waste and make cooking more efficient. You understand ingredient substitutions and how to consolidate shopping lists.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      // Parse the optimized shopping list
      const content = response.choices[0].message.content;
      console.log("Received optimized shopping list from OpenAI");

      let optimizedData;
      try {
        optimizedData = JSON.parse(content as string);
        console.log(
          `Optimized list contains ${optimizedData.optimizedIngredients.length} items (down from ${shoppingItems.length})`
        );

        // Convert the optimized data back to RecipeIngredient format
        const optimizedItems: RecipeIngredient[] =
          optimizedData.optimizedIngredients.map((item: any) => {
            return {
              id: generateId(),
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              category: item.category as FoodCategory,
              recipeName: item.recipeName,
              // Store substitution notes in the original field for reference
              original: item.substitutionNotes || undefined,
            };
          });

        // Show the user a message about the optimization
        Alert.alert(
          "Shopping List Optimized",
          `Your shopping list has been optimized from ${shoppingItems.length} to ${optimizedItems.length} items.\n\n${optimizedData.substitutionRationale}`,
          [{ text: "OK" }]
        );

        return optimizedItems;
      } catch (e) {
        console.error("Failed to parse OpenAI optimization response:", e);
        return shoppingItems; // Return original list if optimization fails
      }
    } catch (error) {
      console.error("Error optimizing shopping list:", error);
      return shoppingItems; // Return original list if optimization fails
    }
  };

  // Add a new function to generate a shopping list from the meal plan
  const generateShoppingList = async () => {
    try {
      // Show loading indicator
      setIsGeneratingOptimizedPlan(true);

      // Collect all unique recipe IDs from the meal plan
      const allRecipeIds = new Set<string>();

      // The mealPlan is an array of meal items, not an object with days
      mealPlan.forEach((meal) => {
        if (meal && meal.recipeId) {
          allRecipeIds.add(meal.recipeId);
        }
      });

      console.log(`Found ${allRecipeIds.size} unique recipes in the meal plan`);

      if (allRecipeIds.size === 0) {
        setIsGeneratingOptimizedPlan(false);
        Alert.alert(
          "No Recipes Found",
          "Add some recipes to your meal plan first!"
        );
        return;
      }

      // Get recipe details for all recipe IDs
      const allRecipes: ScoredRecipe[] = [];
      const { suggestedRecipes } = useMealPlannerStore.getState();

      for (const recipeId of allRecipeIds) {
        const recipe = suggestedRecipes.find((r) => r.id === recipeId);
        if (recipe) {
          allRecipes.push(recipe);
        }
      }

      console.log(
        `Found ${allRecipes.length} recipes from ${allRecipeIds.size} unique IDs`
      );

      if (allRecipes.length === 0) {
        setIsGeneratingOptimizedPlan(false);
        Alert.alert(
          "No Recipe Data Found",
          "Could not find details for the recipes in your meal plan. Try refreshing your recipes."
        );
        return;
      }

      // Get pantry items to check against shopping list
      const pantryItems = usePantryStore.getState().items;
      console.log(
        `Found ${pantryItems.length} items in pantry to check against`
      );

      // Process recipes through OpenAI to enhance ingredients with proper quantities and units
      console.log("Enhancing recipes with OpenAI...");
      const enhancedRecipes = await Promise.all(
        allRecipes.map(async (recipe) => {
          return await enhanceRecipeIngredients(recipe);
        })
      );
      console.log(`Enhanced ${enhancedRecipes.length} recipes with OpenAI`);

      // Debug: Count total ingredients before consolidation
      let totalIngredientsBeforeConsolidation = 0;
      enhancedRecipes.forEach((recipe) => {
        if (recipe.extendedIngredients) {
          totalIngredientsBeforeConsolidation +=
            recipe.extendedIngredients.length;
        }
      });
      console.log(
        `Total ingredients before consolidation: ${totalIngredientsBeforeConsolidation}`
      );

      // Collect all ingredients from all recipes
      const ingredientMap = new Map<
        string,
        {
          name: string;
          amount: number;
          unit: string;
          recipeName: string;
          originalUnit: string; // Store original unit for reference
          originalAmount: number; // Store original amount for reference
          recipes: Set<string>; // Track which recipes use this ingredient
        }
      >();

      // Tracking duplicates for debugging
      const duplicateTracking: Record<string, string[]> = {};

      enhancedRecipes.forEach((recipe) => {
        if (
          recipe.extendedIngredients &&
          recipe.extendedIngredients.length > 0
        ) {
          recipe.extendedIngredients.forEach((ingredient) => {
            // Skip ingredients without a name
            if (!ingredient.name) return;

            // Normalize ingredient name for comparison
            const normalizedName = normalizeIngredientName(ingredient.name);

            // Convert to practical shopping units
            const initialUnit = ingredient.unit || "item";
            const standardUnit = standardizeUnit(initialUnit, ingredient.name);

            // Convert amount based on unit conversion if needed
            const amount = Number(ingredient.amount) || 1;
            const { amount: practicalAmount, unit: practicalUnit } =
              convertToPracticalQuantity(amount, standardUnit, ingredient.name);

            // Create a unique key that combines the normalized name and standard unit
            const key = `${normalizedName}|${practicalUnit}`;

            // Track duplicates for debugging
            if (!duplicateTracking[normalizedName]) {
              duplicateTracking[normalizedName] = [];
            }
            duplicateTracking[normalizedName].push(
              `${
                recipe.title || recipe.strMeal
              }: ${amount} ${initialUnit} → ${practicalAmount} ${practicalUnit}`
            );

            if (ingredientMap.has(key)) {
              // If ingredient already exists with the same unit, add the amounts
              const existing = ingredientMap.get(key)!;
              const previousAmount = existing.amount;
              existing.amount += practicalAmount;
              existing.recipes.add(
                recipe.strMeal || recipe.title || "Unknown Recipe"
              );

              console.log(
                `Combining: ${
                  ingredient.name
                } (${practicalAmount} ${practicalUnit}) from ${
                  recipe.title || recipe.strMeal
                } with existing ${previousAmount} ${practicalUnit} → new total: ${
                  existing.amount
                } ${practicalUnit}`
              );
            } else {
              // Check if the ingredient is already in the pantry with sufficient quantity
              const pantryItem = pantryItems.find(
                (item) =>
                  normalizeIngredientName(item.name) === normalizedName &&
                  (item.unit === practicalUnit || !item.unit || !practicalUnit)
              );

              // Skip adding to shopping list if sufficient quantity in pantry
              if (pantryItem && pantryItem.quantity >= practicalAmount) {
                console.log(
                  `Skipping ${ingredient.name} - found in pantry with sufficient quantity`
                );
                return;
              }

              // If the pantry has some but not enough, reduce the amount needed
              const amountNeeded = pantryItem
                ? Math.max(0, practicalAmount - pantryItem.quantity)
                : practicalAmount;

              // Only add to shopping list if we need more
              if (amountNeeded > 0) {
                ingredientMap.set(key, {
                  name: ingredient.name,
                  amount: amountNeeded,
                  unit: practicalUnit,
                  originalUnit: initialUnit,
                  originalAmount: amount,
                  recipeName:
                    recipe.strMeal || recipe.title || "Unknown Recipe",
                  recipes: new Set([
                    recipe.strMeal || recipe.title || "Unknown Recipe",
                  ]),
                });

                console.log(
                  `Added: ${
                    ingredient.name
                  } (${amountNeeded} ${practicalUnit}) from ${
                    recipe.title || recipe.strMeal
                  }`
                );
              }
            }
          });
        } else {
          console.log(
            `Recipe "${recipe.strMeal || recipe.title}" has no ingredients!`
          );
        }
      });

      // Debug: Log ingredient counts before and after consolidation
      console.log(
        `Total ingredients after consolidation: ${ingredientMap.size} (from ${totalIngredientsBeforeConsolidation} original ingredients)`
      );

      // Log duplicates (ingredients that appeared in multiple recipes)
      console.log("Ingredients that appeared in multiple recipes:");
      Object.entries(duplicateTracking).forEach(([name, occurrences]) => {
        if (occurrences.length > 1) {
          console.log(`- ${name} appeared ${occurrences.length} times:`);
          occurrences.forEach((occurrence) => console.log(`  - ${occurrence}`));
        }
      });

      // Convert to shopping list items
      const initialShoppingItems: RecipeIngredient[] = Array.from(
        ingredientMap.values()
      ).map((ingredient) => {
        // Get the list of recipe names that use this ingredient
        const recipeNames = Array.from(ingredient.recipes).join(", ");

        return {
          id: generateId(),
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          completed: false,
          addedOn: new Date().toISOString(),
          category: categorizeIngredient(ingredient.name),
          recipeName: recipeNames,
        };
      });

      console.log(
        `Generated ${initialShoppingItems.length} shopping list items`
      );

      if (initialShoppingItems.length === 0) {
        setIsGeneratingOptimizedPlan(false);
        Alert.alert(
          "No Ingredients Found",
          "Could not generate a shopping list from your meal plan"
        );
        return;
      }

      // OPTIMIZATION STEP: Use GPT-4o to optimize the shopping list
      console.log("Optimizing shopping list with GPT-4o...");
      const optimizedShoppingItems = await optimizeShoppingList(
        initialShoppingItems,
        enhancedRecipes as ScoredRecipe[]
      );
      console.log(
        `Optimized shopping list from ${initialShoppingItems.length} to ${optimizedShoppingItems.length} items`
      );

      // Add items to shopping list
      addRecipeIngredients(optimizedShoppingItems);

      // Stop loading indicator
      setIsGeneratingOptimizedPlan(false);

      // Notification of success
      Alert.alert(
        "Shopping List Generated",
        `Added ${optimizedShoppingItems.length} items to your shopping list`,
        [
          {
            text: "View List",
            onPress: () => router.push("/(tabs)/shopping-list"),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error generating shopping list:", error);
      setIsGeneratingOptimizedPlan(false);
      Alert.alert(
        "Error",
        "Failed to generate shopping list. Please try again."
      );
    }
  };

  const debugMealPlanData = () => {
    console.log("DEBUG - Meal Plan Structure:");
    console.log(
      `Meal Plan type: ${Array.isArray(mealPlan) ? "Array" : typeof mealPlan}`
    );
    console.log(
      `Meal Plan length: ${Array.isArray(mealPlan) ? mealPlan.length : "N/A"}`
    );

    if (Array.isArray(mealPlan) && mealPlan.length > 0) {
      console.log("First meal in plan:", JSON.stringify(mealPlan[0]));

      const recipeId = mealPlan[0].recipeId;
      console.log(`Looking for recipe with ID: ${recipeId}`);

      const recipe = suggestedRecipes.find((r) => r.id === recipeId);
      console.log(`Recipe found: ${!!recipe}`);

      if (recipe) {
        console.log("Recipe data types:");
        console.log(`- ID type: ${typeof recipe.id}`);
        console.log(`- Recipe ID from meal plan type: ${typeof recipeId}`);
      }
    }

    console.log("Suggested Recipes info:");
    console.log(`Count: ${suggestedRecipes.length}`);
    if (suggestedRecipes.length > 0) {
      console.log(
        `First suggested recipe ID: ${
          suggestedRecipes[0].id
        } (${typeof suggestedRecipes[0].id})`
      );
    }

    Alert.alert(
      "Debug Info",
      `Meal Plan: ${
        Array.isArray(mealPlan) ? mealPlan.length : 0
      } items\nSuggested Recipes: ${
        suggestedRecipes.length
      } items\nCheck console for detailed logs`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <HeaderBar
        title="Meal Plan"
        subtitle="Recipes to reduce waste"
        rightButtons={
          <>
            <Pressable
              style={styles.iconButton}
              onPress={handleGenerateMealPlan}
              disabled={isLoading || selectedRecipes.length === 0}
            >
              <Ionicons
                name="refresh-outline"
                size={24}
                color={Colors.textDark}
              />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => setShowHelpModal(true)}
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={Colors.textDark}
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={navToRecipes}>
              <Ionicons
                name="search-outline"
                size={24}
                color={Colors.textDark}
              />
            </Pressable>
          </>
        }
      />

      <View style={styles.contentContainer}>
        {selectedRecipes.length > 0 ? (
          <>
            <Animatable.View
              animation="fadeInUp"
              duration={500}
              style={[
                styles.optimizeContainer,
                { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
              ]}
            >
              <Text style={styles.optimizeTitle}>Meal Planning</Text>
              <Text style={styles.modalText}>
                Create your meal plan with AI-powered suggestions:
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.smartPlanButton,
                    isGeneratingSmartPlan && styles.buttonDisabled,
                    { flex: 1 }, // Make the button take the full width
                  ]}
                  onPress={generateSmartMealPlan}
                  disabled={isGeneratingSmartPlan}
                >
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.optimizeButtonText}>
                    {isGeneratingSmartPlan ? "Planning..." : "AI Smart Plan"}
                  </Text>
                </TouchableOpacity>
              </View>

              {mealPlan.length > 0 && (
                <TouchableOpacity
                  style={styles.shoppingListButton}
                  onPress={generateShoppingList}
                  disabled={isGeneratingOptimizedPlan}
                >
                  <ShoppingCart size={18} color="#FFFFFF" />
                  <Text style={styles.optimizeButtonText}>
                    Generate Shopping List
                  </Text>
                </TouchableOpacity>
              )}
            </Animatable.View>

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
    backgroundColor: Colors.background,
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
    padding: 16,
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optimizeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  optimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.textLight,
  },
  optimizeButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerButtonDisabled: {
    backgroundColor: Colors.background + "80",
  },
  headerButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  comparisonTable: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  comparisonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  comparisonHeader: {
    flex: 1,
    padding: 8,
    fontWeight: "bold",
    backgroundColor: Colors.primaryLight,
    textAlign: "center",
  },
  comparisonFeature: {
    flex: 1,
    padding: 8,
    fontWeight: "500",
  },
  comparisonCell: {
    flex: 1,
    padding: 8,
    textAlign: "center",
  },
  smartPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  helpButton: {
    alignSelf: "center",
    backgroundColor: "transparent",
    marginTop: 8,
  },
  aiSuggestedBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: Colors.success,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  aiSuggestedText: {
    color: "white",
    fontSize: 8,
    fontWeight: "bold",
  },
  badgeExample: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
  },
});
