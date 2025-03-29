import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Recipe } from '@/types';
import Colors from '@/constants/colors';
import { Clock, Users, ThumbsUp } from 'lucide-react-native';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={() => onPress(recipe)}
    >
      <Image
        source={recipe.imageUrl}
        style={styles.image}
        contentFit="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Clock size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{recipe.readyInMinutes} min</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Users size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          </View>
          
          <View style={styles.metaItem}>
            <ThumbsUp size={16} color={Colors.textLight} />
            <Text style={styles.metaText}>{recipe.likes}</Text>
          </View>
        </View>
        
        <View style={styles.ingredientsContainer}>
          <Text style={styles.ingredientsText}>
            Uses {recipe.usedIngredientCount} of your ingredients
            {recipe.missedIngredientCount > 0 && ` (missing ${recipe.missedIngredientCount})`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  ingredientsContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ingredientsText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});

export default RecipeCard;