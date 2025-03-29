import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePantryStore } from '@/store/pantryStore';
import { Recipe } from '@/types';
import { fetchRecipesByIngredients } from '@/utils/api';
import RecipeCard from '@/components/RecipeCard';
import Colors from '@/constants/colors';
import { Search, RefreshCw } from 'lucide-react-native';
import EmptyState from '@/components/EmptyState';

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

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items } = usePantryStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRecipes = useCallback(async () => {
    if (items.length === 0) {
      // No pantry items, so no need to fetch recipes
      setRecipes([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert pantry items to ingredient names
      const ingredients = items.map(item => item.name);
      
      // Fetch recipes based on ingredients
      const fetchedRecipes = await fetchRecipesByIngredients(ingredients);
      
      setRecipes(fetchedRecipes);
      console.log(`Fetched ${fetchedRecipes.length} recipes`);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to fetch recipes. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [items]);
  
  // Fetch recipes when the component mounts or items change
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);
  
  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '../recipe-details',
      params: { id: recipe.id }
    });
  };
  
  const handleRefresh = () => {
    fetchRecipes();
  };
  
  const renderItem = useCallback(({ item }: { item: Recipe }) => (
    <RecipeCard recipe={item} onPress={handleRecipePress} />
  ), [handleRecipePress]);
  
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
  
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding recipes for your ingredients...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    
    if (items.length === 0) {
      return (
        <EmptyState
          title="Your pantry is empty"
          message="Add items to your pantry to get recipe suggestions."
          imageUrl="https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=300"
        />
      );
    }
    
    return (
      <EmptyState
        title="No recipes found"
        message="Try adding more ingredients to your pantry or refresh to find recipes."
        imageUrl="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=300"
      />
    );
  };
  
  // Calculate the bottom padding to avoid the tab bar
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 75;
  const bottomPadding = insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10;
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      <HeaderComponent {...headerProps}>
        <Text style={styles.title}>Recipes</Text>
        <View style={styles.headerButtons}>
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={handleRefresh}
          >
            <RefreshCw size={20} color="#FFFFFF" />
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed
            ]}
            onPress={() => router.push('../search-recipes')}
          >
            <Search size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </HeaderComponent>
      
      <View style={styles.contentContainer}>
        <FlatList
          data={recipes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPadding }
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});