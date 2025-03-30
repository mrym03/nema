import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePantryStore } from '@/store/pantryStore';
import { FoodItem, FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import { getExpiringItems, sortByExpiryDate } from '@/utils/helpers';
import FoodItemCard from '@/components/FoodItemCard';
import ExpiringFoodAlert from '@/components/ExpiringFoodAlert';
import EmptyState from '@/components/EmptyState';
import AddItemButton from '@/components/AddItemButton';
import CategoryPicker from '@/components/CategoryPicker';
import { Filter, Plus, Trash2, RefreshCcw } from 'lucide-react-native';
import PrimaryButton from '@/components/PrimaryButton';
import CardContainer from '@/components/CardContainer';

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

export default function PantryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, clearAllItems } = usePantryStore();
  const flatListRef = useRef<FlatList>(null);
  
  console.log('PantryScreen: Store initialized with', items.length, 'items');
  console.log('PantryScreen: First few items:', items.slice(0, 3));
  
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Debug log for the selected category
  console.log('PantryScreen: selectedCategory =', selectedCategory);
  
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
  
  const refreshList = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };
  
  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;
  const AnimatableView = Animatable.View || View;
  
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
  
  const renderItem = useCallback(({ item, index }: { item: FoodItem; index: number }) => (
    <AnimatableView
      animation="fadeInUp"
      duration={400}
      delay={index * 50}
      useNativeDriver
    >
      <FoodItemCard foodItem={item} onPress={handleItemPress} />
    </AnimatableView>
  ), []);
  
  const renderEmptyState = () => (
    <AnimatableView animation="fadeIn" duration={800}>
      <EmptyState
        title="Your pantry is empty"
        message="Add items to your pantry to start tracking your food and reduce waste."
        imageUrl="https://images.unsplash.com/photo-1584473457493-17c4c24290c5?q=80&w=300"
      />
    </AnimatableView>
  );
  
  // Calculate the bottom padding to avoid the tab bar and add button overlap
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 75;
  const addButtonHeight = 56; // Approximate height of the add button with margin
  const bottomPadding = (insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10) + addButtonHeight;
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <HeaderComponent {...headerProps}>
        <Text style={styles.title}>My Pantry</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={refreshList}
          >
            <RefreshCcw size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={handleClearPantry}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: showFilters ? 'rgba(255,255,255,0.3)' : 'transparent' },
              pressed && styles.pressed
            ]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </HeaderComponent>
      
      <View style={styles.contentContainer}>
        {expiringItems.length > 0 && (
          <AnimatableView 
            animation="slideInDown" 
            duration={500}
            style={styles.alertContainer}
          >
            <ExpiringFoodAlert 
              items={expiringItems} 
              onPress={handleExpiringPress} 
            />
          </AnimatableView>
        )}
        
        {showFilters && (
          <AnimatableView 
            animation="fadeIn"
            duration={400}
          >
            <CardContainer style={styles.filterContainer} elevation="low">
              <Text style={styles.filterHeader}>Filter by Category</Text>
              <CategoryPicker
                selectedCategory={selectedCategory as FoodCategory}
                onSelectCategory={(category) => {
                  // Toggle selected category
                  const newCategory = category === selectedCategory ? null : category;
                  setSelectedCategory(newCategory);
                }}
              />
            </CardContainer>
          </AnimatableView>
        )}
        
        <FlatList
          ref={flatListRef}
          data={sortedItems}
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
          <AddItemButton onPress={handleAddItem} />
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
  alertContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    right: 24,
    elevation: 8,
    zIndex: 10,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  filterContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
  },
  filterHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
});