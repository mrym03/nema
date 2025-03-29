import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useRecipeStore } from "@/store/recipeStore";
import { usePantryStore } from "@/store/pantryStore";
import { usePreferences } from "@/utils/PreferencesContext";
import { Recipe } from "@/types";
import Colors from "@/constants/colors";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import { RefreshCw, AlertTriangle } from "lucide-react-native";

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, isLoading, error, quotaExceeded, fetchRecipes } =
    useRecipeStore();
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
    console.log("Fetching recipes for ingredients:", ingredientNames);

    // Convert dietary preferences to Spoonacular format
    const dietaryPrefs = preferences.dietaryPreferences.map((pref) => {
      // Handle special cases for Spoonacular API
      if (pref === "glutenFree") return "gluten free";
      if (pref === "dairyFree") return "dairy free";
      if (pref === "lowCarb") return "low carb";
      return pref;
    });

    // Convert cuisine preferences
    const cuisinePrefs = preferences.cuisinePreferences;

    // Log what we're using for filtering
    if (dietaryPrefs.length > 0) {
      console.log("Applying dietary preferences:", dietaryPrefs);
    }
    if (cuisinePrefs.length > 0) {
      console.log("Applying cuisine preferences:", cuisinePrefs);
    }

    await fetchRecipes(ingredientNames, dietaryPrefs, cuisinePrefs);
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

  const renderItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard recipe={item} onPress={() => handleRecipePress(item.id)} />
    ),
    []
  );

  const renderEmptyState = () => (
    <EmptyState
      title="No recipes found"
      message="Add more items to your pantry to get recipe recommendations."
      imageUrl="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=300"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended Recipes</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchRecipesFromPantry}
          disabled={isLoading}
        >
          <RefreshCw
            size={20}
            color={isLoading ? Colors.textLight : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Finding recipes based on your pantry...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          {quotaExceeded ? (
            <>
              <AlertTriangle size={36} color={Colors.warning} />
              <Text style={styles.quotaTitle}>API Quota Reached</Text>
              <Text style={styles.quotaText}>
                We've reached our daily recipe search limit. Showing sample
                recipes instead. These will refresh tomorrow.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.errorText}>
                Couldn't fetch recipes: {error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchRecipesFromPantry}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      {/* Always show recipes - either real or mock ones */}
      <FlatList
        data={recipes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Increase to ensure content doesn't get hidden behind tab bar
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
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
  quotaText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
