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
          {foodItem.imageUrl ? (
            <Image
              source={foodItem.imageUrl}
              style={styles.image}
              contentFit="cover"
              transition={300}
              placeholder="blur"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: categoryColor + '30' }]}>
              <Text style={[styles.placeholderText, { color: categoryColor }]}>
                {foodItem.name?.substring(0, 1).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          {/* Category tag */}
          <GradientComponent {...categoryGradientProps}>
            <Text style={[styles.categoryText, { color: categoryTextColor }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </GradientComponent>
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
});

export default FoodItemCard;
