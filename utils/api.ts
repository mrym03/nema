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
const SPOONACULAR_API_KEY = "5aa1b842d153413baa1b6862d0c78d79";
const SPOONACULAR_BASE_URL = "https://api.spoonacular.com";

// UPC database API for barcode scanning
const UPC_DATABASE_API_KEY = "E08F735364A32F6FAFC0C06F803E0B9D";
const UPC_DATABASE_BASE_URL = "https://api.upcdatabase.org/product";

// Development mode flag - true if using placeholder Supabase credentials
const DEV_MODE = true; // Temporarily using development mode until Supabase tables are created

// Firebase initialization would normally happen here
// For now, we'll simulate Firebase with AsyncStorage

// Recipe API functions
export const fetchRecipesByIngredients = async (ingredients: string[]) => {
  try {
    if (ingredients.length === 0) {
      console.log('No ingredients provided, returning empty results');
      return [];
    }
    
    const ingredientsString = ingredients.join(',');
    console.log(`Fetching recipes for ingredients: ${ingredientsString}`);
    
    // Step 1: Find recipes that match our ingredients
    const findResponse = await fetch(
      `${SPOONACULAR_BASE_URL}/recipes/findByIngredients?ingredients=${ingredientsString}&number=10&ranking=1&ignorePantry=false&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!findResponse.ok) {
      throw new Error(`API error: ${findResponse.status}`);
    }
    
    const recipesBasicInfo = await findResponse.json() as Array<{
      id: number;
      title: string;
      image: string;
      usedIngredientCount: number;
      missedIngredientCount: number;
      likes: number;
    }>;
    
    if (!recipesBasicInfo || recipesBasicInfo.length === 0) {
      console.log('No recipes found for the given ingredients');
      return [];
    }
    
    console.log(`Found ${recipesBasicInfo.length} recipes for the ingredients`);
    
    // Step 2: Get more detailed information for each recipe
    const recipeIds = recipesBasicInfo.map((recipe) => recipe.id).join(',');
    const detailsResponse = await fetch(
      `${SPOONACULAR_BASE_URL}/recipes/informationBulk?ids=${recipeIds}&apiKey=${SPOONACULAR_API_KEY}`
    );
    
    if (!detailsResponse.ok) {
      // If we can't get details, we'll just use the basic info
      console.warn(`Couldn't fetch detailed recipe info: ${detailsResponse.status}`);
      return recipesBasicInfo.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        imageUrl: item.image,
        readyInMinutes: 30, // Default value
        servings: 4, // Default value
        sourceUrl: '',
        summary: '',
        usedIngredientCount: item.usedIngredientCount,
        missedIngredientCount: item.missedIngredientCount,
        likes: item.likes || 0
      }));
    }
    
    const detailedRecipes = await detailsResponse.json() as Array<{
      id: number;
      title: string;
      image: string;
      readyInMinutes: number;
      servings: number;
      sourceUrl: string;
      summary: string;
      aggregateLikes: number;
    }>;
    
    // Step 3: Merge the detailed info with the ingredient matching info
    return detailedRecipes.map((detailedRecipe) => {
      const basicInfo = recipesBasicInfo.find((r) => r.id === detailedRecipe.id);
      
      return {
        id: detailedRecipe.id.toString(),
        title: detailedRecipe.title,
        imageUrl: detailedRecipe.image,
        readyInMinutes: detailedRecipe.readyInMinutes,
        servings: detailedRecipe.servings,
        sourceUrl: detailedRecipe.sourceUrl || '',
        summary: detailedRecipe.summary || '',
        usedIngredientCount: basicInfo ? basicInfo.usedIngredientCount : 0,
        missedIngredientCount: basicInfo ? basicInfo.missedIngredientCount : 0,
        likes: detailedRecipe.aggregateLikes || 0
      };
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
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
