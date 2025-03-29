import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { FoodCategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import Colors from '@/constants/colors';
import * as Icons from 'lucide-react-native';

interface CategoryPickerProps {
  selectedCategory: FoodCategory;
  onSelectCategory: (category: FoodCategory) => void;
}

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
      {Object.entries(CATEGORIES).map(([key, category]) => {
        const isSelected = key === selectedCategory;
        const IconComponent = Icons[category.icon as keyof typeof Icons] || Icons.Package;
        
        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.categoryItem,
              isSelected && styles.selectedItem,
              pressed && styles.pressed
            ]}
            onPress={() => onSelectCategory(key as FoodCategory)}
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
            <Text 
              style={[
                styles.categoryName,
                isSelected && styles.selectedText
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  selectedItem: {
    transform: [{ scale: 1.05 }],
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  selectedText: {
    color: Colors.text,
    fontWeight: '600',
  },
});

export default CategoryPicker;