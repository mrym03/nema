import { create } from "zustand";
import { Recipe } from "@/types";
import { useRecipeStore } from "./recipeStore";
import { usePantryStore } from "./pantryStore";
import { fetchRecipesByIngredients } from "@/utils/mealDbApi";

// Define the structure of a meal in the meal plan
export interface MealPlanItem {
  id: string;
  recipeId: string;
  title: string;
  imageUrl: string;
  dayIndex: number; // 0-6 for days of week
  mealType: "breakfast" | "lunch" | "dinner";
  score: number;
  ingredients: string[];
  calculatedScore?: {
    baseScore: number;
    overlapBonus: number;
    totalScore: number;
  };
}

// Define the store state
interface MealPlanState {
  mealPlan: MealPlanItem[];
  suggestedRecipes: Array<Recipe & { score: number }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  generateMealPlan: (
    dietaryPreferences: string[],
    cuisinePreferences: string[]
  ) => Promise<void>;
  addToMealPlan: (
    recipe: Recipe,
    dayIndex: number,
    mealType: "breakfast" | "lunch" | "dinner"
  ) => void;
  removeFromMealPlan: (id: string) => void;
  clearMealPlan: () => void;
  swapMeals: (id1: string, id2: string) => void;
  getRecipesForDay: (dayIndex: number) => MealPlanItem[];
  getRecipesForMeal: (dayIndex: number, mealType: string) => MealPlanItem[];
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

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const useMealPlannerStore = create<MealPlanState>((set, get) => ({
  mealPlan: [],
  suggestedRecipes: [],
  isLoading: false,
  error: null,

  generateMealPlan: async (dietaryPreferences, cuisinePreferences) => {
    set({ isLoading: true, error: null });

    try {
      // Get selected recipes from recipe store
      const selectedRecipes = useRecipeStore.getState().selectedRecipes;

      if (selectedRecipes.length === 0) {
        set({
          error: "No recipes selected. Please select recipes first.",
          isLoading: false,
          suggestedRecipes: [],
        });
        return;
      }

      // Get pantry items and extract ingredients
      const pantryItems = usePantryStore.getState().items;
      const pantryIngredients = pantryItems.map((item) =>
        item.name.toLowerCase()
      );

      // We'll set these from the component where we have access to the hook
      const mealsPerDay = 3; // Default to 3 meals per day
      const daysInWeek = 7;
      const totalMealsNeeded = mealsPerDay * daysInWeek;

      // Extract all ingredients from selected recipes to find similar ones
      const selectedIngredients = new Set<string>();
      selectedRecipes.forEach((recipe) => {
        if (
          recipe.extendedIngredients &&
          Array.isArray(recipe.extendedIngredients)
        ) {
          recipe.extendedIngredients.forEach((ingredient) => {
            if (ingredient.name) {
              selectedIngredients.add(ingredient.name.toLowerCase());
            }
          });
        }
      });

      // Fetch additional recipes based on pantry and selected ingredients
      const allIngredients = [
        ...new Set([...pantryIngredients, ...Array.from(selectedIngredients)]),
      ];
      const additionalRecipes = await fetchRecipesByIngredients(
        allIngredients,
        dietaryPreferences,
        cuisinePreferences
      );

      // Combine selected recipes with additional recipes, ensuring no duplicates
      const existingIds = new Set(selectedRecipes.map((r) => r.id));
      const allRecipes = [
        ...selectedRecipes,
        ...additionalRecipes.filter((r) => !existingIds.has(r.id)),
      ];

      // Score and sort recipes
      const scoredRecipes = scoreRecipes(
        allRecipes,
        pantryItems,
        [],
        selectedIngredients
      );

      // Update state with scored recipes
      set({
        suggestedRecipes: scoredRecipes,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      set({
        error: "Failed to generate meal plan. Please try again.",
        isLoading: false,
      });
    }
  },

  addToMealPlan: (recipe, dayIndex, mealType) => {
    // Include calculated score in the meal plan item if available
    const calculatedScore = (recipe as any).calculatedScore;

    const newMeal: MealPlanItem = {
      id: generateId(),
      recipeId: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      dayIndex,
      mealType,
      score: (recipe as any).score || 0,
      ingredients: recipe.extendedIngredients
        ? recipe.extendedIngredients
            .map((ing) => ing.name?.toLowerCase() || "")
            .filter((name) => name)
        : [],
      ...(calculatedScore ? { calculatedScore } : {}),
    };

    // Check if a meal already exists for this slot and replace it
    const existingMealIndex = get().mealPlan.findIndex(
      (meal) => meal.dayIndex === dayIndex && meal.mealType === mealType
    );

    if (existingMealIndex !== -1) {
      // Replace existing meal
      const updatedPlan = [...get().mealPlan];
      updatedPlan[existingMealIndex] = newMeal;
      set({ mealPlan: updatedPlan });
    } else {
      // Add new meal
      set((state) => ({
        mealPlan: [...state.mealPlan, newMeal],
        // Re-score remaining recipes with the updated ingredient overlaps
        suggestedRecipes: scoreRecipes(
          state.suggestedRecipes,
          usePantryStore.getState().items,
          state.mealPlan.concat(newMeal),
          new Set()
        ),
      }));
    }
  },

  removeFromMealPlan: (id) => {
    set((state) => ({
      mealPlan: state.mealPlan.filter((meal) => meal.id !== id),
      // Re-score recipes after removing a meal
      suggestedRecipes: scoreRecipes(
        state.suggestedRecipes,
        usePantryStore.getState().items,
        state.mealPlan.filter((meal) => meal.id !== id),
        new Set()
      ),
    }));
  },

  clearMealPlan: () => {
    set({ mealPlan: [] });
  },

  swapMeals: (id1, id2) => {
    const mealPlan = [...get().mealPlan];
    const index1 = mealPlan.findIndex((meal) => meal.id === id1);
    const index2 = mealPlan.findIndex((meal) => meal.id === id2);

    if (index1 !== -1 && index2 !== -1) {
      // Swap positions and meal types if necessary
      const temp = { ...mealPlan[index1] };

      // Swap placement details
      const tempDayIndex = mealPlan[index1].dayIndex;
      const tempMealType = mealPlan[index1].mealType;

      mealPlan[index1] = {
        ...mealPlan[index2],
        dayIndex: tempDayIndex,
        mealType: tempMealType,
      };

      mealPlan[index2] = {
        ...temp,
        dayIndex: mealPlan[index2].dayIndex,
        mealType: mealPlan[index2].mealType,
      };

      set({ mealPlan });
    }
  },

  getRecipesForDay: (dayIndex) => {
    return get().mealPlan.filter((meal) => meal.dayIndex === dayIndex);
  },

  getRecipesForMeal: (dayIndex, mealType) => {
    return get().mealPlan.filter(
      (meal) => meal.dayIndex === dayIndex && meal.mealType === mealType
    );
  },
}));

// Scoring function for recipes
function scoreRecipes(
  recipes: Recipe[],
  pantryItems: any[],
  currentMealPlan: MealPlanItem[],
  selectedIngredients: Set<string>
): Array<Recipe & { score: number }> {
  // Create a set of all ingredients used in the current meal plan
  const mealPlanIngredients = new Set<string>();
  currentMealPlan.forEach((meal) => {
    meal.ingredients.forEach((ing) =>
      mealPlanIngredients.add(ing.toLowerCase())
    );
  });

  // Process recipes and calculate scores
  return recipes
    .map((recipe) => {
      // Extract ingredients from recipe
      const recipeIngredients = recipe.extendedIngredients
        ? recipe.extendedIngredients
            .map((ing) => ing.name?.toLowerCase() || "")
            .filter((name) => name)
        : [];

      // Count pantry items used in recipe
      const pantryItemsUsed = recipeIngredients.filter((ing) =>
        pantryItems.some((item) => item.name.toLowerCase().includes(ing))
      ).length;

      // Count new ingredients needed (not in pantry)
      const newIngredients = recipeIngredients.filter(
        (ing) =>
          !pantryItems.some((item) => item.name.toLowerCase().includes(ing))
      ).length;

      // Calculate average days left for used pantry items
      let totalDaysLeft = 0;
      let numItemsWithExpiry = 0;
      let closestToExpiry = 100; // Track the item closest to expiry

      recipeIngredients.forEach((ing) => {
        const matchingItems = pantryItems.filter((item) =>
          item.name.toLowerCase().includes(ing)
        );

        matchingItems.forEach((item) => {
          if (item.expiryDate) {
            const daysLeft = getDaysUntilExpiry(item.expiryDate);
            totalDaysLeft += daysLeft;
            numItemsWithExpiry++;

            // Track item closest to expiry
            if (daysLeft < closestToExpiry) {
              closestToExpiry = daysLeft;
            }
          }
        });
      });

      const avgDaysLeft =
        numItemsWithExpiry > 0 ? totalDaysLeft / numItemsWithExpiry : 30; // Default to 30 if no expiry dates

      // Count overlapping ingredients with current meal plan
      const overlappingCount = recipeIngredients.filter((ing) =>
        mealPlanIngredients.has(ing)
      ).length;

      // Check if recipe is a user favorite
      const isFavorite = recipe.likes > 100; // Simplified check for demo purposes

      // Calculate the base score - give more weight to items that will expire soon
      const expiryUrgency =
        numItemsWithExpiry > 0
          ? 15 / Math.max(1, closestToExpiry) // Boost for recipes with soon-to-expire ingredients
          : 0;

      // Modified base score - heavily prioritize using expiring items
      const baseScore =
        (10 / Math.max(1, avgDaysLeft)) * pantryItemsUsed -
        2 * newIngredients +
        expiryUrgency;

      // Add bonuses
      const overlapBonus = 3 * overlappingCount;
      const favoriteBoost = isFavorite ? 5 : 0;

      // Calculate the final score, ensure it's at least 0
      const finalScore = Math.max(0, baseScore + overlapBonus + favoriteBoost);

      // Add the score to the recipe
      return {
        ...recipe,
        score: parseFloat(finalScore.toFixed(2)),
        // Add the ingredient analysis for debugging/display
        analysis: {
          pantryItemsUsed,
          newIngredients,
          overlappingCount,
          isFavorite,
          expiryUrgency,
          closestToExpiry,
          avgDaysLeft,
        },
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score in descending order
}
