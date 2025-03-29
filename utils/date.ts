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