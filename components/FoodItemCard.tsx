import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { FoodItem } from '@/types';
import Colors from '@/constants/colors';
import { formatDate, getDaysFromToday } from '@/utils/date';
import CardContainer from './CardContainer';
import { Calendar, Droplets, ShoppingBag } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animated: any = { Value: class {}, timing: () => ({ start: () => {} }) };
let Easing: any = {};

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

try {
  const ReactNative = require('react-native');
  Animated = ReactNative.Animated;
  Easing = ReactNative.Easing;
} catch (e) {
  console.warn('Animated API not available, using fallback');
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
  const [loaded, setLoaded] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.96)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate in when component mounts
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      })
    ]).start();
  }, []);
  
  const category = foodItem.category || 'other';
  const categoryColor = Colors[category] || Colors.other;
  
  const isExpiringSoon = foodItem.expiryDate
    ? new Date(foodItem.expiryDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    : false;

  const isExpired = foodItem.expiryDate
    ? new Date(foodItem.expiryDate) < new Date()
    : false;
    
  // Get days remaining until expiry
  const daysRemaining = foodItem.expiryDate 
    ? getDaysFromToday(new Date(foodItem.expiryDate))
    : null;
    
  // Determine background color based on expiry status
  const getStatusColor = () => {
    if (isExpired) return Colors.danger;
    if (isExpiringSoon) return Colors.warning;
    return Colors.success;
  };
  
  // Badge color based on expiry
  const badgeColor = getStatusColor();
  
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 40
    }).start();
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
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Pressable
        style={styles.pressable}
        onPress={() => onPress(foodItem)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={getImageUrl()}
            style={styles.image}
            contentFit="cover"
            transition={300}
            placeholder={{ color: 'rgba(200, 200, 200, 0.5)' }}
            onLoadEnd={() => setLoaded(true)}
            cachePolicy="memory-disk"
          />
          
          {foodItem.expiryDate && (
            <View style={[
              styles.expiryBadge,
              { backgroundColor: badgeColor + 'E6' } // Add opacity
            ]}>
              {daysRemaining !== null && (
                <>
                  <Calendar 
                    size={12} 
                    color="#FFF" 
                    style={styles.badgeIcon} 
                  />
                  <Text style={styles.badgeText}>
                    {isExpired 
                      ? 'Expired' 
                      : daysRemaining === 0 
                        ? 'Today'
                        : daysRemaining === 1 
                          ? '1 day'
                          : `${daysRemaining} days`
                    }
                  </Text>
                </>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{foodItem.name}</Text>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <ShoppingBag size={14} color="#9A9A9A" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {foodItem.quantity || 1} {foodItem.unit || 'item'}
                {(foodItem.quantity || 1) > 1 && foodItem.unit !== 'kg' && foodItem.unit !== 'g' && 's'}
              </Text>
            </View>
            
            {foodItem.isOpen && (
              <View style={styles.openedBadge}>
                <Droplets size={12} color="#FFF" />
                <Text style={styles.openedText}>Opened</Text>
              </View>
            )}
          </View>
          
          {foodItem.expiryDate && (
            <View style={styles.expiryContainer}>
              <Text style={[
                styles.expiryDate,
                isExpired && styles.expiredDate,
                isExpiringSoon && !isExpired && styles.expiringDate
              ]}>
                {isExpired ? 'Expired on ' : 'Expires '} 
                {formatDate(foodItem.expiryDate)}
              </Text>
            </View>
          )}
        </View>
        
        {shouldUseGradient && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.02)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressable: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 16,
    height: 110,
  },
  imageContainer: {
    position: 'relative',
    width: 110,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  expiryBadge: {
    position: 'absolute',
    top: 12,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  openedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 209, 197, 0.9)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  openedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  expiryContainer: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  expiryDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  expiredDate: {
    color: Colors.danger,
    fontWeight: '600',
  },
  expiringDate: {
    color: Colors.warning,
    fontWeight: '600',
  },
});

export default FoodItemCard;
