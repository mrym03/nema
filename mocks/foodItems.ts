import { FoodItem } from '@/types';

export const mockFoodItems: FoodItem[] = [
  {
    id: '1',
    name: 'Spinach',
    category: 'vegetables',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    quantity: 1,
    unit: 'bunch',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Tomatoes',
    category: 'vegetables',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    quantity: 4,
    unit: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Milk',
    category: 'dairy',
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    quantity: 1,
    unit: 'liter',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Chicken Breast',
    category: 'meat',
    expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    quantity: 500,
    unit: 'g',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Apples',
    category: 'fruits',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    quantity: 6,
    unit: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Bread',
    category: 'bakery',
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    quantity: 1,
    unit: 'loaf',
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Pasta',
    category: 'grains',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days from now
    quantity: 500,
    unit: 'g',
    imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?q=80&w=300',
    addedAt: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Avocado',
    category: 'fruits',
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    quantity: 2,
    unit: 'medium',
    imageUrl: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?q=80&w=300',
    addedAt: new Date().toISOString(),
  }
];