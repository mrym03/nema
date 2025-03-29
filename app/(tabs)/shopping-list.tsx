import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingListStore } from '@/store/shoppingListStore';
import { ShoppingListItem as ShoppingListItemType, FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import ShoppingListItem from '@/components/ShoppingListItem';
import EmptyState from '@/components/EmptyState';
import { Plus, Trash2 } from 'lucide-react-native';

export default function ShoppingListScreen() {
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
  
  const renderItem = useCallback(({ item }) => (
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
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={handleClearCompleted}
          >
            <Trash2 size={20} color={Colors.danger} />
          </Pressable>
        </View>
      </View>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
      
      <View style={styles.addButtonContainer}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  pressed: {
    opacity: 0.7,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Increase to ensure content doesn't get hidden behind tab bar
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    elevation: 5, // Add elevation for Android
    zIndex: 5, // Add zIndex for iOS
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