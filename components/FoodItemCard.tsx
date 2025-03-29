import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { FoodItem } from '@/types';
import Colors from '@/constants/colors';
import { formatDate } from '@/utils/date';
import CardContainer from './CardContainer';

// Conditional imports to handle potential errors
let LinearGradient: any = View;

// Try to import the libraries, but use fallbacks if they fail
try {
  // First try the Expo version of LinearGradient
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  try {
    // Fall back to react-native-linear-gradient if Expo version fails
    LinearGradient = require('react-native-linear-gradient').LinearGradient;
  } catch (e) {
    console.warn('Linear gradient not available, using fallback');
  }
}

// Food category default images
const categoryImages = {
  fruits: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300',
  vegetables: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=300',
  dairy: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=300',
  meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=300',
  seafood: 'https://images.unsplash.com/photo-1579384264577-79580c9d3a36?q=80&w=300',
  grains: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=300',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300',
  canned: 'https://images.unsplash.com/photo-1584969434146-4714825f3b14?q=80&w=300',
  frozen: 'https://images.unsplash.com/photo-1584704892024-aed56028ad0b?q=80&w=300',
  snacks: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=300',
  beverages: 'https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?q=80&w=300',
  condiments: 'https://images.unsplash.com/photo-1589632862914-e0c6f29381e4?q=80&w=300',
  spices: 'https://images.unsplash.com/photo-1532336414791-78499e7733fe?q=80&w=300',
  other: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=300'
};

// Common food items with specific images
const foodItemImages: {[key: string]: string} = {
  // Fruits
  'apple': 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=300',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=300',
  'orange': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=300',
  'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?q=80&w=300',
  'strawberries': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=300',
  'lemon': 'https://images.unsplash.com/photo-1582287014914-1db0624be8c3?q=80&w=300',
  'avocado': 'https://images.unsplash.com/photo-1601039641847-7857b994d704?q=80&w=300',
  
  // Vegetables
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300',
  'tomatoes': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300',
  'carrots': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300',
  'broccoli': 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=300',
  'onions': 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?q=80&w=300',
  'onion': 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?q=80&w=300',
  'potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300',
  
  // Dairy
  'milk': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=300',
  'cheese': 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=300',
  'yogurt': 'https://images.unsplash.com/photo-1571212515416-fca988083b88?q=80&w=300',
  'butter': 'https://images.unsplash.com/photo-1589985270958-349dd394d5b2?q=80&w=300',
  'eggs': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?q=80&w=300',
  'egg': 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?q=80&w=300',
  
  // Meat
  'chicken': 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?q=80&w=300',
  'beef': 'https://images.unsplash.com/photo-1551446307-03787c4d619f?q=80&w=300',
  'pork': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=300',
  'bacon': 'https://images.unsplash.com/photo-1625943553852-781c33e4f033?q=80&w=300',
  
  // Bakery
  'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300',
  'bagel': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=300',
  'croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300',
  
  // Beverages
  'water': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300',
  'coffee': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=300',
  'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=300',
  'juice': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=300',
  'beer': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=300',
  'wine': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300'
};

interface FoodItemCardProps {
  foodItem: FoodItem;
  onPress: (item: FoodItem) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ foodItem, onPress }) => {
  const category = foodItem.category || 'other';
  const categoryColor = Colors[category] || Colors.other;
  const categoryTextColor = getCategoryTextColor(categoryColor);
  
  const isExpiringSoon = foodItem.expiryDate
    ? new Date(foodItem.expiryDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    : false;

  const isExpired = foodItem.expiryDate
    ? new Date(foodItem.expiryDate) < new Date()
    : false;

  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  const GradientComponent = shouldUseGradient ? LinearGradient : View;
  
  const categoryGradientProps = shouldUseGradient
    ? {
        colors: [categoryColor, categoryColor + '80'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: styles.categoryTag
      }
    : {
        style: [styles.categoryTag, { backgroundColor: categoryColor }]
      };
      
  // Function to get an appropriate image for the food item
  const getImageUrl = (): string => {
    // If the item already has an imageUrl, use it
    if (foodItem.imageUrl) {
      return foodItem.imageUrl;
    }
    
    // Try to find a specific image for this food item
    const itemNameLower = foodItem.name.toLowerCase().trim();
    if (foodItemImages[itemNameLower]) {
      return foodItemImages[itemNameLower];
    }
    
    // If no exact match, try to find a partial match
    for (const [key, url] of Object.entries(foodItemImages)) {
      if (itemNameLower.includes(key) || key.includes(itemNameLower)) {
        return url;
      }
    }
    
    // Fall back to a category-based image
    return categoryImages[category] || categoryImages.other;
  };

  return (
    <CardContainer animation="fadeIn" style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed
        ]}
        onPress={() => onPress(foodItem)}
        android_ripple={{ color: Colors.shadowLight }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={getImageUrl()}
            style={styles.image}
            contentFit="cover"
            transition={300}
            placeholder="blur"
          />
          
          {/* Category tag */}
          <GradientComponent {...categoryGradientProps}>
            <Text style={[styles.categoryText, { color: categoryTextColor }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </GradientComponent>
          
          {/* Status tag - if opened */}
          {foodItem.isOpen && (
            <View style={styles.statusTag}>
              <Text style={styles.statusText}>Opened</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{foodItem.name}</Text>
          
          <Text style={styles.quantity} numberOfLines={1}>
            {foodItem.quantity || 1} {foodItem.unit || 'item'}
            {(foodItem.quantity || 1) > 1 && foodItem.unit !== 'kg' && foodItem.unit !== 'g' && 's'}
          </Text>
          
          {foodItem.expiryDate && (
            <View style={styles.expiryContainer}>
              <Text style={[
                styles.expiryLabel,
                isExpired && styles.expiredLabel,
                isExpiringSoon && !isExpired && styles.expiringLabel
              ]}>
                {isExpired ? 'Expired:' : 'Expires:'}
              </Text>
              <Text style={[
                styles.expiryDate,
                isExpired && styles.expiredDate,
                isExpiringSoon && !isExpired && styles.expiringDate
              ]}>
                {formatDate(foodItem.expiryDate)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </CardContainer>
  );
};

function getCategoryTextColor(backgroundColor: string): string {
  // Simple calculation to determine if text should be white or black
  // This is a simplification and could be improved for better contrast
  const r = parseInt(backgroundColor.substring(1, 3), 16);
  const g = parseInt(backgroundColor.substring(3, 5), 16);
  const b = parseInt(backgroundColor.substring(5, 7), 16);
  
  // Calculate brightness (on a scale of 0-255)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white text for dark backgrounds, black for light backgrounds
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  pressable: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  imageContainer: {
    position: 'relative',
    width: 90,
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  categoryTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 6,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginRight: 4,
  },
  expiryDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  expiredLabel: {
    color: Colors.danger,
    fontWeight: '500',
  },
  expiringLabel: {
    color: Colors.warning,
    fontWeight: '500',
  },
  expiredDate: {
    color: Colors.danger,
    fontWeight: '500',
  },
  expiringDate: {
    color: Colors.warning,
    fontWeight: '500',
  },
  statusTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
});

export default FoodItemCard;
