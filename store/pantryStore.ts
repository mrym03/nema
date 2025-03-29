import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FoodItem } from '@/types';
import { mockFoodItems } from '@/mocks/foodItems';
import { generateId } from '@/utils/helpers';
import { syncPantryToCloud, fetchPantryFromCloud, lookupBarcodeUPC } from '@/utils/api';

// Mock user ID for now, in a real app this would come from authentication
const USER_ID = 'user123';

interface PantryState {
  items: FoodItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: Omit<FoodItem, 'id' | 'addedAt'>) => void;
  updateItem: (id: string, updates: Partial<Omit<FoodItem, 'id' | 'addedAt'>>) => void;
  removeItem: (id: string) => void;
  consumeItem: (id: string, quantity?: number) => void;
  clearExpiredItems: () => void;
  clearAllItems: () => void;
  syncWithCloud: () => Promise<void>;
  addItemByBarcode: (barcode: string) => Promise<FoodItem | null>;
}

export const usePantryStore = create<PantryState>()(
  persist(
    (set, get) => ({
      items: mockFoodItems,
      isLoading: false,
      error: null,
      
      addItem: (item) => {
        const newItem: FoodItem = {
          ...item,
          id: generateId(),
          addedAt: new Date().toISOString(),
        };
        set((state) => {
          const newItems = [...state.items, newItem];
          // Sync to cloud in background
          syncPantryToCloud(USER_ID, newItems).catch(console.error);
          return { items: newItems };
        });
      },
      
      updateItem: (id, updates) => {
        set((state) => {
          const newItems = state.items.map((item) => 
            item.id === id ? { ...item, ...updates } : item
          );
          // Sync to cloud in background
          syncPantryToCloud(USER_ID, newItems).catch(console.error);
          return { items: newItems };
        });
      },
      
      removeItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          // Sync to cloud in background
          syncPantryToCloud(USER_ID, newItems).catch(console.error);
          return { items: newItems };
        });
      },
      
      consumeItem: (id, quantity) => {
        const { items } = get();
        const item = items.find((i) => i.id === id);
        
        if (!item) return;
        
        const consumedQuantity = quantity || item.quantity;
        
        if (consumedQuantity >= item.quantity) {
          // Remove the item if fully consumed
          set((state) => {
            const newItems = state.items.filter((i) => i.id !== id);
            // Sync to cloud in background
            syncPantryToCloud(USER_ID, newItems).catch(console.error);
            return { items: newItems };
          });
        } else {
          // Update the quantity if partially consumed
          set((state) => {
            const newItems = state.items.map((i) => 
              i.id === id ? { ...i, quantity: i.quantity - consumedQuantity } : i
            );
            // Sync to cloud in background
            syncPantryToCloud(USER_ID, newItems).catch(console.error);
            return { items: newItems };
          });
        }
      },
      
      clearExpiredItems: () => {
        const now = new Date();
        set((state) => {
          const newItems = state.items.filter((item) => 
            new Date(item.expiryDate) > now
          );
          // Sync to cloud in background
          syncPantryToCloud(USER_ID, newItems).catch(console.error);
          return { items: newItems };
        });
      },
      
      clearAllItems: () => {
        set({ items: [] });
        // Sync empty array to cloud in background
        syncPantryToCloud(USER_ID, []).catch(console.error);
      },
      
      syncWithCloud: async () => {
        set({ isLoading: true, error: null });
        try {
          // Fetch data from cloud
          const cloudItems = await fetchPantryFromCloud(USER_ID);
          set({ items: cloudItems, isLoading: false });
        } catch (error) {
          console.error('Error syncing with cloud:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sync with cloud', 
            isLoading: false 
          });
        }
      },
      
      addItemByBarcode: async (barcode) => {
        set({ isLoading: true, error: null });
        try {
          // Look up the item by barcode
          const productData = await lookupBarcodeUPC(barcode);
          
          if (!productData || !productData.name) {
            set({ isLoading: false, error: 'Product not found' });
            return null;
          }
          
          // Create a new item from the product data
          const newItem: FoodItem = {
            id: generateId(),
            name: productData.name,
            category: 'other', // Default category, can be updated later
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
            quantity: 1,
            unit: 'item',
            addedAt: new Date().toISOString(),
            notes: productData.description || '',
            imageUrl: productData.image || undefined
          };
          
          // Add the item to the store
          set((state) => {
            const newItems = [...state.items, newItem];
            // Sync to cloud in background
            syncPantryToCloud(USER_ID, newItems).catch(console.error);
            return { items: newItems, isLoading: false };
          });
          
          return newItem;
        } catch (error) {
          console.error('Error adding item by barcode:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item by barcode', 
            isLoading: false 
          });
          return null;
        }
      }
    }),
    {
      name: 'pantry-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);