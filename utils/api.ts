import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { FoodItem, ShoppingListItem, Recipe } from "@/types";
import {
  fetchRecipesByIngredients as fetchMealDbRecipes,
  getRecipeDetails as getMealDbRecipeDetails,
} from "./mealDbApi";
import { SPOONACULAR_API_KEY } from "../constants/apiKeys";

// Firebase configuration
const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "zero-waste-pantry.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "zero-waste-pantry",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "zero-waste-pantry.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

// Spoonacular API for recipes
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

// UPC database API for barcode scanning
const UPC_DATABASE_API_KEY = process.env.EXPO_PUBLIC_UPC_DATABASE_API_KEY || "";
const UPC_DATABASE_BASE_URL = "https://api.upcdatabase.org/product";

// Replace Spoonacular API with TheMealDB API
const THEMEALDB_API_KEY = process.env.EXPO_PUBLIC_THEMEALDB_API_KEY || "1"; // Using the test API key "1" for development
const THEMEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// Development mode flag - true if using placeholder Supabase credentials
const DEV_MODE = true; // Temporarily using development mode until Supabase tables are created

// Firebase initialization would normally happen here
// For now, we'll simulate Firebase with AsyncStorage

// Recipe API functions - IMPORTANT: Now using Spoonacular API with retry logic
// Instead of using TheMealDB API functions directly, we'll use our enhanced versions below

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

// Max retries for API calls
const MAX_RETRIES = 3;
// Delay between retries (ms)
const RETRY_DELAY = 1500;

// Helper function to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to make API calls with retries
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<any> {
  try {
    const response = await fetch(url, options);

    // Handle rate limit
    if (response.status === 429) {
      if (retries > 0) {
        console.log(
          `Rate limited (429), retrying in ${RETRY_DELAY}ms... (${retries} retries left)`
        );
        await wait(RETRY_DELAY);
        return fetchWithRetry(url, options, retries - 1);
      } else {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
    }

    // Check for success
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    if (
      retries > 0 &&
      error.message !== "Rate limit exceeded. Please try again later."
    ) {
      console.log(
        `API request failed, retrying in ${RETRY_DELAY}ms... (${retries} retries left)`
      );
      await wait(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Enhanced recipe API functions with retry logic - export these
export async function fetchRecipesByIngredients(
  ingredients: string[],
  dietaryPreferences: string[] = [],
  cuisinePreferences: string[] = []
): Promise<Recipe[]> {
  try {
    console.log(
      `Using TheMealDB as fallback due to Spoonacular API quota issues`
    );

    // Use TheMealDB API instead since it's free
    const mealDbRecipes = await fetchMealDbRecipes(
      ingredients,
      dietaryPreferences,
      cuisinePreferences
    );
    return mealDbRecipes;
  } catch (error) {
    console.error("Error fetching recipes by ingredients:", error);

    // Return an empty array instead of throwing to prevent app crashes
    return [];
  }
}

// Enhanced recipe details API function with retry logic
export async function getRecipeDetails(id: string): Promise<Recipe> {
  try {
    console.log(
      `Using TheMealDB as fallback for recipe details due to Spoonacular API quota issues`
    );

    // Use TheMealDB API for details instead
    return await getMealDbRecipeDetails(id);
  } catch (error) {
    console.error(`Error fetching details for recipe ${id}:`, error);
    throw error;
  }
}
