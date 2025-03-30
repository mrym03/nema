export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  expiryDate: string; // ISO string
  quantity: number;
  unit: string;
  imageUrl?: string;
  notes?: string;
  addedAt: string; // ISO string
  isOpen: boolean; // Whether the product has been opened
  unopenedShelfLife?: number; // Shelf life in days when unopened
  openedShelfLife?: number; // Shelf life in days when opened
}

export type FoodCategory =
  | "fruits"
  | "vegetables"
  | "dairy"
  | "meat"
  | "seafood"
  | "grains"
  | "bakery"
  | "canned"
  | "frozen"
  | "snacks"
  | "beverages"
  | "condiments"
  | "spices"
  | "other";

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  readyInMinutes?: number;
  servings: number;
  sourceUrl?: string;
  summary?: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  likes?: number;
  instructions?: string;
  extendedIngredients?: RecipeIngredient[];
  // Dietary information
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  diets?: string[];
  cuisines?: string[];
  dishTypes?: string[];
}

export interface RecipeIngredient {
  id?: number | string; // Allow both number and string IDs to support TheMealDB
  name?: string;
  originalName?: string;
  amount?: number | string; // Allow string amounts for TheMealDB
  unit?: string;
  aisle?: string;
  original?: string;
  recipeName?: string; // Add recipe name to track where ingredient came from
  category?: FoodCategory; // Add category field for better organization
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  completed: boolean;
  addedAt: string; // ISO string
  recipes?: string[]; // Track which recipes an ingredient is used in
}
