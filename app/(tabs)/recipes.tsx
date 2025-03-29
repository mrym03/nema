import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRecipeStore } from "@/store/recipeStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePreferences } from "@/utils/PreferencesContext";
import { Recipe } from "@/types";
import Colors from "@/constants/colors";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  List,
  Calendar,
} from "lucide-react-native";

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

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    recipes,
    isLoading,
    error,
    fetchRecipes,
    toggleRecipeSelection,
    isRecipeSelected,
    selectedRecipes,
  } = useRecipeStore();
  const { items } = usePantryStore();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);

  // Function to extract ingredient names from pantry items
  const getIngredientNames = useCallback(() => {
    return items.map((item) => item.name);
  }, [items]);

  // Fetch recipes when component mounts or pantry items change
  useEffect(() => {
    fetchRecipesFromPantry();
  }, [items, preferences]);

  // Function to fetch recipes based on pantry ingredients and user preferences
  const fetchRecipesFromPantry = async () => {
    const ingredientNames = getIngredientNames();
    console.log(
      `Pantry contains ${ingredientNames.length} ingredients:`,
      ingredientNames
    );

    // Convert dietary preferences to TheMealDB-friendly format
    // TheMealDB doesn't have dedicated API filters, but we'll use these for manual filtering
    const dietaryPrefs = preferences.dietaryPreferences.map((pref) => {
      // Map app preference keys to simpler filter terms
      if (pref === "glutenFree") return "gluten free";
      if (pref === "dairyFree") return "dairy free";
      if (pref === "lowCarb") return "low carb";
      if (pref === "vegetarian") return "vegetarian";
      if (pref === "vegan") return "vegan";
      return pref;
    });

    // Convert cuisine preferences to expected format for TheMealDB areas
    // TheMealDB uses specific area names like "Italian", "Chinese", etc.
    const cuisinePrefs = preferences.cuisinePreferences.map((cuisine) => {
      // Standardize cuisine names for better matching with TheMealDB areas
      return cuisine.toLowerCase();
    });

    // Log what we're using for filtering
    if (dietaryPrefs.length > 0) {
      console.log("Applying dietary preferences:", dietaryPrefs);
    }
    if (cuisinePrefs.length > 0) {
      console.log("Applying cuisine preferences:", cuisinePrefs);
    }

    // Ensure we have a stable set of ingredients by handling duplicates and empty strings
    const cleanedIngredients = ingredientNames
      .filter((name) => name && name.trim().length > 0) // Remove empty names
      .map((name) => name.trim()); // Clean whitespace

    try {
      // Fetch recipes with our cleaned ingredients and preferences
      // Even if pantry is empty, we'll still get recipes based on preferences
      await fetchRecipes(cleanedIngredients, dietaryPrefs, cuisinePrefs);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRecipesFromPantry();
    setRefreshing(false);
  }, [fetchRecipesFromPantry]);

  const handleRecipePress = (recipeId: string) => {
    router.push({
      pathname: "../recipe-details",
      params: { id: recipeId },
    });
  };

  const handleViewMealPlanner = () => {
    router.push("/(tabs)/meal-plan");
  };

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard
        recipe={item}
        onPress={() => handleRecipePress(item.id)}
        isSelected={isRecipeSelected(item.id)}
        onToggleSelect={toggleRecipeSelection}
      />
    ),
    [isRecipeSelected, toggleRecipeSelection]
  );

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
    if (isLoading && !refreshing) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Finding recipes based on your pantry...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={fetchRecipesFromPantry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    if (items.length === 0) {
      return (
        <EmptyState
          title="Your pantry is empty"
          message="Add items to your pantry to get recipe suggestions."
          imageUrl="https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=300"
        />
      );
    }

    return (
      <EmptyState
        title="No recipes found"
        message="Try adding more ingredients to your pantry or refresh to find recipes."
        imageUrl="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=300"
      />
    );
  };

  // Calculate the bottom padding to avoid the tab bar
  const tabBarHeight = Platform.OS === "ios" ? 90 : 75;
  const bottomPadding = insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10;

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <HeaderComponent {...headerProps}>
        <Text style={styles.title}>Recipes</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            onPress={fetchRecipesFromPantry}
            disabled={isLoading}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("../search-recipes")}
          >
            <Search size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </HeaderComponent>

      <View style={styles.contentContainer}>
        {selectedRecipes.length > 0 && (
          <TouchableOpacity
            style={styles.shoppingListButton}
            onPress={handleViewMealPlanner}
          >
            <Calendar size={20} color="#FFFFFF" />
            <Text style={styles.shoppingListButtonText}>
              View Meal Plan ({selectedRecipes.length})
            </Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={recipes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding },
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      </View>
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
  listContent: {
    padding: 16,
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
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: "center",
    marginBottom: 16,
  },
  quotaTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.warning,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  shoppingListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    shadowColor: Colors.shadowDark || "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shoppingListButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
