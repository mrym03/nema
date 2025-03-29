import { ShoppingListItem } from '@/types';

export const mockShoppingList: ShoppingListItem[] = [
  {
    id: '1',
    name: 'Onions',
    category: 'vegetables',
    quantity: 3,
    unit: 'medium',
    completed: false,
    addedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Olive Oil',
    category: 'condiments',
    quantity: 1,
    unit: 'bottle',
    completed: false,
    addedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Rice',
    category: 'grains',
    quantity: 1,
    unit: 'kg',
    completed: true,
    addedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Eggs',
    category: 'dairy',
    quantity: 12,
    unit: 'large',
    completed: false,
    addedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Garlic',
    category: 'vegetables',
    quantity: 1,
    unit: 'head',
    completed: false,
    addedAt: new Date().toISOString()
  }
];