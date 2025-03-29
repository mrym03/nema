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

const CategoryPicker: React.FC<CategoryPickerProps> = ({ 
  selectedCategory, 
  onSelectCategory 
}) => {
  console.log('CategoryPicker: rendering with selectedCategory =', selectedCategory);
  
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {Object.entries(CATEGORIES).map(([key, category]) => {
        const isSelected = selectedCategory ? key === selectedCategory : false;
        // Get the appropriate icon component for this category
        const IconComponent = categoryIcons[key] || Package;
        
        return (
          <TouchableOpacity
            key={key}
            style={styles.categoryItem}
            activeOpacity={0.7}
            onPress={() => {
              console.log('TouchableOpacity pressed for category:', key);
              onSelectCategory(key as FoodCategory);
            }}
          >
            <View 
              style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? category.color : '#f0f0f0' }
              ]}
            >
              <IconComponent 
                size={20} 
                color={isSelected ? '#fff' : Colors.textLight} 
              />
            </View>
            
            <View style={[
              styles.textContainer,
              isSelected && { backgroundColor: category.color + '30' }
            ]}>
              <Text style={[
                styles.categoryName,
                isSelected && { color: category.color, fontWeight: '700' }
              ]}>
                {category.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 6,
    width: 80,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  textContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  }
});

export default CategoryPicker;