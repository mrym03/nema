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
}

export type FoodCategory = 
  | 'fruits' 
  | 'vegetables' 
  | 'dairy' 
  | 'meat' 
  | 'seafood' 
  | 'grains' 
  | 'bakery' 
  | 'canned' 
  | 'frozen' 
  | 'snacks' 
  | 'beverages' 
  | 'condiments' 
  | 'spices' 
  | 'other';

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  summary: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  likes: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  completed: boolean;
  addedAt: string; // ISO string
}