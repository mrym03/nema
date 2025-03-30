import { Recipe } from "@/types";
import { mockRecipes } from "@/mocks/recipes";

// TheMealDB API configuration
const THEMEALDB_API_KEY = "1"; // Using the test API key "1" for development
const THEMEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// Retry configuration
const MAX_RETRIES = 4; // Increase max retries
const RETRY_DELAY = 2000; // Increase delay to 2 seconds
const INCREASING_DELAY = true; // Use increasing delays between retries

// Helper function to delay execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API calls with retries
async function fetchWithRetry(url: string, retries = MAX_RETRIES, attempt = 1): Promise<any> {
  try {
    // Add a small random delay before each request to avoid simultaneous hits
    const initialDelay = Math.random() * 500;
    await wait(initialDelay);
    
    const response = await fetch(url);
    
    // Handle rate limit
    if (response.status === 429) {
      if (retries > 0) {
        // Calculate delay - use increasing delays if enabled
        const currentDelay = INCREASING_DELAY ? RETRY_DELAY * attempt : RETRY_DELAY;
        
        console.log(`Rate limited (429), retrying in ${currentDelay}ms... (${retries} retries left)`);
        await wait(currentDelay);
        return fetchWithRetry(url, retries - 1, attempt + 1);
      } else {
        console.log('Maximum retries reached for rate limit, using fallback data');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }
    
    // Handle other errors
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    if (retries > 0 && error.message !== 'Rate limit exceeded. Please try again later.') {
      // Calculate delay with increasing backoff
      const currentDelay = INCREASING_DELAY ? RETRY_DELAY * attempt : RETRY_DELAY;
      
      console.log(`API request failed, retrying in ${currentDelay}ms... (${retries} retries left)`);
      await wait(currentDelay);
      return fetchWithRetry(url, retries - 1, attempt + 1);
    }
    throw error;
  }
}

/**
 * Simplifies ingredient names to work better with TheMealDB search
 */
export const simplifyIngredient = (ingredient: string): string => {
  const lowerIng = ingredient.toLowerCase();

  // Common simplifications for better API matching
  if (lowerIng.includes("chicken breast")) return "chicken";
  if (lowerIng.includes("beef")) return "beef";
  if (lowerIng.includes("tomato")) return "tomato";
  if (lowerIng.includes("spinach")) return "spinach";
  if (lowerIng.includes("avocado")) return "avocado";
  if (lowerIng.includes("pepper")) return "pepper";
  if (lowerIng.includes("onion")) return "onion";
  if (lowerIng.includes("garlic")) return "garlic";
  if (lowerIng.includes("potato")) return "potato";
  if (lowerIng.includes("carrot")) return "carrot";
  if (lowerIng.includes("broccoli")) return "broccoli";
  if (lowerIng.includes("rice")) return "rice";
  if (lowerIng.includes("pasta")) return "pasta";
  if (lowerIng.includes("cheese")) return "cheese";

  // For other cases, remove plurals and common modifiers
  return lowerIng
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/s$/, "") // Remove trailing 's' (plurals)
    .replace(/_fresh$/, "") // Remove '_fresh'
    .replace(/_ripe$/, ""); // Remove '_ripe'
};

/**
 * Improved function to increase ingredient matching success rate
 * Makes ingredient comparisons more lenient to find more matches
 */
const ingredientsMatch = (
  recipeIngredient: string,
  pantryIngredient: string
): boolean => {
  if (!recipeIngredient || !pantryIngredient) return false;

  const recipeIng = recipeIngredient.toLowerCase().trim();
  const pantryIng = pantryIngredient.toLowerCase().trim();

  // Direct match or substring match
  if (
    recipeIng === pantryIng ||
    recipeIng.includes(pantryIng) ||
    pantryIng.includes(recipeIng)
  ) {
    return true;
  }

  // Handle plural forms
  if (recipeIng.endsWith("s") && recipeIng.slice(0, -1) === pantryIng) {
    return true;
  }
  if (pantryIng.endsWith("s") && pantryIng.slice(0, -1) === recipeIng) {
    return true;
  }

  // Handle common ingredient variations
  const commonVariations: { [key: string]: string[] } = {
    chicken: [
      "poultry",
      "hen",
      "fowl",
      "chicken breast",
      "chicken thigh",
      "chicken wing",
    ],
    beef: ["steak", "ground beef", "meat", "chuck", "sirloin"],
    pork: ["ham", "bacon", "sausage", "meat"],
    fish: ["salmon", "tuna", "cod", "tilapia", "seafood"],
    onion: ["shallot", "scallion", "spring onion", "green onion"],
    potato: ["spud", "sweet potato", "yam"],
    tomato: ["cherry tomato", "grape tomato", "roma tomato"],
    pepper: ["bell pepper", "chili pepper", "jalapeno"],
    rice: ["basmati", "jasmine rice", "brown rice"],
    pasta: ["spaghetti", "noodle", "macaroni", "penne", "fettuccine"],
  };

  // Check if either ingredient is a variation of the other
  for (const [base, variations] of Object.entries(commonVariations)) {
    if (recipeIng === base || variations.some((v) => recipeIng.includes(v))) {
      if (pantryIng === base || variations.some((v) => pantryIng.includes(v))) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Fetches recipes from TheMealDB API based on user preferences,
 * then sorts them to prioritize recipes that use pantry ingredients
 */
export const fetchRecipesByIngredients = async (
  pantryIngredients: string[],
  dietaryPreferences: string[] = [],
  cuisinePreferences: string[] = []
): Promise<Recipe[]> => {
  try {
    console.log("Pantry ingredients:", pantryIngredients);
    console.log("Dietary preferences:", dietaryPreferences);
    console.log("Cuisine preferences:", cuisinePreferences);

    // Start by collecting a variety of recipes - not just filtering by pantry ingredients
    let allMeals: any[] = [];
    const uniqueMealIds = new Set<string>();

    // ----------- FETCH RECIPES FROM MULTIPLE SOURCES -------------

    // 1. Get recipes by cuisine first (if user has cuisine preferences)
    if (cuisinePreferences && cuisinePreferences.length > 0) {
      // TheMealDB uses capitalized area names
      const standardizedCuisines = cuisinePreferences.map((cuisine) => {
        const formatted =
          cuisine.charAt(0).toUpperCase() + cuisine.slice(1).toLowerCase();
        return formatted;
      });

      for (const cuisine of standardizedCuisines) {
        try {
          console.log(`Searching for recipes with cuisine: ${cuisine}`);
          const url = `${THEMEALDB_BASE_URL}/filter.php?a=${cuisine}`;
          const searchResults = await fetchWithRetry(url);

          if (!searchResults.meals) {
            console.log(`No meals found for cuisine: ${cuisine}`);
            continue;
          }

          console.log(
            `Found ${searchResults.meals.length} recipes for ${cuisine}`
          );

          // Add unique meals
          for (const meal of searchResults.meals) {
            if (!uniqueMealIds.has(meal.idMeal)) {
              uniqueMealIds.add(meal.idMeal);
              allMeals.push(meal);
            }
          }
        } catch (err) {
          console.error(`Error searching with cuisine ${cuisine}:`, err);
        }
      }
    }

    // 2. Always get recipes from main categories regardless of how many we already have
    // This ensures we get a good variety of recipes
    const categories = [
      "Chicken",
      "Beef",
      "Vegetarian",
      "Pasta",
      "Seafood",
      "Breakfast",
      "Dessert",
      "Side",
      "Starter",
    ];

    // Filter categories based on user preferences
    const selectedCategories = dietaryPreferences
      .filter((pref) =>
        [
          "breakfast",
          "pasta",
          "seafood",
          "dessert",
          "side",
          "starter",
        ].includes(pref)
      )
      .map((pref) => pref.charAt(0).toUpperCase() + pref.slice(1));

    // Always check for vegetarian/vegan categories separately
    const hasVegetarian = dietaryPreferences.includes("vegetarian");
    const hasVegan = dietaryPreferences.includes("vegan");

    // If user selected specific categories, use those instead of the default list
    const categoriesToSearch =
      selectedCategories.length > 0 ? selectedCategories : categories;

    for (const category of categoriesToSearch) {
      // Skip categories that don't match dietary preferences
      if (
        hasVegetarian &&
        (category === "Chicken" ||
          category === "Beef" ||
          category === "Seafood")
      ) {
        continue;
      }

      try {
        console.log(`Searching for recipes in category: ${category}`);
        const url = `${THEMEALDB_BASE_URL}/filter.php?c=${category}`;
        const searchResults = await fetchWithRetry(url);

        if (!searchResults.meals) continue;

        console.log(
          `Found ${searchResults.meals.length} recipes for category ${category}`
        );

        // Add unique meals
        for (const meal of searchResults.meals) {
          if (!uniqueMealIds.has(meal.idMeal)) {
            uniqueMealIds.add(meal.idMeal);
            allMeals.push(meal);
          }
        }
      } catch (err) {
        console.error(`Error searching in category ${category}:`, err);
      }
    }

    // 3. Also try pantry ingredients if we have any
    if (pantryIngredients.length > 0) {
      // Try up to 5 ingredients to avoid too many API calls but improve matches
      const ingredientsToTry = pantryIngredients.slice(0, 5);

      for (const ingredient of ingredientsToTry) {
        try {
          // Simplify the ingredient for better matching with TheMealDB
          const simplifiedIngredient = simplifyIngredient(ingredient);
          console.log(
            `Searching for recipes with ingredient: ${simplifiedIngredient}`
          );

          const url = `${THEMEALDB_BASE_URL}/filter.php?i=${simplifiedIngredient}`;
          const searchResults = await fetchWithRetry(url);

          if (!searchResults.meals) {
            console.log(`No meals found for ingredient: ${simplifiedIngredient}`);
            continue;
          }

          console.log(
            `Found ${searchResults.meals.length} recipes for ${simplifiedIngredient}`
          );

          // Add unique meals
          for (const meal of searchResults.meals) {
            if (!uniqueMealIds.has(meal.idMeal)) {
              uniqueMealIds.add(meal.idMeal);
              allMeals.push(meal);
            }
          }
        } catch (err) {
          console.error(`Error searching with ingredient ${ingredient}:`, err);
        }
      }
    }

    console.log(`Total recipes found before filtering: ${allMeals.length}`);

    // If we still don't have any meals, return mock data
    if (allMeals.length === 0) {
      console.log("No meals found via API, using mock data");
      return mockRecipes;
    }

    // Fetch full details for each meal to get ingredient lists for filtering and matching
    let detailedMeals = [];

    // Process more meals - increase from 50 to 100
    const mealsToProcess = allMeals.slice(0, 100);

    const mealPromises = mealsToProcess.map(async (meal: any) => {
      try {
        const detailsUrl = `${THEMEALDB_BASE_URL}/lookup.php?i=${meal.idMeal}`;
        const detailsResponse = await fetch(detailsUrl);
        if (!detailsResponse.ok) return null;

        const mealDetails = await detailsResponse.json();
        return mealDetails.meals ? mealDetails.meals[0] : null;
      } catch (err) {
        console.error(`Error fetching details for meal ${meal.idMeal}:`, err);
        return null;
      }
    });

    // Execute all promises and filter out null results
    detailedMeals = (await Promise.all(mealPromises)).filter(
      (meal) => meal !== null
    );

    console.log(
      `Successfully fetched details for ${detailedMeals.length} meals`
    );

    // Filter by dietary preferences if specified, but be less strict
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      // Some common non-vegetarian/non-vegan ingredients
      const nonVegIngredients = [
        "chicken",
        "beef",
        "pork",
        "meat",
        "fish",
        "seafood",
        "lamb",
      ];
      const dairyIngredients = ["milk", "cheese", "cream", "yogurt", "butter"];

      const filteredByDiet = detailedMeals.filter((meal) => {
        const mealIngredients: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = meal[`strIngredient${i}`];
          if (ingredient && ingredient.trim()) {
            mealIngredients.push(ingredient.toLowerCase());
          }
        }

        // Only filter by dietary preference if it's set
        if (dietaryPreferences.includes("vegetarian")) {
          if (
            mealIngredients.some((ing) =>
              nonVegIngredients.some((nonVeg) => ing.includes(nonVeg))
            )
          ) {
            return false;
          }
        }

        if (dietaryPreferences.includes("vegan")) {
          if (
            mealIngredients.some(
              (ing) =>
                nonVegIngredients.some((nonVeg) => ing.includes(nonVeg)) ||
                dairyIngredients.some((dairy) => ing.includes(dairy))
            )
          ) {
            return false;
          }
        }

        return true;
      });

      // Only apply dietary filtering if we still have enough results
      if (filteredByDiet.length >= 10) {
        detailedMeals = filteredByDiet;
        console.log(`After dietary filtering: ${detailedMeals.length} meals`);
      } else {
        console.log(
          "Dietary filtering would leave too few meals, skipping exact filtering"
        );
      }
    }

    // Calculate matching pantry ingredients for each recipe with improved matching
    detailedMeals = detailedMeals.map((meal) => {
      const mealIngredients: string[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        if (ingredient && ingredient.trim()) {
          mealIngredients.push(ingredient.toLowerCase());
        }
      }

      let usedCount = 0;
      if (pantryIngredients.length > 0) {
        // For each pantry ingredient, check if it matches any recipe ingredient
        pantryIngredients.forEach((pantryIng) => {
          if (pantryIng && pantryIng.trim()) {
            // Use our improved matching function
            if (
              mealIngredients.some((recipeIng) =>
                ingredientsMatch(recipeIng, pantryIng)
              )
            ) {
              usedCount++;
            }
          }
        });
      }

      return {
        ...meal,
        usedIngredientCount: usedCount,
        missedIngredientCount: mealIngredients.length - usedCount,
      };
    });

    // Sort recipes - prioritize those with more pantry ingredients
    detailedMeals.sort((a, b) => b.usedIngredientCount - a.usedIngredientCount);

    console.log(`Final recipe count: ${detailedMeals.length}`);

    // Transform the data to match our Recipe type
    return detailedMeals.map((meal: any) => ({
      id: meal.idMeal.toString(),
      title: meal.strMeal,
      imageUrl: meal.strMealThumb,
      readyInMinutes: 30, // TheMealDB doesn't provide preparation time, using default
      servings: 4, // TheMealDB doesn't provide servings, using default
      sourceUrl: meal.strSource || meal.strYoutube || "",
      summary: meal.strInstructions
        ? meal.strInstructions.slice(0, 150) + "..."
        : "",
      usedIngredientCount: meal.usedIngredientCount || 0,
      missedIngredientCount: meal.missedIngredientCount || 0,
      likes: 0, // TheMealDB doesn't have likes feature
    }));
  } catch (error) {
    console.error("Error fetching recipes:", error);
    // Fallback to mock data in case of any error
    console.log("Falling back to mock data due to error");
    return mockRecipes;
  }
};

// Add a cache for recipe details
const recipeDetailsCache: Record<string, any> = {};

// Update the getRecipeDetails function to use cache
export const getRecipeDetails = async (recipeId: string): Promise<any> => {
  try {
    // Check cache first
    if (recipeDetailsCache[recipeId]) {
      console.log(`Using cached details for recipe ${recipeId}`);
      return recipeDetailsCache[recipeId];
    }
    
    console.log(`Fetching details for recipe ${recipeId}`);
    
    // Use retry mechanism
    const url = `${THEMEALDB_BASE_URL}/lookup.php?i=${recipeId}`;
    const data = await fetchWithRetry(url);

    if (!data.meals || data.meals.length === 0) {
      throw new Error(`Recipe with ID ${recipeId} not found`);
    }

    const mealDetail = data.meals[0];

    // Parse ingredients and measurements from TheMealDB format
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = mealDetail[`strIngredient${i}`];
      const measure = mealDetail[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          amount: measure ? measure.trim() : "",
          original: `${measure ? measure.trim() : ""} ${ingredient.trim()}`,
        });
      }
    }

    // Create a recipe object with the data structure we need
    const recipe: Recipe = {
      id: mealDetail.idMeal,
      title: mealDetail.strMeal,
      imageUrl: mealDetail.strMealThumb,
      readyInMinutes: 30, // TheMealDB doesn't provide this, so we set a default
      servings: parseInt(mealDetail.strYield) || 4, // Use yield if available or default to 4
      sourceUrl: mealDetail.strSource || "",
      summary: mealDetail.strInstructions
        ? mealDetail.strInstructions.split(".").slice(0, 2).join(".") + "."
        : "",
      instructions: mealDetail.strInstructions || "",
      extendedIngredients: ingredients,
      usedIngredientCount: 0, // Set later when filtering
      missedIngredientCount: 0, // Set later when filtering
      likes: 0, // TheMealDB doesn't have this concept
      // Add dietary flags based on category and tags
      vegetarian: mealDetail.strCategory === "Vegetarian",
      vegan: mealDetail.strTags?.toLowerCase().includes("vegan") || false,
      glutenFree: mealDetail.strTags?.toLowerCase().includes("gluten free") || false,
      dairyFree: mealDetail.strTags?.toLowerCase().includes("dairy free") || false,
      diets: mealDetail.strTags ? mealDetail.strTags.split(",").map((tag: string) => tag.trim()) : [],
    };
    
    // Cache the result
    recipeDetailsCache[recipeId] = recipe;

    return recipe;
  } catch (error) {
    console.error(`Error fetching details for recipe ${recipeId}:`, error);
    throw error;
  }
};
