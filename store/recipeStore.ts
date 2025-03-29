import { create } from "zustand";
import { Recipe } from "@/types";
import { mockRecipes } from "@/mocks/recipes";
import { fetchRecipesByIngredients, getRecipeDetails } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  quotaExceeded: boolean;
  fetchRecipes: (
    ingredients: string[],
    dietaryPreferences?: string[],
    cuisinePreferences?: string[]
  ) => Promise<void>;
  getRecipeById: (id: string) => Promise<Recipe | undefined>;
  cachedRecipeDetails: Record<string, Recipe>;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: mockRecipes,
  isLoading: false,
  error: null,
  quotaExceeded: false,
  cachedRecipeDetails: {},

  fetchRecipes: async (
    ingredients,
    dietaryPreferences = [],
    cuisinePreferences = []
  ) => {
    set({ isLoading: true, error: null, quotaExceeded: false });

    try {
      // Log what we're searching for
      console.log(
        `RecipeStore: Fetching recipes with ${ingredients.length} ingredients`
      );

      // Use the TheMealDB API with user preferences
      const recipesData = await fetchRecipesByIngredients(
        ingredients,
        dietaryPreferences,
        cuisinePreferences
      );

      // Check if we got any recipes
      if (!recipesData || recipesData.length === 0) {
        console.log("RecipeStore: No recipes returned from API");
        set({
          recipes: mockRecipes,
          error:
            "No recipes found for your ingredients. Showing sample recipes instead.",
          isLoading: false,
        });
        return;
      }

      console.log(
        `RecipeStore: Received ${recipesData.length} recipes from API`
      );

      // Transform the data to match our Recipe type if needed
      const formattedRecipes: Recipe[] = recipesData.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        imageUrl: item.imageUrl || item.image, // Handle both formats
        readyInMinutes: item.readyInMinutes || 30,
        servings: item.servings || 4,
        sourceUrl: item.sourceUrl || "",
        summary: item.summary || "",
        usedIngredientCount: item.usedIngredientCount || 0,
        missedIngredientCount: item.missedIngredientCount || 0,
        likes: item.likes || 0,
      }));

      console.log(
        `RecipeStore: Setting ${formattedRecipes.length} recipes in state`
      );
      set({ recipes: formattedRecipes, isLoading: false });
    } catch (error) {
      console.error("Recipe API error:", error);

      // Fall back to mock data in case of API failure
      set({
        recipes: mockRecipes,
        error:
          "An error occurred fetching recipes. Showing sample recipes instead.",
        isLoading: false,
      });
    }
  },

  getRecipeById: async (id) => {
    // First check if we already have the recipe in state
    const recipeFromState = get().recipes.find((recipe) => recipe.id === id);

    // Also check if we have it in our detailed cache
    const cachedDetails = get().cachedRecipeDetails[id];

    if (cachedDetails) {
      return cachedDetails;
    }

    if (recipeFromState) {
      try {
        // Try to get more detailed information
        const detailedRecipe = await getRecipeDetails(id);

        // Merge with what we know about used/missed ingredients
        const enhancedRecipe = {
          ...detailedRecipe,
          usedIngredientCount: recipeFromState.usedIngredientCount,
          missedIngredientCount: recipeFromState.missedIngredientCount,
        };

        // Cache the detailed recipe
        set((state) => ({
          cachedRecipeDetails: {
            ...state.cachedRecipeDetails,
            [id]: enhancedRecipe,
          },
        }));

        return enhancedRecipe;
      } catch (error) {
        console.error("Error fetching detailed recipe:", error);
        // If we can't get details, return what we have
        return recipeFromState;
      }
    }

    return recipeFromState;
  },
}));
