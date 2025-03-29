import { FoodCategory } from '@/types';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays} days`;
  } else {
    return formatDate(dateString);
  }
};

export const getDaysUntilExpiry = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (dateString: string, days = 3): boolean => {
  const daysLeft = getDaysUntilExpiry(dateString);
  return daysLeft >= 0 && daysLeft <= days;
};

export const isExpired = (dateString: string): boolean => {
  return getDaysUntilExpiry(dateString) < 0;
};

export const calculateExpiryDate = (
  category: FoodCategory, 
  isOpen: boolean,
  unopenedShelfLife?: number,
  openedShelfLife?: number
): string => {
  // Get default shelf life if not provided
  const defaultUnopened = getDefaultShelfLife(category);
  const defaultOpened = getDefaultOpenedShelfLife(category);
  
  // Use provided values or defaults
  const shelfLifeDays = isOpen 
    ? (openedShelfLife || defaultOpened)
    : (unopenedShelfLife || defaultUnopened);
  
  // Calculate expiry date
  const today = new Date();
  const expiryDate = new Date(today.getTime() + (shelfLifeDays * 24 * 60 * 60 * 1000));
  
  return expiryDate.toISOString();
};

// Default shelf life in days when unopened
export const getDefaultShelfLife = (category: FoodCategory): number => {
  switch (category) {
    case 'fruits':
      return 7; // 1 week for most fruits
    case 'vegetables':
      return 10; // 10 days for most vegetables
    case 'dairy':
      return 14; // 2 weeks for dairy
    case 'meat':
      return 5; // 5 days for fresh meat
    case 'seafood':
      return 3; // 3 days for seafood
    case 'grains':
      return 180; // 6 months for grains
    case 'bakery':
      return 7; // 1 week for bakery items
    case 'canned':
      return 730; // 2 years for canned foods
    case 'frozen':
      return 180; // 6 months for frozen foods
    case 'snacks':
      return 60; // 2 months for snacks
    case 'beverages':
      return 30; // 1 month for beverages
    case 'condiments':
      return 180; // 6 months for condiments
    case 'spices':
      return 365; // 1 year for spices
    default:
      return 30; // Default to 1 month
  }
};

// Default shelf life in days when opened
export const getDefaultOpenedShelfLife = (category: FoodCategory): number => {
  switch (category) {
    case 'fruits':
      return 3; // 3 days for cut fruits
    case 'vegetables':
      return 5; // 5 days for prepared vegetables
    case 'dairy':
      return 7; // 1 week for opened dairy
    case 'meat':
      return 3; // 3 days for opened meat
    case 'seafood':
      return 2; // 2 days for opened seafood
    case 'grains':
      return 60; // 2 months for opened grains
    case 'bakery':
      return 3; // 3 days for opened bakery items
    case 'canned':
      return 7; // 1 week for opened canned foods
    case 'frozen':
      return 7; // 1 week after thawing
    case 'snacks':
      return 14; // 2 weeks for opened snacks
    case 'beverages':
      return 7; // 1 week for opened beverages
    case 'condiments':
      return 60; // 2 months for opened condiments
    case 'spices':
      return 180; // 6 months for opened spices
    default:
      return 7; // Default to 1 week
  }
};