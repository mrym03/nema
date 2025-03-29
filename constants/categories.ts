import { FoodCategory } from '@/types';

export const CATEGORIES: { [key in FoodCategory]: { label: string; icon: string; color: string } } = {
  fruits: { 
    label: 'Fruits', 
    icon: 'Package', 
    color: '#FF5252' 
  },
  vegetables: { 
    label: 'Vegetables', 
    icon: 'Package', 
    color: '#4CAF50' 
  },
  dairy: { 
    label: 'Dairy', 
    icon: 'milk', 
    color: '#90CAF9' 
  },
  meat: { 
    label: 'Meat', 
    icon: 'beef', 
    color: '#FF7043' 
  },
  seafood: { 
    label: 'Seafood', 
    icon: 'fish', 
    color: '#4FC3F7' 
  },
  grains: { 
    label: 'Grains', 
    icon: 'wheat', 
    color: '#FFD54F' 
  },
  bakery: { 
    label: 'Bakery', 
    icon: 'croissant', 
    color: '#FFAB91' 
  },
  canned: { 
    label: 'Canned', 
    icon: 'Package', 
    color: '#9E9E9E' 
  },
  frozen: { 
    label: 'Frozen', 
    icon: 'snowflake', 
    color: '#81D4FA' 
  },
  snacks: { 
    label: 'Snacks', 
    icon: 'cookie', 
    color: '#FFCC80' 
  },
  beverages: { 
    label: 'Beverages', 
    icon: 'cup-soda', 
    color: '#CE93D8' 
  },
  condiments: { 
    label: 'Condiments', 
    icon: 'flask-conical', 
    color: '#FFF176' 
  },
  spices: { 
    label: 'Spices', 
    icon: 'pepper', 
    color: '#FF8A65' 
  },
  other: { 
    label: 'Other', 
    icon: 'Package', 
    color: '#BDBDBD' 
  }
};