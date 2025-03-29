import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Recipe } from "@/types";
import Colors from "@/constants/colors";
import { Clock, Users, ThumbsUp } from "lucide-react-native";
import CardContainer from "@/components/CardContainer";

// Conditional imports to handle potential errors
let LinearGradient: any = View;

// Try to import the libraries, but use fallbacks if they fail
try {
  // First try the Expo version of LinearGradient
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch (e) {
  try {
    // Fall back to react-native-linear-gradient if Expo version fails
    LinearGradient = require("react-native-linear-gradient").LinearGradient;
  } catch (e) {
    console.warn("Linear gradient not available, using fallback");
  }
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;

  const GradientComponent = shouldUseGradient ? LinearGradient : View;

  const imageGradientProps = shouldUseGradient
    ? {
        colors: ["rgba(0,0,0,0.5)", "rgba(0,0,0,0.3)", "transparent"],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        style: styles.imageGradient,
      }
    : {
        style: [styles.imageGradient, { backgroundColor: "rgba(0,0,0,0.3)" }],
      };

  const ingredientsGradientProps = shouldUseGradient
    ? {
        colors: [Colors.primaryLight, Colors.card],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: styles.ingredientsContainer,
      }
    : {
        style: [
          styles.ingredientsContainer,
          { backgroundColor: Colors.primaryLight },
        ],
      };

  return (
    <CardContainer style={styles.container} elevation="medium">
      <Pressable
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        onPress={() => onPress(recipe)}
        android_ripple={{ color: Colors.shadowLight }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={recipe.imageUrl}
            style={styles.image}
            contentFit="cover"
            transition={300}
            placeholder="blur"
          />

          {/* Gradient overlay on image */}
          <GradientComponent {...imageGradientProps} />

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
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

          <GradientComponent {...ingredientsGradientProps}>
            <Text style={styles.ingredientsText}>
              Uses {recipe.usedIngredientCount} of your ingredients
              {recipe.missedIngredientCount > 0 &&
                ` (missing ${recipe.missedIngredientCount})`}
            </Text>
          </GradientComponent>
        </View>
      </Pressable>
    </CardContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderWidth: 0,
  },
  pressable: {
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#f0f0f0",
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  titleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    padding: 16,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  ingredientsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ingredientsText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
});

export default RecipeCard;
