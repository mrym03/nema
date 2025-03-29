import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';
import { Clock, Users, ThumbsUp, ExternalLink } from 'lucide-react-native';

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipeById } = useRecipeStore();
  
  const recipe = getRecipeById(id);
  
  if (!recipe) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Recipe not found</Text>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  const handleOpenRecipe = () => {
    Linking.openURL(recipe.sourceUrl);
  };
  
  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView>
          <Image
            source={recipe.imageUrl}
            style={styles.image}
            contentFit="cover"
          />
          
          <View style={styles.content}>
            <Text style={styles.title}>{recipe.title}</Text>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Clock size={18} color={Colors.textLight} />
                <Text style={styles.metaText}>{recipe.readyInMinutes} min</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Users size={18} color={Colors.textLight} />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
              
              <View style={styles.metaItem}>
                <ThumbsUp size={18} color={Colors.textLight} />
                <Text style={styles.metaText}>{recipe.likes}</Text>
              </View>
            </View>
            
            <View style={styles.ingredientsContainer}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>
                This recipe uses {recipe.usedIngredientCount} ingredients from your pantry
                {recipe.missedIngredientCount > 0 && ` and requires ${recipe.missedIngredientCount} additional ingredients`}.
              </Text>
            </View>
            
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>About this Recipe</Text>
              <Text style={styles.summaryText}>{recipe.summary}</Text>
            </View>
            
            <Pressable 
              style={({ pressed }) => [
                styles.viewRecipeButton,
                pressed && styles.pressed
              ]}
              onPress={handleOpenRecipe}
            >
              <Text style={styles.viewRecipeButtonText}>View Full Recipe</Text>
              <ExternalLink size={20} color="#fff" />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 16,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  ingredientsContainer: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  ingredientsText: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 22,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  viewRecipeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});