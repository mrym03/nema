import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FoodCategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import Colors from '@/constants/colors';
import * as Icons from 'lucide-react-native';
import { 
  Apple, 
  Leaf, 
  Milk, 
  Beef, 
  Fish, 
  Wheat, 
  Cookie, 
  Package, 
  Snowflake, 
  Candy, 
  Coffee, 
  Utensils, 
  Flame,
} from 'lucide-react-native';

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

// Map of category keys to icon components
const categoryIcons: Record<string, React.ComponentType<any>> = {
  fruits: Apple,
  vegetables: Leaf,
  dairy: Milk,
  meat: Beef,
  seafood: Fish,
  grains: Wheat,
  bakery: Cookie,
  canned: Package,
  frozen: Snowflake,
  snacks: Candy,
  beverages: Coffee,
  condiments: Utensils,
  spices: Flame,
  other: Package,
};

interface CategoryPickerProps {
  selectedCategory: FoodCategory | null;
  onSelectCategory: (category: FoodCategory) => void;
}

const CategoryPickerItem = ({ 
  category, 
  categoryKey, 
  isSelected, 
  onSelect,
  index 
}: { 
  category: { color: string, label: string }, 
  categoryKey: string, 
  isSelected: boolean, 
  onSelect: () => void,
  index: number 
}) => {
  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // Animate in with delay based on index
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic)
    }).start();
  }, []);
  
  React.useEffect(() => {
    // Animate scale when selected state changes
    Animated.timing(scaleAnim, {
      toValue: isSelected ? 1.05 : 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5))
    }).start();
  }, [isSelected]);
  
  // Should use gradient if available
  const shouldUseGradient = LinearGradient !== View;
  
  // Get the appropriate icon component for this category
  const IconComponent = categoryIcons[categoryKey] || Package;
  
  // Create gradient or solid background based on availability
  const BackgroundComponent = shouldUseGradient ? LinearGradient : View;
  const backgroundProps = shouldUseGradient
    ? {
        colors: isSelected ? 
          [category.color, category.color + '80'] : 
          ['#F5F5F5', '#EFEFEF'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: styles.categoryItemBackground
      }
    : {
        style: [
          styles.categoryItemBackground,
          { backgroundColor: isSelected ? category.color : '#F5F5F5' }
        ]
      };
  
  const handlePress = () => {
    // Small scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: isSelected ? 1 : 1.05,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      })
    ]).start();
    
    onSelect();
  };
  
  return (
    <Animated.View
      style={[
        styles.categoryItemContainer,
        { 
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }] 
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.touchableArea}
      >
        <BackgroundComponent {...backgroundProps}>
          <View style={styles.categoryContent}>
            <View style={[
              styles.iconContainer,
              isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
            ]}>
              <IconComponent 
                size={22} 
                color={isSelected ? '#fff' : category.color} 
                strokeWidth={2}
              />
            </View>
            
            <Text 
              style={[
                styles.categoryName,
                isSelected && styles.selectedText
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {category.label}
            </Text>
          </View>
        </BackgroundComponent>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CategoryPicker: React.FC<CategoryPickerProps> = ({ 
  selectedCategory, 
  onSelectCategory 
}) => {
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {Object.entries(CATEGORIES).map(([key, category], index) => {
        const isSelected = selectedCategory ? key === selectedCategory : false;
        
        return (
          <CategoryPickerItem
            key={key}
            category={category}
            categoryKey={key}
            isSelected={isSelected}
            onSelect={() => onSelectCategory(key as FoodCategory)}
            index={index}
          />
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  categoryItemContainer: {
    marginHorizontal: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  touchableArea: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryItemBackground: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 100,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    width: '100%',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});

export default CategoryPicker;