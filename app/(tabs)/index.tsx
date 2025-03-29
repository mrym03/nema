import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantryStore } from '@/store/pantryStore';
import { FoodItem } from '@/types';
import Colors from '@/constants/colors';
import { getExpiringItems, sortByExpiryDate } from '@/utils/helpers';
import FoodItemCard from '@/components/FoodItemCard';
import ExpiringFoodAlert from '@/components/ExpiringFoodAlert';
import EmptyState from '@/components/EmptyState';
import AddItemButton from '@/components/AddItemButton';
import CategoryPicker from '@/components/CategoryPicker';
import { Filter, Plus, Trash2 } from 'lucide-react-native';

export default function PantryScreen() {
  const router = useRouter();
  const { items, clearAllItems } = usePantryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const expiringItems = getExpiringItems(items);
  
  const filteredItems = selectedCategory
    ? items.filter(item => item.category === selectedCategory)
    : items;
  
  const sortedItems = sortByExpiryDate(filteredItems);
  
  const handleAddItem = () => {
    router.push('../add-item');
  };
  
  const handleItemPress = (item: FoodItem) => {
    router.push({
      pathname: '../item-details',
      params: { id: item.id }
    });
  };
  
  const handleExpiringPress = () => {
    setSelectedCategory(null);
    setShowFilters(true);
  };
  
  const handleClearPantry = () => {
    Alert.alert(
      'Clear Pantry',
      'Are you sure you want to remove ALL items from your pantry? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: () => {
            clearAllItems();
            Alert.alert('Success', 'Pantry cleared successfully!');
          }
        }
      ]
    );
  };
  
  const renderItem = useCallback(({ item }: { item: FoodItem }) => (
    <FoodItemCard item={item} onPress={handleItemPress} />
  ), []);
  
  const renderEmptyState = () => (
    <EmptyState
      title="Your pantry is empty"
      message="Add items to your pantry to start tracking your food and reduce waste."
      imageUrl="https://images.unsplash.com/photo-1584473457493-17c4c24290c5?q=80&w=300"
    />
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={handleClearPantry}
          >
            <Trash2 size={20} color={Colors.danger} />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={Colors.text} />
          </Pressable>
        </View>
      </View>
      
      {expiringItems.length > 0 && (
        <View style={styles.alertContainer}>
          <ExpiringFoodAlert 
            items={expiringItems} 
            onPress={handleExpiringPress} 
          />
        </View>
      )}
      
      {showFilters && (
        <CategoryPicker
          selectedCategory={selectedCategory as any || 'other'}
          onSelectCategory={(category) => 
            setSelectedCategory(category === selectedCategory ? null : category)
          }
        />
      )}
      
      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />
      
      <View style={styles.addButtonContainer}>
        <AddItemButton onPress={handleAddItem} />
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  pressed: {
    opacity: 0.7,
  },
  alertContainer: {
    paddingHorizontal: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});