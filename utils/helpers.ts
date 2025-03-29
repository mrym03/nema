import { FoodItem } from '@/types';
import { getDaysUntilExpiry } from './date';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const sortByExpiryDate = (items: FoodItem[]): FoodItem[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.expiryDate).getTime();
    const dateB = new Date(b.expiryDate).getTime();
    return dateA - dateB;
  });
};

export const getExpiringItems = (items: FoodItem[], days = 3): FoodItem[] => {
  return items.filter(item => {
    const daysLeft = getDaysUntilExpiry(item.expiryDate);
    return daysLeft >= 0 && daysLeft <= days;
  });
};

export const getExpiredItems = (items: FoodItem[]): FoodItem[] => {
  return items.filter(item => getDaysUntilExpiry(item.expiryDate) < 0);
};

export const groupItemsByCategory = (items: FoodItem[]): { [key: string]: FoodItem[] } => {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as { [key: string]: FoodItem[] });
};