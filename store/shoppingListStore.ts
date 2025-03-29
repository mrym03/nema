import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShoppingListItem } from '@/types';
import { mockShoppingList } from '@/mocks/shoppingList';
import { generateId } from '@/utils/helpers';

interface ShoppingListState {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: Omit<ShoppingListItem, 'id' | 'addedAt' | 'completed'>) => void;
  updateItem: (id: string, updates: Partial<Omit<ShoppingListItem, 'id' | 'addedAt'>>) => void;
  removeItem: (id: string) => void;
  toggleItemCompleted: (id: string) => void;
  clearCompletedItems: () => void;
}

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
    }),
    {
      name: 'shopping-list-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);