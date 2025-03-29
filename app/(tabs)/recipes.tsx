import React, { useCallback } from 'react';
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
  
  const handleRecipePress = (recipeId) => {
    router.push({
      pathname: '../recipe-details',
      params: { id: recipeId }
    });
  };
  
  const renderItem = useCallback(({ item }) => (
    <RecipeCard recipe={item} onPress={() => handleRecipePress(item.id)} />
  ), []);
  
  const renderEmptyState = () => (
    <EmptyState
      title="No recipes found"
      message="Recipes based on your pantry items will appear here."
      imageUrl="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=300"
    />
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended Recipes</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Increase to ensure content doesn't get hidden behind tab bar
  },
});