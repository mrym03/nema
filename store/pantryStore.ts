import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FoodItem } from '@/types';
import { mockFoodItems } from '@/mocks/foodItems';
import { generateId } from '@/utils/helpers';
import { syncPantryToCloud, fetchPantryFromCloud, lookupBarcodeUPC } from '@/utils/api';

// Debug function to check what's in AsyncStorage
const debugAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', keys);
    
    // Check if our pantry storage exists
    if (keys.includes('pantry-storage')) {
      const data = await AsyncStorage.getItem('pantry-storage');
      console.log('Pantry storage exists, data length:', data ? data.length : 'null');
      console.log('Pantry sample data:', data ? data.substring(0, 100) + '...' : 'null');
    } else {
      console.log('Pantry storage key not found in AsyncStorage');
    }
  } catch (error) {
    console.error('Error debugging AsyncStorage:', error);
  }
};

// Debug on app load
debugAsyncStorage();

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
    (set, get) => {
      console.log('Initializing pantry store');
      
      return {
        items: [],  // Start with empty array instead of mockFoodItems
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
          console.log('PantryStore: Removing item with ID:', id);
          
          // First, make sure the item exists
          const stateBeforeChange = get();
          const itemExists = stateBeforeChange.items.some(item => item.id === id);
          
          if (!itemExists) {
            console.error('PantryStore: Cannot remove item - ID not found:', id);
            return;
          }
          
          // Create a new items array without the item to be removed
          const newItems = stateBeforeChange.items.filter(item => item.id !== id);
          console.log('PantryStore: Items count before:', stateBeforeChange.items.length, 'after:', newItems.length);
          
          // Directly update the state with the new items array
          set({ items: newItems });
          
          // Then sync to cloud in background
          syncPantryToCloud(USER_ID, newItems)
            .then(() => console.log('PantryStore: Cloud sync successful after item removal'))
            .catch(error => console.error('PantryStore: Cloud sync failed:', error));
          
          // Verify the state was updated
          console.log('PantryStore: Final items count after removal:', get().items.length);
        },
        
        consumeItem: (id, quantity) => {
          console.log('PantryStore: Consuming item with ID:', id, 'Quantity:', quantity);
          
          // First, make sure the item exists
          const stateBeforeChange = get();
          const item = stateBeforeChange.items.find(i => i.id === id);
          
          if (!item) {
            console.error('PantryStore: Cannot consume item - ID not found:', id);
            return;
          }
          
          console.log('PantryStore: Found item to consume:', item);
          const consumedQuantity = quantity || item.quantity;
          console.log('PantryStore: Consuming quantity:', consumedQuantity, 'of', item.quantity);
          
          let newItems;
          
          if (consumedQuantity >= item.quantity) {
            // Remove the item if fully consumed
            console.log('PantryStore: Fully consuming item (will be removed)');
            newItems = stateBeforeChange.items.filter(i => i.id !== id);
          } else {
            // Update the quantity if partially consumed
            console.log('PantryStore: Partially consuming item (updating quantity)');
            newItems = stateBeforeChange.items.map(i => 
              i.id === id ? { ...i, quantity: i.quantity - consumedQuantity } : i
            );
          }
          
          // Directly update the state with the new items array
          set({ items: newItems });
          
          // Then sync to cloud in background
          syncPantryToCloud(USER_ID, newItems)
            .then(() => console.log('PantryStore: Cloud sync successful after consumption'))
            .catch(error => console.error('PantryStore: Cloud sync failed:', error));
          
          // Verify the state was updated
          const stateAfterChange = get();
          console.log('PantryStore: Final items count after consumption:', stateAfterChange.items.length);
          const updatedItem = stateAfterChange.items.find(i => i.id === id);
          console.log('PantryStore: Item after consumption:', updatedItem || 'Item was removed');
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
      };
    },
    {
      name: 'pantry-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        console.log('Pantry store is rehydrating from storage');
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating pantry store:', error);
          } else {
            console.log('Pantry store rehydrated successfully');
            console.log('Loaded items:', state?.items.length || 0);
            
            // If no items were loaded, initialize with mock data
            if (!state?.items.length) {
              console.log('No persisted items found, initializing with mock data');
              usePantryStore.setState({ items: mockFoodItems });
            }
          }
        };
      },
    }
  )
);