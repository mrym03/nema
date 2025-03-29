import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingListStore } from '@/store/shoppingListStore';
import { ShoppingListItem as ShoppingListItemType, FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import ShoppingListItem from '@/components/ShoppingListItem';
import EmptyState from '@/components/EmptyState';
import AddItemButton from '@/components/AddItemButton';
import { Trash2, Plus } from 'lucide-react-native';
import { generateId } from '@/utils/helpers';

export default function ShoppingListScreen() {
  const { items, addItem, removeItem, toggleItemCompleted, clearCompletedItems } = useShoppingListStore();
  const [newItemName, setNewItemName] = useState('');
  
  const completedItems = items.filter(item => item.completed);
  const incompleteItems = items.filter(item => !item.completed);
  
  const handleAddItem = () => {
    if (newItemName.trim()) {
      addItem({
        name: newItemName.trim(),
        category: 'other',
        quantity: 1,
        unit: 'item',
      });
      setNewItemName('');
    }
  };
  
  const renderItem = ({ item }: { item: ShoppingListItemType }) => (
    <ShoppingListItem
      item={item}
      onToggle={toggleItemCompleted}
      onDelete={removeItem}
    />
  );
  
  const renderEmptyState = () => (
    <EmptyState
      title="Your shopping list is empty"
      message="Add items to your shopping list to keep track of what you need to buy."
      imageUrl="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300"
    />
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        {completedItems.length > 0 && (
          <Pressable 
            style={({ pressed }) => [
              styles.clearButton,
              pressed && styles.pressed
            ]}
            onPress={clearCompletedItems}
          >
            <Trash2 size={16} color={Colors.textLight} />
            <Text style={styles.clearButtonText}>Clear completed</Text>
          </Pressable>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add an item..."
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <Pressable 
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed
          ]}
          onPress={handleAddItem}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>
      
      <FlatList
        data={[...incompleteItems, ...completedItems]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  pressed: {
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});