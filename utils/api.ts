import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { FoodItem, ShoppingListItem, Recipe } from "@/types";

// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "zero-waste-pantry.firebaseapp.com",
  projectId: "zero-waste-pantry",
  storageBucket: "zero-waste-pantry.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
};

// Spoonacular API for recipes
const SPOONACULAR_API_KEY = "a4bc0ef0cd194e07b1936f695397ac29";
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

// UPC database API for barcode scanning
const UPC_DATABASE_API_KEY = "E08F735364A32F6FAFC0C06F803E0B9D";
const UPC_DATABASE_BASE_URL = "https://api.upcdatabase.org/product";

// Development mode flag - true if using placeholder Supabase credentials
const DEV_MODE = true; // Temporarily using development mode until Supabase tables are created

// Firebase initialization would normally happen here
// For now, we'll simulate Firebase with AsyncStorage

// Recipe API functions
export const fetchRecipesByIngredients = async (
  ingredients: string[],
  dietaryPreferences: string[] = [],
  cuisinePreferences: string[] = []
) => {
  try {
    if (ingredients.length === 0) {
      console.log("No ingredients provided, returning empty results");
      return [];
    }

    const ingredientsString = ingredients.join(",");
    console.log(`Fetching recipes for ingredients: ${ingredientsString}`);

    // Build query parameters
    const params = new URLSearchParams();

    // Add API key
    params.append("apiKey", SPOONACULAR_API_KEY);

    // Use complex search instead of findByIngredients for better filtering
    params.append("includeIngredients", ingredientsString);
    params.append("fillIngredients", "true"); // Get details about used/missed ingredients
    params.append("addRecipeInformation", "true"); // Get full recipe details
    params.append("sort", "max-used-ingredients"); // Sort by maximum used ingredients
    params.append("number", "10"); // Limit to 10 recipes

    // Apply dietary preferences if provided
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      params.append("diet", dietaryPreferences.join(","));
      console.log(`Applied dietary filters: ${dietaryPreferences.join(",")}`);
    }

    // Apply cuisine preferences if provided
    if (cuisinePreferences && cuisinePreferences.length > 0) {
      params.append("cuisine", cuisinePreferences.join(","));
      console.log(`Applied cuisine filters: ${cuisinePreferences.join(",")}`);
    }

    // Use the complexSearch endpoint for better filtering
    const searchUrl = `${SPOONACULAR_BASE_URL}/recipes/complexSearch?${params.toString()}`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      // Check specifically for quota exceeded error
      if (response.status === 402) {
        console.log("API quota exceeded (402) - using mock data instead");
        throw new Error("API_QUOTA_EXCEEDED");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const searchResults = await response.json();

    if (!searchResults.results || searchResults.results.length === 0) {
      console.log("No recipes found for the given ingredients and preferences");
      return [];
    }

    console.log(
      `Found ${searchResults.results.length} recipes matching criteria`
    );

    // Transform the data to match our Recipe type
    return searchResults.results.map((recipe: any) => ({
      id: recipe.id.toString(),
      title: recipe.title,
      imageUrl: recipe.image, // Image URL from API
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 4,
      sourceUrl: recipe.sourceUrl || "",
      summary: recipe.summary || "",
      usedIngredientCount: recipe.usedIngredientCount || 0,
      missedIngredientCount: recipe.missedIngredientCount || 0,
      likes: recipe.aggregateLikes || 0,
    }));
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
};

// Get detailed information for a specific recipe
export const getRecipeDetails = async (recipeId: string) => {
  try {
    const url = `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error("API_QUOTA_EXCEEDED");
      }
      throw new Error(`API error: ${response.status}`);
    }

    const recipeDetails = await response.json();

    return {
      id: recipeDetails.id.toString(),
      title: recipeDetails.title,
      imageUrl: recipeDetails.image,
      readyInMinutes: recipeDetails.readyInMinutes || 30,
      servings: recipeDetails.servings || 4,
      sourceUrl: recipeDetails.sourceUrl || "",
      summary: recipeDetails.summary || "",
      instructions: recipeDetails.instructions || "",
      extendedIngredients: recipeDetails.extendedIngredients || [],
      usedIngredientCount: 0, // These will be filled in by the calling code
      missedIngredientCount: 0,
      likes: recipeDetails.aggregateLikes || 0,
    };
  } catch (error) {
    console.error(`Error fetching details for recipe ${recipeId}:`, error);
    throw error;
  }
};

// Barcode lookup function
export const lookupBarcodeUPC = async (barcode: string) => {
  try {
    const response = await fetch(
      `${UPC_DATABASE_BASE_URL}/${barcode}?apikey=${UPC_DATABASE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error looking up barcode:", error);
    throw error;
  }
};

// Supabase data functions
// User management
export const signUpUser = async (email: string, password: string) => {
  if (__DEV__) {
    console.log("DEV MODE: Simulating signup success");
    // Simulate successful signup for development
    return {
      user: {
        id: "dev-user-id",
        email: email,
      },
      session: {
        access_token: "fake-token",
        refresh_token: "fake-refresh-token",
        user: {
          id: "dev-user-id",
          email: email,
        },
      },
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signInUser = async (email: string, password: string) => {
  // Check for specific admin credentials
  if (email === "admin" && password === "pass") {
    console.log("Admin login successful");
    return {
      user: {
        id: "admin-user-id",
        email: email,
      },
      session: {
        access_token: "admin-token",
        refresh_token: "admin-refresh-token",
        user: {
          id: "admin-user-id",
          email: email,
        },
      },
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  if (__DEV__) {
    console.log("DEV MODE: Simulating signout success");
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Pantry management
export const syncPantryToCloud = async (
  userId: string,
  pantryItems: FoodItem[]
) => {
  if (DEV_MODE) {
    // In dev mode, just store locally
    console.log("DEV MODE: Storing pantry items locally");
    await AsyncStorage.setItem(`pantry_${userId}`, JSON.stringify(pantryItems));
    return true;
  }

  try {
    // First, remove all existing items for this user
    const { error: deleteError } = await supabase
      .from("pantry_items")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Then insert all current items
    if (pantryItems.length > 0) {
      const itemsWithUser = pantryItems.map((item) => ({
        ...item,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from("pantry_items")
        .insert(itemsWithUser);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    // Fallback to local storage if Supabase fails
    console.error("Error syncing pantry to Supabase:", error);
    await AsyncStorage.setItem(`pantry_${userId}`, JSON.stringify(pantryItems));
    return false;
  }
};

export const fetchPantryFromCloud = async (userId: string) => {
  if (DEV_MODE) {
    // In dev mode, just get from local storage
    console.log("DEV MODE: Getting pantry items from local storage");
    const localData = await AsyncStorage.getItem(`pantry_${userId}`);
    return localData ? JSON.parse(localData) : [];
  }

  try {
    const { data, error } = await supabase
      .from("pantry_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    return data as FoodItem[];
  } catch (error) {
    console.error("Error fetching pantry from Supabase:", error);
    // Fallback to local storage
    const localData = await AsyncStorage.getItem(`pantry_${userId}`);
    return localData ? JSON.parse(localData) : [];
  }
};

// Shopping list management
export const syncShoppingListToCloud = async (
  userId: string,
  items: ShoppingListItem[]
) => {
  if (DEV_MODE) {
    // In dev mode, just store locally
    console.log("DEV MODE: Storing shopping list items locally");
    await AsyncStorage.setItem(
      `shopping_list_${userId}`,
      JSON.stringify(items)
    );
    return true;
  }

  try {
    // First, remove all existing items for this user
    const { error: deleteError } = await supabase
      .from("shopping_list_items")
      .delete()
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    // Then insert all current items
    if (items.length > 0) {
      const itemsWithUser = items.map((item) => ({
        ...item,
        user_id: userId,
      }));

      const { error: insertError } = await supabase
        .from("shopping_list_items")
        .insert(itemsWithUser);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    // Fallback to local storage if Supabase fails
    console.error("Error syncing shopping list to Supabase:", error);
    await AsyncStorage.setItem(
      `shopping_list_${userId}`,
      JSON.stringify(items)
    );
    return false;
  }
};

export const fetchShoppingListFromCloud = async (userId: string) => {
  if (DEV_MODE) {
    // In dev mode, just get from local storage
    console.log("DEV MODE: Getting shopping list items from local storage");
    const localData = await AsyncStorage.getItem(`shopping_list_${userId}`);
    return localData ? JSON.parse(localData) : [];
  }

  try {
    const { data, error } = await supabase
      .from("shopping_list_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    return data as ShoppingListItem[];
  } catch (error) {
    console.error("Error fetching shopping list from Supabase:", error);
    // Fallback to local storage
    const localData = await AsyncStorage.getItem(`shopping_list_${userId}`);
    return localData ? JSON.parse(localData) : [];
  }
};

// Firebase-like functions using AsyncStorage for now
export const saveUserData = async (userId: string, data: any) => {
  try {
    await AsyncStorage.setItem(`user_${userId}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
};

export const getUserData = async (userId: string) => {
  try {
    const data = await AsyncStorage.getItem(`user_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};
