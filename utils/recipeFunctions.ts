import { FoodItem, Recipe } from '@/types';
import { calculateExpiryDate } from './date';
import { usePantryStore } from '@/store/pantryStore';

/**
 * Marks food items as opened when they're used in a recipe and deducts appropriate quantities.
 * Updates the expiry dates based on opened shelf life.
 * 
 * @param ingredientIds Array of food item IDs used in the recipe
 * @param recipeIngredients Array of recipe ingredients with amounts
 * @returns Array of updated food items
 */
export const markIngredientsAsOpened = (
  ingredientIds: string[], 
  recipeIngredients: Array<{name: string, amount?: number, unit?: string}>
): FoodItem[] => {
  // Get the pantry store functions
  const { items, toggleItemOpenStatus, updateItem, removeItem } = usePantryStore.getState();
  
  // Track updated items
  const updatedItems: FoodItem[] = [];
  
  // Go through each used ingredient
  ingredientIds.forEach(itemId => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    // Find matching recipe ingredient
    const recipeIngredient = recipeIngredients.find(ri => 
      (ri.name || '').toLowerCase().includes(item.name.toLowerCase()) ||
      item.name.toLowerCase().includes((ri.name || '').toLowerCase())
    );
    
    // Default to 1 if no specific amount is found
    let amountNeeded = 1;
    
    if (recipeIngredient?.amount) {
      // If recipe specifies an amount, use it
      amountNeeded = recipeIngredient.amount;
      
      // Convert units if needed (simplified)
      if (recipeIngredient.unit && item.unit && 
          recipeIngredient.unit !== item.unit) {
        // Very basic unit conversion - would need to be expanded for a real app
        if (recipeIngredient.unit === 'tablespoon' && item.unit === 'g') {
          amountNeeded = amountNeeded * 15; // Approx 15g per tablespoon
        } else if (recipeIngredient.unit === 'teaspoon' && item.unit === 'g') {
          amountNeeded = amountNeeded * 5; // Approx 5g per teaspoon
        }
        // Add other conversions as needed
      }
    }
    
    // Ensure we don't take more than available
    const amountToUse = Math.min(amountNeeded, item.quantity);
    
    // Calculate remaining quantity
    const remainingQuantity = Math.max(0, item.quantity - amountToUse);
    
    if (remainingQuantity <= 0) {
      // If completely used up, remove the item
      removeItem(item.id);
      // Add to updated items for reporting
      updatedItems.push({...item, quantity: 0});
    } else {
      // If there's some left, update the quantity
      if (!item.isOpen) {
        // If not already open, mark as open
        toggleItemOpenStatus(item.id);
      } else {
        // If already open, just update the quantity
        updateItem(item.id, { quantity: remainingQuantity });
      }
      
      // Find the updated item after modifying
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