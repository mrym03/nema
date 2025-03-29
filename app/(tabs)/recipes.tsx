import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '@/store/recipeStore';
import { usePantryStore } from '@/store/pantryStore';
import { Recipe } from '@/types';
import Colors from '@/constants/colors';
import RecipeCard from '@/components/RecipeCard';
import EmptyState from '@/components/EmptyState';

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, isLoading, fetchRecipes } = useRecipeStore();
  const { items } = usePantryStore();
  
  useEffect(() => {
    // In a real app, we would extract ingredient names and pass them to fetchRecipes
    const ingredientNames = items.map(item => item.name);
    fetchRecipes(ingredientNames);
  }, [items]);
  
  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: '/recipe-details',
      params: { id: recipe.id }
    });
  };
  
  const renderItem = ({ item }: { item: Recipe }) => (
    <RecipeCard recipe={item} onPress={handleRecipePress} />
  );
  
  const renderEmptyState = () => (
    <EmptyState
      title="No recipes found"
      message={
        items.length === 0
          ? "Add items to your pantry to get recipe suggestions."
          : "We couldn't find any recipes with your current ingredients. Try adding more items to your pantry."
      }
      imageUrl="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=300"
    />
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Suggestions</Text>
        <Text style={styles.subtitle}>
          Based on {items.length} items in your pantry
        </Text>
      </View>
      
      <FlatList
        data={recipes}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
  },
  listContent: {
    padding: 16,
  },
});