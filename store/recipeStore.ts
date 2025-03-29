import { create } from "zustand";
import { Recipe } from "@/types";
import { mockRecipes } from "@/mocks/recipes";
import { fetchRecipesByIngredients, getRecipeDetails } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePantryStore } from "./pantryStore";

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

  // New states and functions for recipe selection and shopping list
  selectedRecipes: Recipe[];
  selectRecipe: (recipe: Recipe) => void;
  unselectRecipe: (recipeId: string) => void;
  toggleRecipeSelection: (recipe: Recipe) => void;
  isRecipeSelected: (recipeId: string) => boolean;
  clearSelectedRecipes: () => void;

  // Shopping list state
  shoppingList: ShoppingListItem[];
  generateShoppingList: () => void;
}

// Define a type for shopping list items
export type ShoppingListItem = {
  name: string;
  amount: string;
  unit: string;
  recipes: string[];
  inPantry: boolean;
};

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,
  quotaExceeded: false,
  cachedRecipeDetails: {},
  selectedRecipes: [],
  shoppingList: [],

  fetchRecipes: async (
    ingredients,
    dietaryPreferences = [],
    cuisinePreferences = []
  ) => {
    // Set empty array instead of mock recipes when loading starts
    set({ isLoading: true, error: null, quotaExceeded: false, recipes: [] });

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
          recipes: [], // Set empty array instead of mock recipes
          error:
            "No recipes found for your ingredients.",
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

      // Set empty array and error message
      set({
        recipes: [],
        error:
          "An error occurred fetching recipes.",
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

        // Also cache the basic recipe when we can't get details
        // This prevents repeated failed API calls for the same recipe
        set((state) => ({
          cachedRecipeDetails: {
            ...state.cachedRecipeDetails,
            [id]: recipeFromState,
          },
        }));

        // If we can't get details, return what we have
        return recipeFromState;
      }
    }

    return recipeFromState;
  },

  // New functions for recipe selection
  selectRecipe: (recipe) => {
    set((state) => {
      // If the recipe is already selected, don't add it again
      if (state.selectedRecipes.some((r) => r.id === recipe.id)) {
        return state;
      }
      return { selectedRecipes: [...state.selectedRecipes, recipe] };
    });
  },

  unselectRecipe: (recipeId) => {
    set((state) => ({
      selectedRecipes: state.selectedRecipes.filter((r) => r.id !== recipeId),
    }));
  },

  toggleRecipeSelection: (recipe) => {
    const isSelected = get().selectedRecipes.some((r) => r.id === recipe.id);
    if (isSelected) {
      get().unselectRecipe(recipe.id);
    } else {
      get().selectRecipe(recipe);
    }
  },

  isRecipeSelected: (recipeId) => {
    return get().selectedRecipes.some((r) => r.id === recipeId);
  },

  clearSelectedRecipes: () => {
    set({ selectedRecipes: [] });
  },

  // Function to generate shopping list from selected recipes
  generateShoppingList: () => {
    set({ isLoading: true });

    try {
      const { selectedRecipes } = get();
      const { items: pantryItems } = usePantryStore.getState();

      // If no recipes are selected, return empty list
      if (selectedRecipes.length === 0) {
        set({ shoppingList: [], isLoading: false });
        return;
      }

      // Extract all ingredients from selected recipes
      const allIngredients: {
        name: string;
        amount: string;
        unit: string;
        recipeTitle: string;
      }[] = [];

      selectedRecipes.forEach((recipe) => {
        if (
          recipe.extendedIngredients &&
          Array.isArray(recipe.extendedIngredients)
        ) {
          recipe.extendedIngredients.forEach((ingredient) => {
            if (ingredient.name) {
              // Check if ingredient.name exists
              allIngredients.push({
                name: ingredient.name,
                amount: ingredient.amount?.toString() || "",
                unit: ingredient.unit || "",
                recipeTitle: recipe.title,
              });
            }
          });
        }
      });

      // Group ingredients by name
      const groupedIngredients: Record<
        string,
        {
          amounts: string[];
          units: string[];
          recipes: string[];
        }
      > = {};

      allIngredients.forEach((ing) => {
        const name = ing.name.toLowerCase();
        if (!groupedIngredients[name]) {
          groupedIngredients[name] = {
            amounts: [],
            units: [],
            recipes: [],
          };
        }

        groupedIngredients[name].amounts.push(ing.amount);
        groupedIngredients[name].units.push(ing.unit);

        if (!groupedIngredients[name].recipes.includes(ing.recipeTitle)) {
          groupedIngredients[name].recipes.push(ing.recipeTitle);
        }
      });

      // Create shopping list and check against pantry
      const shoppingList: ShoppingListItem[] = Object.keys(
        groupedIngredients
      ).map((name: string) => {
        // Check if we have this in the pantry
        const inPantry = pantryItems.some(
          (item) => item.name.toLowerCase() === name.toLowerCase()
        );

        // Create a shopping item
        return {
          name,
          amount: groupedIngredients[name].amounts.join(" + "),
          unit: [...new Set(groupedIngredients[name].units)].join("/"),
          recipes: groupedIngredients[name].recipes,
          inPantry,
        };
      });

      // Filter out items we already have in the pantry
      const filteredList = shoppingList.filter((item) => !item.inPantry);

      set({
        shoppingList: filteredList,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error generating shopping list:", error);
      set({
        shoppingList: [],
        isLoading: false,
      });
    }
  },
}));
