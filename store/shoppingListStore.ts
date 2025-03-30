import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ShoppingListItem, RecipeIngredient } from "@/types";
import { mockShoppingList } from "@/mocks/shoppingList";
import { generateId } from "@/utils/helpers";

interface ShoppingListState {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (
    item: Omit<ShoppingListItem, "id" | "addedAt" | "completed">
  ) => void;
  updateItem: (
    id: string,
    updates: Partial<Omit<ShoppingListItem, "id" | "addedAt">>
  ) => void;
  removeItem: (id: string) => void;
  toggleItemCompleted: (id: string) => void;
  clearCompletedItems: () => void;
  addRecipeIngredients: (ingredients: RecipeIngredient[]) => void;
}

// Helper to determine the best category for an ingredient
const inferCategoryFromIngredient = (
  ingredientName: string
): ShoppingListItem["category"] => {
  const name = ingredientName.toLowerCase();

  if (
    name.includes("fruit") ||
    /apple|banana|orange|berry|berries|grape|melon|pear|peach|mango|pineapple/.test(
      name
    )
  ) {
    return "fruits";
  }
  if (
    name.includes("vegetable") ||
    /carrot|potato|onion|garlic|pepper|tomato|lettuce|spinach|broccoli|cabbage/.test(
      name
    )
  ) {
    return "vegetables";
  }
  if (
    name.includes("milk") ||
    name.includes("cheese") ||
    name.includes("yogurt") ||
    name.includes("butter") ||
    name.includes("cream")
  ) {
    return "dairy";
  }
  if (
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("pork") ||
    name.includes("turkey") ||
    name.includes("ham") ||
    name.includes("meat")
  ) {
    return "meat";
  }
  if (
    name.includes("fish") ||
    name.includes("shrimp") ||
    name.includes("salmon") ||
    name.includes("tuna") ||
    name.includes("seafood")
  ) {
    return "seafood";
  }
  if (
    name.includes("rice") ||
    name.includes("pasta") ||
    name.includes("flour") ||
    name.includes("bread") ||
    name.includes("cereal") ||
    name.includes("grain")
  ) {
    return "grains";
  }
  if (
    name.includes("oil") ||
    name.includes("vinegar") ||
    name.includes("sauce") ||
    name.includes("ketchup") ||
    name.includes("mustard") ||
    name.includes("mayo")
  ) {
    return "condiments";
  }
  if (
    name.includes("spice") ||
    name.includes("herb") ||
    name.includes("salt") ||
    name.includes("pepper") ||
    name.includes("seasoning")
  ) {
    return "spices";
  }

  return "other";
};

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      items: mockShoppingList,
      isLoading: false,
      error: null,

      addItem: (item) => {
        const newItem: ShoppingListItem = {
          ...item,
          id: generateId(),
          completed: false,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      toggleItemCompleted: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, completed: !item.completed } : item
          ),
        }));
      },

      clearCompletedItems: () => {
        set((state) => ({
          items: state.items.filter((item) => !item.completed),
        }));
      },

      // Add multiple ingredients from a recipe to the shopping list
      addRecipeIngredients: (ingredients) => {
        set((state) => {
          // Filter out empty ingredients
          const validIngredients = ingredients.filter(
            (ing) => ing.name || ing.originalName
          );

          const newItems = validIngredients.map((ingredient) => {
            const name =
              ingredient.name ||
              ingredient.originalName ||
              "Unknown ingredient";

            // Parse the amount to get a proper number
            let quantity = 1;
            if (ingredient.amount !== undefined) {
              if (typeof ingredient.amount === "number") {
                quantity = ingredient.amount;
              } else if (typeof ingredient.amount === "string") {
                // Try to parse the string amount
                const parsedAmount = parseFloat(ingredient.amount);
                if (!isNaN(parsedAmount)) {
                  quantity = parsedAmount;
                }
              }
            }

            // Determine the best unit to use
            let unit = ingredient.unit || "item";
            // If unit is empty but we have a number, default to a reasonable unit
            if (!unit && quantity > 0) {
              // Common default units based on the ingredient name
              if (
                name.includes("milk") ||
                name.includes("water") ||
                name.includes("oil")
              ) {
                unit = "ml";
              } else if (
                name.includes("flour") ||
                name.includes("sugar") ||
                name.includes("rice")
              ) {
                unit = "g";
              }
            }

            // Infer the category from the ingredient name
            const category = inferCategoryFromIngredient(name);

            return {
              id: generateId(),
              name,
              category,
              quantity,
              unit,
              completed: false,
              addedAt: new Date().toISOString(),
            };
          });

          // Check for duplicates and merge them
          const existingItemMap = new Map(
            state.items.map((item) => [item.name.toLowerCase(), item])
          );

          const itemsToAdd = [];

          for (const newItem of newItems) {
            const normalizedName = newItem.name.toLowerCase();
            const existingItem = existingItemMap.get(normalizedName);

            if (existingItem) {
              // Update the existing item instead of adding a new one
              existingItemMap.set(normalizedName, {
                ...existingItem,
                quantity: existingItem.quantity + newItem.quantity,
                // Keep the existing unit if they match, otherwise note both
                unit:
                  existingItem.unit === newItem.unit
                    ? existingItem.unit
                    : `${existingItem.unit}/${newItem.unit}`,
              });
            } else {
              // Add as a new item
              itemsToAdd.push(newItem);
              existingItemMap.set(normalizedName, newItem);
            }
          }

          return {
            items: [
              ...state.items.map((item) => {
                const updatedItem = existingItemMap.get(
                  item.name.toLowerCase()
                );
                return updatedItem || item;
              }),
              ...itemsToAdd,
            ],
          };
        });
      },
    }),
    {
      name: "shopping-list-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
