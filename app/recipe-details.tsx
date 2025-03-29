import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';
import { Clock, Users, ThumbsUp, ExternalLink, ArrowLeft, Check, X } from 'lucide-react-native';
import HTMLView from 'react-native-htmlview';

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipeById, isLoading } = useRecipeStore();
  
  const recipe = getRecipeById(id);
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipe details...</Text>
      </View>
    );
  }
  
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
    if (recipe.sourceUrl) {
      Linking.openURL(recipe.sourceUrl);
    } else {
      // If no source URL, show a message or handle as needed
      console.log('No source URL available for this recipe');
    }
  };
  
  // Clean up HTML content for display
  const cleanSummary = recipe.summary
    ? recipe.summary.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g, '$2')
    : 'No summary available for this recipe.';
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: recipe.title,
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed
              ]}
            >
              <ArrowLeft size={24} color={Colors.text} />
            </Pressable>
          )
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Image
            source={recipe.imageUrl}
            style={styles.image}
            contentFit="cover"
            placeholder="Loading..."
            transition={300}
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
              <View style={styles.ingredientsInfo}>
                <View style={styles.ingredientRow}>
                  <Check size={16} color={Colors.success} />
                  <Text style={styles.ingredientText}>
                    {recipe.usedIngredientCount} ingredient{recipe.usedIngredientCount !== 1 ? 's' : ''} from your pantry
                  </Text>
                </View>
                
                {recipe.missedIngredientCount > 0 && (
                  <View style={styles.ingredientRow}>
                    <X size={16} color={Colors.danger} />
                    <Text style={styles.ingredientText}>
                      {recipe.missedIngredientCount} additional ingredient{recipe.missedIngredientCount !== 1 ? 's' : ''} needed
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>About this Recipe</Text>
              <HTMLView
                value={`<div>${cleanSummary}</div>`}
                stylesheet={htmlStyles}
              />
            </View>
            
            <Pressable 
              style={({ pressed }) => [
                styles.viewRecipeButton,
                pressed && styles.pressed,
                !recipe.sourceUrl && styles.disabledButton
              ]}
              onPress={handleOpenRecipe}
              disabled={!recipe.sourceUrl}
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

const htmlStyles = StyleSheet.create({
  div: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  p: {
    marginBottom: 10,
  },
  b: {
    fontWeight: 'bold',
  },
  i: {
    fontStyle: 'italic',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 30, // Add extra padding at the bottom
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 12,
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
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientsInfo: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.text,
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
  disabledButton: {
    backgroundColor: Colors.textLight,
    opacity: 0.7,
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