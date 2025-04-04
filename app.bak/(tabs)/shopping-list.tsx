import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShoppingListStore } from '@/store/shoppingListStore';
import { ShoppingListItem as ShoppingListItemType, FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import ShoppingListItem from '@/components/ShoppingListItem';
import EmptyState from '@/components/EmptyState';
import { Plus, Trash2 } from 'lucide-react-native';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animatable: any = { View };

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
  Animatable = require('react-native-animatable');
} catch (e) {
  console.warn('react-native-animatable not available, using fallback');
}

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const { items, addItem, updateItem, removeItem, clearCompletedItems } = useShoppingListStore();
  
  const handleAddItem = () => {
    Alert.prompt(
      "Add Item",
      "Enter item name",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Add",
          onPress: name => {
            if (name && name.trim()) {
              addItem({
                name: name.trim(),
                category: 'other',
                quantity: 1,
                unit: 'item'
              });
            }
          }
        }
      ]
    );
  };
  
  const handleClearCompleted = () => {
    if (items.some(item => item.completed)) {
      Alert.alert(
        "Clear Completed Items",
        "Are you sure you want to remove all completed items?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => clearCompletedItems()
          }
        ]
      );
    } else {
      Alert.alert("No Completed Items", "There are no completed items to clear.");
    }
  };
  
  const renderItem = useCallback(({ item }: { item: ShoppingListItemType }) => (
    <ShoppingListItem
      item={item}
      onToggle={() => updateItem(item.id, { completed: !item.completed })}
      onRemove={() => removeItem(item.id)}
    />
  ), [updateItem, removeItem]);
  
  const renderEmptyState = () => (
    <EmptyState
      title="Your shopping list is empty"
      message="Add items to your shopping list to keep track of what you need to buy."
      imageUrl="https://images.unsplash.com/photo-1601598851547-4302969d0614?q=80&w=300"
    />
  );
  
  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;
  
  // Header component with conditional gradient
  const HeaderComponent = shouldUseGradient ? LinearGradient : View;
  const headerProps = shouldUseGradient
    ? {
        colors: [Colors.primary, Colors.primaryDark],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: [
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top : 16 }
        ]
      }
    : {
        style: [
          styles.header, 
          { backgroundColor: Colors.primary },
          { paddingTop: insets.top > 0 ? insets.top : 16 }
        ]
      };
  
  // Calculate the bottom padding to avoid the tab bar and add button overlap
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 75;
  const addButtonHeight = 56; // Approximate height of the add button with margin
  const bottomPadding = (insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10) + addButtonHeight;
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <HeaderComponent {...headerProps}>
        <Text style={styles.title}>Shopping List</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={handleClearCompleted}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </HeaderComponent>
      
      <View style={styles.contentContainer}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding }
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
        
        <View style={[
          styles.addButtonContainer, 
          { bottom: Math.max(insets.bottom + tabBarHeight - 15, tabBarHeight) }
        ]}>
          <Pressable 
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed
            ]}
            onPress={handleAddItem}
          >
            <Plus size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }]
  },
  listContent: {
    padding: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    right: 24,
    elevation: 8,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});