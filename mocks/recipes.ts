import { Recipe } from '@/types';

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Spinach and Tomato Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=300',
    readyInMinutes: 25,
    servings: 4,
    sourceUrl: 'https://example.com/recipe1',
    summary: 'A quick and easy pasta dish with fresh spinach and tomatoes.',
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    likes: 120
  },
  {
    id: '2',
    title: 'Avocado Toast with Tomato',
    imageUrl: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?q=80&w=300',
    readyInMinutes: 10,
    servings: 2,
    sourceUrl: 'https://example.com/recipe2',
    summary: 'Simple and nutritious breakfast with ripe avocados and fresh tomatoes on toasted bread.',
    usedIngredientCount: 3,
    missedIngredientCount: 0,
    likes: 95
  },
  {
    id: '3',
    title: 'Chicken and Vegetable Stir Fry',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=300',
    readyInMinutes: 30,
    servings: 4,
    sourceUrl: 'https://example.com/recipe3',
    summary: 'A healthy stir fry with chicken breast and mixed vegetables.',
    usedIngredientCount: 2,
    missedIngredientCount: 2,
    likes: 87
  },
  {
    id: '4',
    title: 'Apple Cinnamon Oatmeal',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=300',
    readyInMinutes: 15,
    servings: 2,
    sourceUrl: 'https://example.com/recipe4',
    summary: 'Warm and comforting oatmeal with fresh apples and cinnamon.',
    usedIngredientCount: 1,
    missedIngredientCount: 2,
    likes: 65
  },
  {
    id: '5',
    title: 'Spinach and Avocado Smoothie',
    imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?q=80&w=300',
    readyInMinutes: 5,
    servings: 1,
    sourceUrl: 'https://example.com/recipe5',
    summary: 'A nutritious green smoothie with spinach, avocado, and banana.',
    usedIngredientCount: 2,
    missedIngredientCount: 1,
    likes: 110
  }
];