import { create } from 'zustand';
import { Recipe } from '@/types';
import { mockRecipes } from '@/mocks/recipes';
import { fetchRecipesByIngredients } from '@/utils/api';

interface RecipeState {
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
  fetchRecipes: (ingredients: string[]) => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: mockRecipes,
  isLoading: false,
  error: null,
  
  fetchRecipes: async (ingredients) => {
    set({ isLoading: true, error: null });
    
    try {
      // Use the real Spoonacular API
      const recipesData = await fetchRecipesByIngredients(ingredients);
      
      // Transform the data to match our Recipe type if needed
      const formattedRecipes: Recipe[] = recipesData.map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        imageUrl: item.image,
        readyInMinutes: item.readyInMinutes || 30,
        servings: item.servings || 4,
        sourceUrl: item.sourceUrl || '',
        summary: item.summary || '',
        usedIngredientCount: item.usedIngredientCount,
        missedIngredientCount: item.missedIngredientCount,
        likes: item.likes || 0
      }));
      
      set({ recipes: formattedRecipes, isLoading: false });
    } catch (error) {
      console.error('Recipe API error:', error);
      
      // Fall back to mock data in case of API failure
      set({ 
        recipes: mockRecipes,
        error: error instanceof Error ? error.message : 'Failed to fetch recipes', 
        isLoading: false 
      });
    }
  },
  
  getRecipeById: (id) => {
    return get().recipes.find(recipe => recipe.id === id);
  },
}));