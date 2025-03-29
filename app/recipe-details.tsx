import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useRecipeStore } from '@/store/recipeStore';
import Colors from '@/constants/colors';
import { Clock, Users, ThumbsUp, ExternalLink, ArrowLeft, Check, X } from 'lucide-react-native';
import HTMLView from 'react-native-htmlview';
import * as Animatable from 'react-native-animatable';
import CardContainer from '@/components/CardContainer';
import PrimaryButton from '@/components/PrimaryButton';

// Conditional imports to handle potential errors
let LinearGradient: any = View;

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
        <PrimaryButton 
          title="Go Back"
          onPress={() => router.back()}
          width={150}
        />
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
  
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  const GradientComponent = shouldUseGradient ? LinearGradient : View;
  
  const headerGradientProps = shouldUseGradient
    ? {
        colors: ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)', 'transparent'],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        style: styles.imageGradient
      }
    : {
        style: [styles.imageGradient, { backgroundColor: 'rgba(0,0,0,0.5)' }]
      };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageContainer}>
            <Image
              source={recipe.imageUrl}
              style={styles.image}
              contentFit="cover"
              placeholder="Loading..."
              transition={300}
            />
            
            <GradientComponent {...headerGradientProps}>
              <Pressable 
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed
                ]}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
            </GradientComponent>
            
            <View style={styles.titleContainer}>
              <Animatable.Text animation="fadeIn" style={styles.title}>
                {recipe.title}
              </Animatable.Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Animatable.View 
              animation="fadeInUp" 
              duration={600} 
              delay={100}
              style={styles.metaContainer}
            >
              <CardContainer style={styles.metaCard} elevation="low">
                <View style={styles.metaIcon}>
                  <Clock size={24} color={Colors.primary} />
                </View>
                <Text style={styles.metaValue}>{recipe.readyInMinutes}</Text>
                <Text style={styles.metaLabel}>minutes</Text>
              </CardContainer>
              
              <CardContainer style={styles.metaCard} elevation="low">
                <View style={styles.metaIcon}>
                  <Users size={24} color={Colors.primary} />
                </View>
                <Text style={styles.metaValue}>{recipe.servings}</Text>
                <Text style={styles.metaLabel}>servings</Text>
              </CardContainer>
              
              <CardContainer style={styles.metaCard} elevation="low">
                <View style={styles.metaIcon}>
                  <ThumbsUp size={24} color={Colors.primary} />
                </View>
                <Text style={styles.metaValue}>{recipe.likes}</Text>
                <Text style={styles.metaLabel}>likes</Text>
              </CardContainer>
            </Animatable.View>
            
            <Animatable.View animation="fadeInUp" duration={600} delay={200}>
              <CardContainer style={styles.ingredientsContainer} elevation="medium">
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <View style={styles.ingredientsInfo}>
                  <View style={styles.ingredientRow}>
                    <View style={styles.checkIconContainer}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.ingredientText}>
                      {recipe.usedIngredientCount} ingredient{recipe.usedIngredientCount !== 1 ? 's' : ''} from your pantry
                    </Text>
                  </View>
                  
                  {recipe.missedIngredientCount > 0 && (
                    <View style={styles.ingredientRow}>
                      <View style={[styles.checkIconContainer, styles.missedIconContainer]}>
                        <X size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.ingredientText}>
                        {recipe.missedIngredientCount} additional ingredient{recipe.missedIngredientCount !== 1 ? 's' : ''} needed
                      </Text>
                    </View>
                  )}
                </View>
              </CardContainer>
            </Animatable.View>
            
            <Animatable.View animation="fadeInUp" duration={600} delay={300}>
              <CardContainer style={styles.summaryContainer} elevation="medium">
                <Text style={styles.sectionTitle}>About this Recipe</Text>
                <HTMLView
                  value={`<div>${cleanSummary}</div>`}
                  stylesheet={htmlStyles}
                />
              </CardContainer>
            </Animatable.View>
            
            <Animatable.View animation="fadeInUp" duration={600} delay={400} style={styles.buttonContainer}>
              <PrimaryButton
                title="View Full Recipe"
                onPress={handleOpenRecipe}
                disabled={!recipe.sourceUrl}
                icon={<ExternalLink size={20} color="#FFFFFF" />}
              />
            </Animatable.View>
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
  imageContainer: {
    position: 'relative',
    height: 280,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
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
  content: {
    padding: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metaCard: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: '30%',
  },
  metaIcon: {
    marginBottom: 8,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  metaLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  ingredientsContainer: {
    padding: 16,
    marginBottom: 24,
  },
  ingredientsInfo: {
    gap: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIconContainer: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missedIconContainer: {
    backgroundColor: Colors.danger,
  },
  ingredientText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
    flex: 1,
  },
  summaryContainer: {
    padding: 16,
    marginBottom: 24,
  },
  buttonContainer: {
    marginBottom: 24,
  },
});