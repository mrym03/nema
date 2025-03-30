import OpenAI from "openai";
import {
  RecipeIngredient,
  FoodItem,
  ShoppingListItem,
  FoodCategory,
} from "@/types";
import { usePantryStore } from "@/store/pantryStore";
import { useShoppingListStore } from "@/store/shoppingListStore";

// Initialize OpenAI client - use environment variable in production
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

console.log(
  "OpenAI API Key available:",
  OPENAI_API_KEY ? "Yes (length: " + OPENAI_API_KEY.length + ")" : "No"
);

// Create OpenAI instance with API key from environment
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Helper function to normalize ingredient names for better matching
export function normalizeIngredientName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      // Remove plurals and common suffixes
      .replace(/s$|es$/, "")
      // Remove filler words
      .replace(
        /\b(fresh|dried|frozen|organic|raw|cooked|diced|sliced|minced|chopped)\b/g,
        ""
      )
      .trim()
  );
}

// Helper function to standardize units for practical shopping
export function standardizeUnit(unit: string, ingredientName?: string): string {
  const normalizedUnit = unit.toLowerCase().trim();

  // Convert cooking measurements to practical retail units
  // First, map common cooking units to their standard forms
  const unitMap: Record<string, string> = {
    // Volume cooking units
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",

    // Weight
    pound: "lb",
    pounds: "lb",
    lbs: "lb",
    ounce: "oz",
    ounces: "oz",
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",

    // Volume
    cup: "cups",
    "fluid ounce": "fl oz",
    "fluid ounces": "fl oz",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    gallon: "gal",
    gallons: "gal",
    quart: "qt",
    quarts: "qt",
    pint: "pt",
    pints: "pt",

    // Count
    piece: "pcs",
    pieces: "pcs",
    slice: "slices",
    can: "cans",
    jar: "jars",
    package: "packages",
    pkg: "packages",
  };

  // First standardize the unit format
  const standardizedUnit = unitMap[normalizedUnit] || normalizedUnit;

  // Get the ingredient name for context-aware unit conversion
  const ingredient = ingredientName ? ingredientName.toLowerCase() : "";

  // Now convert cooking units to practical shopping units
  if (standardizedUnit === "tbsp" || standardizedUnit === "tsp") {
    // For oils, sauces, liquids - convert to fl oz
    if (
      ingredient.includes("oil") ||
      ingredient.includes("sauce") ||
      ingredient.includes("vinegar") ||
      ingredient.includes("syrup") ||
      ingredient.includes("extract")
    ) {
      return "fl oz";
    }

    // For spices, seasonings - convert to oz
    if (
      ingredient.includes("spice") ||
      ingredient.includes("salt") ||
      ingredient.includes("pepper") ||
      ingredient.includes("cumin") ||
      ingredient.includes("paprika") ||
      ingredient.includes("chili") ||
      ingredient.includes("flakes") ||
      ingredient.includes("powder") ||
      ingredient.includes("seasoning")
    ) {
      return "oz";
    }

    // For herbs, leave as is because they're often sold in bunches
    if (
      ingredient.includes("herb") ||
      ingredient.includes("basil") ||
      ingredient.includes("parsley") ||
      ingredient.includes("cilantro") ||
      ingredient.includes("thyme") ||
      ingredient.includes("rosemary") ||
      ingredient.includes("oregano")
    ) {
      return "bunch";
    }
  }

  // Handle common conversions for specific ingredients
  if (
    standardizedUnit === "medium" ||
    standardizedUnit === "large" ||
    standardizedUnit === "small"
  ) {
    if (
      ingredient.includes("onion") ||
      ingredient.includes("apple") ||
      ingredient.includes("potato") ||
      ingredient.includes("tomato") ||
      ingredient.includes("avocado") ||
      ingredient.includes("lemon") ||
      ingredient.includes("lime") ||
      ingredient.includes("orange")
    ) {
      return "pcs";
    }
  }

  return standardizedUnit;
}

// Add a new function to convert cooking measurements to practical shopping quantities
export function convertToPracticalQuantity(
  amount: number,
  unit: string,
  ingredientName: string
): { amount: number; unit: string } {
  const normalizedUnit = unit.toLowerCase().trim();
  const ingredient = ingredientName.toLowerCase();

  // Tablespoon to fluid ounce conversion (1 tbsp = 0.5 fl oz)
  if (
    normalizedUnit === "tbsp" &&
    (ingredient.includes("oil") ||
      ingredient.includes("sauce") ||
      ingredient.includes("vinegar"))
  ) {
    return {
      amount: Math.max(1, Math.ceil(amount * 0.5)),
      unit: "fl oz",
    };
  }

  // Teaspoon to ounce conversion for spices (approximation for shopping)
  if (
    normalizedUnit === "tsp" &&
    (ingredient.includes("spice") ||
      ingredient.includes("salt") ||
      ingredient.includes("pepper") ||
      ingredient.includes("flake"))
  ) {
    // Approximate 1 tsp as 0.1 oz for shopping purposes
    return {
      amount: Math.max(1, Math.ceil(amount * 0.1)),
      unit: "oz",
    };
  }

  // If the amount is very small (less than 1), round up to 1 for practical shopping
  if (amount < 1) {
    return {
      amount: 1,
      unit: unit,
    };
  }

  return { amount, unit };
}

// Function to get existing ingredient information from pantry and shopping list
function getExistingIngredients(): {
  pantryIngredients: { name: string; unit: string }[];
  shoppingIngredients: { name: string; unit: string }[];
} {
  // Get pantry items
  const pantryItems = usePantryStore.getState()?.items || [];

  // Get shopping list items
  const shoppingItems = useShoppingListStore.getState()?.items || [];

  // Format pantry items
  const pantryIngredients = pantryItems.map((item) => ({
    name: item.name,
    unit: item.unit,
  }));

  // Format shopping list items
  const shoppingIngredients = shoppingItems.map((item) => ({
    name: item.name,
    unit: item.unit,
  }));

  return { pantryIngredients, shoppingIngredients };
}

interface RecipeData {
  idMeal?: string;
  strMeal?: string;
  title?: string;
  strIngredient1?: string;
  strIngredient2?: string;
  strIngredient3?: string;
  strIngredient4?: string;
  strIngredient5?: string;
  strIngredient6?: string;
  strIngredient7?: string;
  strIngredient8?: string;
  strIngredient9?: string;
  strIngredient10?: string;
  strIngredient11?: string;
  strIngredient12?: string;
  strIngredient13?: string;
  strIngredient14?: string;
  strIngredient15?: string;
  strIngredient16?: string;
  strIngredient17?: string;
  strIngredient18?: string;
  strIngredient19?: string;
  strIngredient20?: string;
  strMeasure1?: string;
  strMeasure2?: string;
  strMeasure3?: string;
  strMeasure4?: string;
  strMeasure5?: string;
  strMeasure6?: string;
  strMeasure7?: string;
  strMeasure8?: string;
  strMeasure9?: string;
  strMeasure10?: string;
  strMeasure11?: string;
  strMeasure12?: string;
  strMeasure13?: string;
  strMeasure14?: string;
  strMeasure15?: string;
  strMeasure16?: string;
  strMeasure17?: string;
  strMeasure18?: string;
  strMeasure19?: string;
  strMeasure20?: string;
  extendedIngredients?: RecipeIngredient[];
  [key: string]: any;
}

// Convert from TheMealDB format to standardized RecipeIngredient format
export function convertMealDbIngredients(recipe: RecipeData): RecipeData {
  console.log(
    "Converting TheMealDB ingredients for recipe:",
    recipe.strMeal || recipe.title
  );

  // Debug what's available in the recipe object
  console.log(
    "Recipe has these properties:",
    Object.keys(recipe).filter(
      (key) => key.startsWith("strIngredient") || key.startsWith("strMeasure")
    )
  );

  const extendedIngredients: RecipeIngredient[] = [];

  // TheMealDB uses strIngredient1, strIngredient2, etc. format
  for (let i = 1; i <= 20; i++) {
    const name = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];

    console.log(
      `Ingredient ${i}: ${name || "empty"}, Measure: ${measure || "empty"}`
    );

    if (name && name.trim() !== "") {
      extendedIngredients.push({
        id: `${recipe.idMeal || "unknown"}-ing-${i}`,
        name: name.trim(),
        originalName: name.trim(),
        original: `${measure || ""} ${name}`.trim(),
        // We don't have parsed amount/unit yet - these will be added by enhanceRecipeIngredients
        amount: undefined,
        unit: undefined,
      });
    }
  }

  console.log(`Converted ${extendedIngredients.length} ingredients`);

  return {
    ...recipe,
    extendedIngredients,
  };
}

interface EnhancedIngredient {
  name: string;
  amount: number;
  unit: string;
  category?: string;
}

interface OpenAIResponse {
  ingredients?: EnhancedIngredient[];
  [key: string]: any;
}

// Function to convert generic category string to FoodCategory type
function mapToFoodCategory(category: string): FoodCategory {
  const categoryMap: Record<string, FoodCategory> = {
    "Meat & Seafood": category.toLowerCase().includes("seafood")
      ? "seafood"
      : "meat",
    Produce: category.toLowerCase().includes("fruit") ? "fruits" : "vegetables",
    "Dairy & Eggs": "dairy",
    "Bakery & Bread": "bakery",
    "Pantry Staples": category.toLowerCase().includes("spice")
      ? "spices"
      : category.toLowerCase().includes("condiment")
      ? "condiments"
      : category.toLowerCase().includes("can")
      ? "canned"
      : "grains",
    Beverages: "beverages",
    "Frozen Foods": "frozen",
    Other: "other",
  };

  // Find the matching food category or return "other" as default
  for (const [key, value] of Object.entries(categoryMap)) {
    if (category.includes(key)) {
      return value;
    }
  }

  return "other";
}

// Use GPT-4o-mini to enhance recipe ingredients with structured quantities and units
export async function enhanceRecipeIngredients(
  recipe: RecipeData
): Promise<RecipeData> {
  if (!recipe) {
    console.log("No recipe provided to enhanceRecipeIngredients");
    return recipe;
  }

  console.log("Enhancing recipe:", recipe.strMeal || recipe.title);
  console.log("Recipe has extendedIngredients:", !!recipe.extendedIngredients);
  console.log("Recipe has strIngredient1:", !!recipe.strIngredient1);

  // Ensure we have extendedIngredients
  let recipeWithIngredients = recipe;
  if (!recipe.extendedIngredients || recipe.extendedIngredients.length === 0) {
    if (
      recipe.strIngredient1 ||
      recipe.strIngredient2 ||
      recipe.strIngredient3
    ) {
      console.log("Converting TheMealDB format to extendedIngredients");
      recipeWithIngredients = convertMealDbIngredients(recipe);
    } else {
      // If no ingredients are found in either format, add manual fallback ingredients
      console.log(
        "No ingredients found in any format, adding fallback ingredients"
      );
      recipeWithIngredients = {
        ...recipe,
        extendedIngredients: [
          {
            id: "fallback-1",
            name: recipe.strMeal || recipe.title || "Main ingredient",
            originalName: recipe.strMeal || recipe.title || "Main ingredient",
            original: recipe.strMeal || recipe.title || "Main ingredient",
            amount: 1,
            unit: "serving",
          },
        ],
      };
    }
  }

  // If there are no ingredients, return the original recipe
  if (
    !recipeWithIngredients.extendedIngredients ||
    recipeWithIngredients.extendedIngredients.length === 0
  ) {
    console.log(
      "Still no ingredients after conversion, returning original recipe"
    );
    return recipe;
  }

  console.log(
    `Found ${recipeWithIngredients.extendedIngredients.length} ingredients to enhance`
  );

  try {
    // Get existing ingredients from pantry and shopping list for context
    const { pantryIngredients, shoppingIngredients } = getExistingIngredients();

    // Prepare ingredient data for the prompt
    const ingredientsList = recipeWithIngredients.extendedIngredients
      .map((ing: RecipeIngredient) => {
        if (ing.original) return ing.original;
        return `${ing.name || ing.originalName || ""}`;
      })
      .join("\n");

    console.log("Ingredient list for OpenAI:", ingredientsList);

    // Format existing ingredients for the prompt
    const existingIngredientsInfo = [
      ...pantryIngredients.map((item) => `${item.name} (unit: ${item.unit})`),
      ...shoppingIngredients.map((item) => `${item.name} (unit: ${item.unit})`),
    ].join("\n");

    // Create the prompt for GPT-4o-mini with context about existing ingredients
    const prompt = `
Recipe: ${recipe.strMeal || recipe.title || "Unknown Recipe"}

Ingredients list: 
${ingredientsList}

I need you to analyze this recipe and extract precise quantities and units for each ingredient.
For ingredients without explicit measurements, please estimate reasonable quantities based on the recipe name and typical cooking standards.

IMPORTANT: Below are ingredients that already exist in the user's pantry or shopping list. 
When parsing ingredients from the recipe, use the EXACT SAME NAME and UNIT for any matching ingredients:
${existingIngredientsInfo}

Guidelines:
1. Use singular form for ingredient names (e.g., "banana" not "bananas") for consistency
2. Use standardized units OPTIMIZED FOR SHOPPING, not just cooking:
   - For produce: use "lb", "oz", or "pcs" (pieces) instead of "medium" or "large"
   - For liquids: use "fl oz" or "cups" instead of "tbsp" or "tsp"
   - For spices: use "oz" instead of "tsp" when possible
   - For packaged goods: use "packages", "cans", or "jars"
3. For ingredients already in the pantry/shopping list, match their exact name and unit
4. Be consistent with units for the same ingredient (don't use "cups" and "oz" for the same ingredient)
5. Make sure the quantities make sense for SHOPPING purposes (not just recipe amounts)
6. Assign each ingredient to one of these categories:
   - "Meat & Seafood" (beef, chicken, fish, etc.)
   - "Produce" (fruits, vegetables, herbs)
   - "Dairy & Eggs" (milk, cheese, yogurt, eggs)
   - "Bakery & Bread" (bread, bagels, pastries)
   - "Pantry Staples" (rice, pasta, oil, spices, canned goods)
   - "Beverages" (water, juice, soda, coffee)
   - "Frozen Foods" (ice cream, frozen vegetables)
   - "Other" (anything that doesn't fit above)

For example:
- "2 large eggs" → name: "egg", amount: 12, unit: "pcs", category: "Dairy & Eggs" (eggs are sold by the dozen)
- "1/2 cup flour" → name: "flour", amount: 8, unit: "oz", category: "Pantry Staples" (converted to ounces for shopping)
- "Salt to taste" → name: "salt", amount: 1, unit: "oz", category: "Pantry Staples" (minimal practical amount)
- "2 tbsp olive oil" → name: "olive oil", amount: 8, unit: "fl oz", category: "Pantry Staples" (smallest practical bottle)
- "3 medium onions" → name: "onion", amount: 3, unit: "pcs", category: "Produce" (how they're sold)

Return as JSON in this format:
{
  "ingredients": [
    {
      "name": "ingredient name (singular form)",
      "amount": numeric_value,
      "unit": "unit of measurement (standardized for shopping)",
      "category": "category from the list above"
    },
    ...
  ]
}`;

    console.log("Sending request to OpenAI for ingredient parsing...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional chef and recipe expert who specializes in parsing recipe ingredients into structured data with precise quantities and units. You aim for consistency across ingredients, ensuring the same ingredients use the same name format (singular form) and unit measurements across recipes.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    // Parse enhanced ingredients
    const content = response.choices[0].message.content;
    console.log("Received OpenAI response:", content);

    let enhancedData: OpenAIResponse;
    try {
      enhancedData = JSON.parse(content as string);
      console.log("Parsed JSON data:", JSON.stringify(enhancedData));
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", e);
      // Add default data if parsing fails
      enhancedData = {
        ingredients: recipeWithIngredients.extendedIngredients.map((ing) => ({
          name: ing.name || ing.originalName || "Ingredient",
          amount: 1,
          unit: "serving",
        })),
      };
    }

    // Update recipe ingredients with AI-generated data
    if (enhancedData.ingredients && Array.isArray(enhancedData.ingredients)) {
      console.log(
        `Got ${enhancedData.ingredients.length} enhanced ingredients from OpenAI`
      );

      // Process and standardize the ingredients
      const newIngredients: RecipeIngredient[] = enhancedData.ingredients.map(
        (enhanced: EnhancedIngredient, index) => {
          // Standardize the unit for consistency
          const standardizedUnit = standardizeUnit(
            enhanced.unit || "item",
            enhanced.name
          );

          // Map the category string to FoodCategory type
          const foodCategory = mapToFoodCategory(enhanced.category || "Other");

          console.log(
            `Adding enhanced ingredient "${enhanced.name}" with amount: ${enhanced.amount}, unit: ${standardizedUnit}, category: ${foodCategory}`
          );

          return {
            id: `${recipe.idMeal || recipe.id || "unknown"}-ing-${index}`,
            name: enhanced.name,
            originalName: enhanced.name,
            original:
              `${enhanced.amount} ${standardizedUnit} ${enhanced.name}`.trim(),
            amount: enhanced.amount || 1,
            unit: standardizedUnit,
            // Add recipe name to track the source
            recipeName: recipe.strMeal || recipe.title || "Unknown Recipe",
            // Add food category
            category: foodCategory,
          };
        }
      );

      // Replace the ingredients list entirely
      recipeWithIngredients.extendedIngredients = newIngredients;

      console.log(
        `Replaced ingredients with ${newIngredients.length} AI-generated ingredients`
      );
    } else if (recipeWithIngredients.extendedIngredients) {
      // If OpenAI fails to provide structured data, add default values
      console.log("No ingredients array in OpenAI response, using defaults");
      recipeWithIngredients.extendedIngredients =
        recipeWithIngredients.extendedIngredients.map(
          (ing: RecipeIngredient) => ({
            ...ing,
            amount: 1,
            unit: "serving",
            recipeName: recipe.strMeal || recipe.title || "Unknown Recipe",
          })
        );
    }

    console.log(
      `Returning recipe with ${recipeWithIngredients.extendedIngredients.length} enhanced ingredients`
    );
    return recipeWithIngredients;
  } catch (error) {
    console.error("Error enhancing recipe ingredients:", error);

    // Make sure we return a recipe with some ingredients even if OpenAI fails
    if (recipeWithIngredients.extendedIngredients) {
      recipeWithIngredients.extendedIngredients =
        recipeWithIngredients.extendedIngredients.map(
          (ing: RecipeIngredient) => ({
            ...ing,
            amount: 1,
            unit: "serving",
          })
        );
    }

    return recipeWithIngredients; // Return the original recipe with basic parsed ingredients
  }
}
