import { create } from "zustand";
import { Recipe } from "@/types";
import { useRecipeStore } from "./recipeStore";
import { usePantryStore } from "./pantryStore";
import { fetchRecipesByIngredients } from "@/utils/mealDbApi";

// Import OpenAI functionality - we'll use this for enhanced recipe recommendations
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

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
  generateSmartMealPlan: (
    dietaryPreferences: string[],
    cuisinePreferences: string[],
    mealsPerDay: number,
    existingSelections: {
      recipeId: string;
      dayIndex: number;
      mealType: string;
    }[]
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

// Helper function to call OpenAI GPT API
async function callGptApi(prompt: string): Promise<any> {
  try {
    if (!OPENAI_API_KEY) {
      console.warn("No OpenAI API key found");
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful meal planning assistant that optimizes recipe choices based on pantry ingredients, expiration dates, and user preferences.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error:", errorText);
      return null;
    }

    const data = await response.json();
    try {
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      return null;
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return null;
  }
}

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

  generateSmartMealPlan: async (
    dietaryPreferences,
    cuisinePreferences,
    mealsPerDay,
    existingSelections
  ) => {
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

      // Get pantry items with expiration dates
      const pantryItems = usePantryStore.getState().items;

      // Process pantry items to focus on expiry dates
      const pantryWithExpiry = pantryItems.map((item) => ({
        name: item.name,
        expiryDate: item.expiryDate || null,
        daysUntilExpiry: item.expiryDate
          ? getDaysUntilExpiry(item.expiryDate)
          : null,
        category: item.category,
      }));

      // Sort pantry items by expiry date (soon to expire first)
      const soonToExpireItems = pantryWithExpiry
        .filter((item) => item.expiryDate)
        .sort(
          (a, b) => (a.daysUntilExpiry || 100) - (b.daysUntilExpiry || 100)
        );

      // Extract key ingredients from selected recipes and soon-to-expire pantry items
      const selectedIngredients = new Set<string>();
      const uniqueExpiringIngredients = new Set<string>();

      // Add soon-to-expire ingredients to a set (prioritize these)
      soonToExpireItems.forEach((item) => {
        uniqueExpiringIngredients.add(item.name.toLowerCase());
      });

      // Extract ingredients from selected recipes
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

      // Fetch additional similar recipes to expand options
      console.log(
        "Fetching additional recipes similar to selected ones and using soon-to-expire ingredients"
      );

      const allIngredients = [
        ...Array.from(uniqueExpiringIngredients),
        ...Array.from(selectedIngredients),
      ];

      // Use the first 5 ingredients to avoid overloading the API
      const ingredientsToSearch = allIngredients.slice(0, 5);

      const additionalRecipes = await fetchRecipesByIngredients(
        ingredientsToSearch,
        dietaryPreferences,
        cuisinePreferences
      );

      console.log(
        `Found ${additionalRecipes.length} additional similar recipes`
      );

      // Combine selected recipes with additional recipes, ensuring no duplicates
      const existingIds = new Set(selectedRecipes.map((r) => r.id));
      const allRecipes = [
        ...selectedRecipes,
        ...additionalRecipes.filter((r) => !existingIds.has(r.id)),
      ];

      console.log(
        `Total recipe pool: ${allRecipes.length} recipes (${
          selectedRecipes.length
        } selected by user, ${
          allRecipes.length - selectedRecipes.length
        } suggested)`
      );

      // Create simplified recipe data for the AI
      const simplifiedRecipes = allRecipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        isUserSelected: existingIds.has(recipe.id), // Flag if user selected this recipe
        ingredients: recipe.extendedIngredients
          ? recipe.extendedIngredients
              .map((ing) => ing.name?.toLowerCase() || "")
              .filter((name) => name)
          : [],
        cuisines: recipe.cuisines || [],
        dishTypes: recipe.dishTypes || [],
        likes: recipe.likes || 0,
        imageUrl: recipe.imageUrl,
      }));

      // FIRST ROUND OF SCORING: Apply our existing algorithm
      const scoredRecipes = scoreRecipes(
        allRecipes,
        pantryItems,
        get().mealPlan,
        new Set()
      );

      // Create a map of day->mealTypes with recipes already assigned
      const assignedSlots: Record<number, Record<string, string>> = {};
      existingSelections.forEach((selection) => {
        if (!assignedSlots[selection.dayIndex]) {
          assignedSlots[selection.dayIndex] = {};
        }
        assignedSlots[selection.dayIndex][selection.mealType] =
          selection.recipeId;
      });

      // Try to call GPT-4o-mini for enhanced recommendations, but fall back to rule-based if unavailable
      const gptInput = {
        recipes: simplifiedRecipes,
        pantryItems: pantryWithExpiry,
        soonToExpireItems: soonToExpireItems.slice(0, 10), // Top 10 soon to expire items
        dietaryPreferences,
        cuisinePreferences,
        mealsPerDay,
        daysInWeek: 7,
        initialScores: scoredRecipes.map((r) => ({
          id: r.id,
          score: r.score,
          isUserSelected: existingIds.has(r.id),
        })),
        existingAssignments: assignedSlots,
      };

      // Create prompt for GPT to optimize meal plan
      const prompt = `
      I need help creating a weekly meal plan that optimizes the use of pantry ingredients (especially those expiring soon), respects dietary preferences, avoids recipe repetition on the same day, and incorporates both user-selected recipes and similar suggested recipes for variety.

      Here's the data:
      ${JSON.stringify(gptInput, null, 2)}
      
      Please analyze this data and return a JSON object with the following structure:
      {
        "mealPlan": [
          {
            "dayIndex": 0-6,
            "mealType": "breakfast" | "lunch" | "dinner",
            "recipeId": "string",
            "reasoning": "brief explanation of why this recipe was chosen"
          },
          ...
        ],
        "explanations": {
          "pantryUsage": "explanation of how the plan uses pantry items efficiently",
          "expiryOptimization": "explanation of how items close to expiry are prioritized",
          "varietyStrategy": "explanation of how variety is maintained",
          "suggestedRecipesUsage": "explanation of how the suggested similar recipes were incorporated",
          "ingredientMinimization": "explanation of how the total number of unique ingredients was minimized"
        }
      }
      
      Rules for creating the meal plan (in priority order):
      1. Honor the existing meal assignments in existingAssignments
      2. No recipe should be used twice on the same day
      3. STRONGLY PRIORITIZE recipes with fewer total ingredients
      4. STRONGLY PRIORITIZE recipes with more overlapping ingredients with other chosen recipes
      5. Prioritize recipes using ingredients that will expire soon
      6. Try to minimize food waste by using existing pantry items efficiently
      7. For each day, include the number of meals specified by mealsPerDay
      8. Try to maintain variety across the week while using pantry items efficiently
      9. Consider the initialScores as a starting point but you can adjust based on a more holistic view
      10. Use a good mix of user-selected recipes (marked with isUserSelected=true) and similar suggested recipes
      11. Group recipes with complementary ingredients together on the same day to maximize ingredient usage
      
      The PRIMARY GOAL is to minimize the total number of unique ingredients needed across all recipes for the entire week, while still creating appealing and varied meals. If you need to choose between two recipes, always select the one that introduces fewer new ingredients to the grocery list.
      `;

      let finalMealPlan: any[] = [];
      let gptResponse = null;
      let explanationText = "";

      // Try to get GPT recommendations first
      try {
        gptResponse = await callGptApi(prompt);
      } catch (error) {
        console.warn(
          "Error calling GPT API, falling back to rule-based planning:",
          error
        );
      }

      // Use the enhanced GPT-based plan if available, otherwise use rule-based approach
      if (
        gptResponse &&
        gptResponse.mealPlan &&
        Array.isArray(gptResponse.mealPlan)
      ) {
        console.log(
          "Using GPT-enhanced meal plan with similar recipe suggestions"
        );
        finalMealPlan = gptResponse.mealPlan;

        // If we have explanations from GPT, save them for user feedback
        if (gptResponse.explanations) {
          explanationText = `
🍽️ Pantry Usage: ${
            gptResponse.explanations.pantryUsage ||
            "Optimized for efficient pantry usage"
          }

⏰ Expiry Strategy: ${
            gptResponse.explanations.expiryOptimization ||
            "Prioritized items expiring soon"
          }

🔄 Variety Approach: ${
            gptResponse.explanations.varietyStrategy ||
            "Ensured variety throughout the week"
          }

🆕 Similar Recipes: ${
            gptResponse.explanations.suggestedRecipesUsage ||
            "Added complementary recipes"
          }
          `.trim();

          console.log("AI Explanation:", explanationText);
        }
      } else {
        console.log("Using enhanced rule-based meal plan with similar recipes");
        // Use our improved rule-based approach with all recipes (selected + similar)
        finalMealPlan = generateRuleBasedMealPlan(
          scoredRecipes,
          mealsPerDay,
          existingSelections
        );

        // Provide a basic explanation for the rule-based approach
        explanationText =
          "Your meal plan has been optimized using ingredients about to expire, with a mix of your selected recipes and similar suggestions. No recipe is repeated on the same day, and the plan prioritizes efficient use of your pantry items.";
      }

      // Clear previous meal plan except for existing selections
      const keepMeals = get().mealPlan.filter((meal) =>
        existingSelections.some(
          (sel) =>
            sel.dayIndex === meal.dayIndex && sel.mealType === meal.mealType
        )
      );

      set({ mealPlan: keepMeals });

      // Add new meals to the plan
      for (const meal of finalMealPlan) {
        // Skip if this slot already has a recipe (from existingSelections)
        const existingMeal = keepMeals.find(
          (m) => m.dayIndex === meal.dayIndex && m.mealType === meal.mealType
        );

        if (existingMeal) continue;

        // Find the full recipe object
        const recipeToAdd = allRecipes.find((r) => r.id === meal.recipeId);
        if (recipeToAdd) {
          // Add to meal plan
          const scoredRecipe =
            scoredRecipes.find((r) => r.id === meal.recipeId) || recipeToAdd;
          get().addToMealPlan(
            scoredRecipe,
            meal.dayIndex,
            meal.mealType as "breakfast" | "lunch" | "dinner"
          );
        }
      }

      // Update state with scored recipes and the explanation
      set((state) => ({
        suggestedRecipes: scoredRecipes,
        isLoading: false,
        // Store the explanation in the error field temporarily so we can access it when showing success message
        error: explanationText.length > 0 ? explanationText : null,
      }));
    } catch (error) {
      console.error("Error generating smart meal plan:", error);
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

// NEW: Rule-based meal planning algorithm as fallback
function generateRuleBasedMealPlan(
  scoredRecipes: Array<Recipe & { score: number }>,
  mealsPerDay: number,
  existingSelections: { recipeId: string; dayIndex: number; mealType: string }[]
): any[] {
  const mealTypes = ["breakfast", "lunch", "dinner"].slice(0, mealsPerDay);
  const mealPlan: any[] = [];
  const maxUsagePerRecipe = Math.ceil((7 * mealsPerDay) / scoredRecipes.length);

  console.log(
    `Setting max usage per recipe to ${maxUsagePerRecipe} based on ${scoredRecipes.length} available recipes`
  );

  // Make a deep copy of the scored recipes array to avoid modifying the original
  let allRecipes = [...scoredRecipes].sort((a, b) => b.score - a.score);

  // Create a map of day->mealTypes with recipes already assigned
  const assignedSlots: Record<number, Record<string, string>> = {};
  existingSelections.forEach((selection) => {
    if (!assignedSlots[selection.dayIndex]) {
      assignedSlots[selection.dayIndex] = {};
    }
    assignedSlots[selection.dayIndex][selection.mealType] = selection.recipeId;
  });

  // Create a map to track recipes used on each day to avoid same-day repetition
  const recipesUsedPerDay: Record<number, Set<string>> = {};
  for (let day = 0; day < 7; day++) {
    recipesUsedPerDay[day] = new Set<string>();

    // Add existing selections to the used recipes set
    if (assignedSlots[day]) {
      Object.values(assignedSlots[day]).forEach((recipeId) => {
        recipesUsedPerDay[day].add(recipeId);
      });
    }
  }

  // Create a map to track total recipe usage across the week
  const recipeUsageCount: Record<string, number> = {};
  scoredRecipes.forEach((recipe) => {
    recipeUsageCount[recipe.id] = 0;
  });

  // Track existing assignments
  existingSelections.forEach((selection) => {
    recipeUsageCount[selection.recipeId] =
      (recipeUsageCount[selection.recipeId] || 0) + 1;
  });

  // Loop through each day and meal type
  for (let day = 0; day < 7; day++) {
    for (const mealType of mealTypes) {
      // Skip if this slot already has a recipe assigned
      if (assignedSlots[day]?.[mealType]) {
        continue;
      }

      // Filter recipes not already used on this day
      let availableForDay = allRecipes.filter(
        (recipe) => !recipesUsedPerDay[day].has(recipe.id)
      );

      // Also filter by recipes that haven't hit their max usage limit
      let availableByUsage = availableForDay.filter(
        (recipe) => (recipeUsageCount[recipe.id] || 0) < maxUsagePerRecipe
      );

      // If we have recipes available that haven't hit their usage limit, use those
      if (availableByUsage.length > 0) {
        availableForDay = availableByUsage;
      } else if (availableForDay.length === 0) {
        console.log(
          `All recipes have been used max times, resetting recipe usage for day ${day}`
        );
        // If no recipes available for this day, check if we can reset counting
        availableForDay = allRecipes.filter(
          (recipe) => !recipesUsedPerDay[day].has(recipe.id)
        );

        if (availableForDay.length === 0) {
          console.log(
            `Still no available recipes after reset, using all recipes`
          );
          // If still no recipes, use any recipe (to fill all slots)
          availableForDay = allRecipes;
        }
      }

      // Get the best recipe for this slot (highest score with lowest usage)
      availableForDay.sort((a, b) => {
        // First compare usage count
        const usageA = recipeUsageCount[a.id] || 0;
        const usageB = recipeUsageCount[b.id] || 0;

        if (usageA !== usageB) {
          return usageA - usageB; // Prefer recipes used less often
        }

        // Get ingredient counts
        const aIngredients = a.extendedIngredients?.length || 0;
        const bIngredients = b.extendedIngredients?.length || 0;

        // Get already selected recipe ingredients for overlap calculation
        const selectedRecipeIngredients = new Set<string>();
        for (const recipeId of Object.values(recipesUsedPerDay).flatMap(
          (set) => [...set]
        )) {
          const recipe = scoredRecipes.find((r) => r.id === recipeId);
          if (recipe && recipe.extendedIngredients) {
            recipe.extendedIngredients.forEach((ing) => {
              if (ing.name)
                selectedRecipeIngredients.add(ing.name.toLowerCase());
            });
          }
        }

        // Calculate overlap with already selected recipes
        const aOverlap =
          a.extendedIngredients?.filter(
            (ing) =>
              ing.name && selectedRecipeIngredients.has(ing.name.toLowerCase())
          )?.length || 0;

        const bOverlap =
          b.extendedIngredients?.filter(
            (ing) =>
              ing.name && selectedRecipeIngredients.has(ing.name.toLowerCase())
          )?.length || 0;

        // Calculate a combined score that prioritizes:
        // 1. More overlap with existing recipes
        // 2. Fewer total ingredients
        // 3. Higher score (as calculated by scoreRecipes)
        const aEfficiency = aOverlap * 3 - aIngredients + a.score / 10;
        const bEfficiency = bOverlap * 3 - bIngredients + b.score / 10;

        return bEfficiency - aEfficiency;
      });

      const selectedRecipe = availableForDay[0];

      if (selectedRecipe) {
        // Update tracking data
        recipesUsedPerDay[day].add(selectedRecipe.id);
        recipeUsageCount[selectedRecipe.id] =
          (recipeUsageCount[selectedRecipe.id] || 0) + 1;

        console.log(
          `Adding ${
            selectedRecipe.title
          } to day ${day} for ${mealType}, usage count: ${
            recipeUsageCount[selectedRecipe.id]
          }`
        );

        // Add to meal plan
        mealPlan.push({
          dayIndex: day,
          mealType,
          recipeId: selectedRecipe.id,
          reasoning: `Selected based on pantry ingredients and variety`,
        });

        // Move this recipe to the end of the list to promote variety
        allRecipes = [
          ...allRecipes.filter((r) => r.id !== selectedRecipe.id),
          // Return the recipe with a slightly reduced score
          { ...selectedRecipe, score: selectedRecipe.score * 0.85 },
        ];
      }
    }
  }

  // Log final meal plan statistics
  const mealsCreated = mealPlan.length;
  const totalMealsNeeded = 7 * mealsPerDay - existingSelections.length;
  console.log(
    `Optimized meal plan created with ${mealsCreated} meals out of ${totalMealsNeeded} needed`
  );

  // Count unique recipes
  const uniqueRecipeIds = new Set(mealPlan.map((meal) => meal.recipeId));
  console.log(`Found ${uniqueRecipeIds.size} unique recipes in the meal plan`);

  return mealPlan;
}

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

  // Track recipes used on each day to avoid repetition
  const recipesPerDay: Record<number, Set<string>> = {};
  currentMealPlan.forEach((meal) => {
    if (!recipesPerDay[meal.dayIndex]) {
      recipesPerDay[meal.dayIndex] = new Set<string>();
    }
    recipesPerDay[meal.dayIndex].add(meal.recipeId);
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
      const isFavorite = recipe.likes ? recipe.likes > 100 : false; // Simplified check with null check

      // Calculate how many days this recipe appears in the meal plan
      let recipeDayCount = 0;
      Object.values(recipesPerDay).forEach((recipeSet) => {
        if (recipeSet.has(recipe.id)) {
          recipeDayCount++;
        }
      });

      // Penalize recipes that already appear in multiple days
      const repetitionPenalty = Math.pow(recipeDayCount + 1, 2) * 3;

      // Calculate the base score - give more weight to items that will expire soon
      const expiryUrgency =
        numItemsWithExpiry > 0
          ? 15 / Math.max(1, closestToExpiry) // Boost for recipes with soon-to-expire ingredients
          : 0;

      // NEW: Add bonus for recipes with fewer ingredients (to reduce shopping list size)
      const totalIngredientCount = recipeIngredients.length;
      const fewerIngredientsBonus =
        totalIngredientCount === 0 ? 0 : 30 / totalIngredientCount;

      // NEW: Increase overlap bonus significantly to prefer recipes that reuse ingredients
      const overlapPercentage =
        totalIngredientCount === 0
          ? 0
          : overlappingCount / totalIngredientCount;
      const overlapBonus = 20 * overlapPercentage;

      // Modified base score - heavily prioritize using expiring items
      const baseScore =
        (10 / Math.max(1, avgDaysLeft)) * pantryItemsUsed -
        2 * newIngredients +
        expiryUrgency -
        repetitionPenalty +
        fewerIngredientsBonus;

      // Add bonuses
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
          recipeDayCount,
          repetitionPenalty,
          totalIngredientCount,
          fewerIngredientsBonus,
          overlapPercentage,
        },
        calculatedScore: {
          baseScore: parseFloat(baseScore.toFixed(2)),
          overlapBonus: parseFloat(overlapBonus.toFixed(2)),
          totalScore: parseFloat(finalScore.toFixed(2)),
        },
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score in descending order
}
