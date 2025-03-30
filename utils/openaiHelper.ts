import OpenAI from "openai";
import { RecipeIngredient } from "@/types";

// Initialize OpenAI client - use environment variable in production
const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY || "your-api-key-here";

console.log(
  "OpenAI API Key available:",
  OPENAI_API_KEY ? "Yes (length: " + OPENAI_API_KEY.length + ")" : "No"
);

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

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
}

interface OpenAIResponse {
  ingredients?: EnhancedIngredient[];
  [key: string]: any;
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
    // Prepare ingredient data for the prompt
    const ingredientsList = recipeWithIngredients.extendedIngredients
      .map((ing: RecipeIngredient) => {
        if (ing.original) return ing.original;
        return `${ing.name || ing.originalName || ""}`;
      })
      .join("\n");

    console.log("Ingredient list for OpenAI:", ingredientsList);

    // Create the prompt for GPT-4o-mini
    const prompt = `
Recipe: ${recipe.strMeal || recipe.title || "Unknown Recipe"}

Ingredients list: 
${ingredientsList}

I need you to analyze this recipe and extract precise quantities and units for each ingredient.
For ingredients without explicit measurements, please estimate reasonable quantities based on the recipe name and typical cooking standards.

For example:
- "2 large eggs" → amount: 2, unit: "large"
- "1/2 cup flour" → amount: 0.5, unit: "cup" 
- "Salt to taste" → amount: 0.25, unit: "tsp"
- "banana" → amount: 2, unit: "medium"

If the recipe uses measurements like "a handful" or "a pinch", convert to standard units.
Always specify an amount and unit for every ingredient, using your culinary knowledge to make reasonable estimates when measurements are vague or missing.

Return as JSON in this format:
{
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": numeric_value,
      "unit": "unit of measurement"
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
            "You are a professional chef and recipe expert who specializes in parsing recipe ingredients into structured data with precise quantities and units. Always provide specific amounts and units for each ingredient, making reasonable estimates when needed.",
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

      // Instead of trying to match existing ingredients, REPLACE them with OpenAI's ingredients
      const newIngredients: RecipeIngredient[] = enhancedData.ingredients.map(
        (enhanced: EnhancedIngredient, index) => {
          console.log(
            `Adding enhanced ingredient "${enhanced.name}" with amount: ${enhanced.amount}, unit: ${enhanced.unit}`
          );

          return {
            id: `${recipe.idMeal || recipe.id || "unknown"}-ing-${index}`,
            name: enhanced.name,
            originalName: enhanced.name,
            original:
              `${enhanced.amount} ${enhanced.unit} ${enhanced.name}`.trim(),
            amount: enhanced.amount || 1,
            unit: enhanced.unit || "item",
            // Add recipe name to track the source
            recipeName: recipe.strMeal || recipe.title || "Unknown Recipe",
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
