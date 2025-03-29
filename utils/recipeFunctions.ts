import { FoodItem, Recipe } from '@/types';
import { calculateExpiryDate } from './date';
import { usePantryStore } from '@/store/pantryStore';

/**
 * Marks food items as opened when they're used in a recipe.
 * Updates the expiry dates based on opened shelf life.
 * 
 * @param recipeId The ID of the recipe being cooked
 * @param usedIngredients Array of food item IDs used in the recipe
 * @returns Array of updated food items
 */
export const markIngredientsAsOpened = (usedIngredients: string[]): FoodItem[] => {
  // Get the pantry store and the toggle function
  const { items, toggleItemOpenStatus } = usePantryStore.getState();
  
  // Track updated items
  const updatedItems: FoodItem[] = [];
  
  // Go through each used ingredient
  usedIngredients.forEach(itemId => {
    const item = items.find(i => i.id === itemId);
    
    if (item && !item.isOpen) {
      // If the item exists and is not already open, toggle its open status
      toggleItemOpenStatus(itemId);
      
      // Find the updated item in the store after toggle
      const updatedItem = usePantryStore.getState().items.find(i => i.id === itemId);
      if (updatedItem) {
        updatedItems.push(updatedItem);
      }
    }
  });
  
  return updatedItems;
};

/**
 * Calculate sustainability impact from using ingredients before they expire
 * 
 * @param usedIngredients Array of food items used in a recipe
 * @returns Object containing sustainability metrics
 */
export const calculateSustainabilityImpact = (usedIngredients: FoodItem[]) => {
  // Average food waste per person per year in kilograms
  const averageFoodWastePerPersonPerYear = 74; // kg
  
  // CO2 emissions per kg of food waste
  const co2PerKgFoodWaste = 2.5; // kg CO2 equivalent
  
  // Water savings per kg of food waste avoided
  const waterPerKgFoodWaste = 1000; // liters
  
  // Calculate total weight of ingredients used
  let totalWeight = 0;
  
  usedIngredients.forEach(item => {
    // Convert quantity to kg for calculation
    let weightInKg = 0;
    
    if (item.unit === 'kg') {
      weightInKg = item.quantity;
    } else if (item.unit === 'g') {
      weightInKg = item.quantity / 1000;
    } else {
      // Approximate weight for common units
      switch (item.unit) {
        case 'item':
        case 'piece':
          weightInKg = 0.2; // Assume average item is 200g
          break;
        case 'can':
          weightInKg = 0.4; // Assume average can is 400g
          break;
        case 'liter':
        case 'l':
          weightInKg = 1.0; // Assume density close to water
          break;
        default:
          weightInKg = 0.1; // Default assumption
      }
      
      weightInKg *= item.quantity;
    }
    
    totalWeight += weightInKg;
  });
  
  // Calculate impact metrics
  const wasteReduction = totalWeight; // kg
  const co2Reduction = wasteReduction * co2PerKgFoodWaste; // kg CO2
  const waterSavings = wasteReduction * waterPerKgFoodWaste; // liters
  
  // Calculate percentage of annual waste saved
  const percentOfAnnualWaste = (wasteReduction / averageFoodWastePerPersonPerYear) * 100;
  
  return {
    wasteReduction, // kg of food waste saved
    co2Reduction, // kg of CO2 emissions avoided
    waterSavings, // liters of water saved
    percentOfAnnualWaste // percentage of annual food waste saved
  };
}; 