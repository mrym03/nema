import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Recipe } from "@/types";
import Colors from "@/constants/colors";
import {
  Clock,
  Users,
  ThumbsUp,
  ShoppingCart,
  Check,
  Heart,
} from "lucide-react-native";
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
  onPress: () => void;
  isSelected: boolean;
  onToggleSelect: (recipe: Recipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  isSelected,
  onToggleSelect,
}) => {
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

  const handleToggleSelect = (e: any) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(recipe);
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        android_ripple={{ color: Colors.shadowLight }}
      >
        <View style={styles.imageContainer}>
          <Image
            source={recipe.imageUrl || "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?q=80&w=300"}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {recipe.title}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Clock size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{recipe.readyInMinutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          </View>
          <View style={styles.usedIngredients}>
            <Text style={styles.ingredientText}>
              Uses {recipe.usedIngredientCount} of your ingredients
              {recipe.missedIngredientCount > 0 && 
                ` (missing ${recipe.missedIngredientCount})`}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable 
        style={[styles.selectButton, isSelected && styles.selectedButton]}
        onPress={() => onToggleSelect(recipe)}
      >
        {isSelected ? (
          <Heart size={18} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Heart size={18} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: "48%", // Use percentage instead of fixed width
    marginBottom: 16,
    marginHorizontal: "1%", // Add small margin between cards
    position: "relative",
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageContainer: {
    position: "relative",
    height: 140,
    backgroundColor: Colors.border,
  },
  image: {
    flex: 1,
    backgroundColor: Colors.border,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
    height: 40, // Fixed height for title (2 lines)
  },
  metaContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
    marginLeft: 4,
  },
  usedIngredients: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingRight: 8, // Add padding to prevent text overlap with button
  },
  ingredientText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  selectedButton: {
    backgroundColor: Colors.primary,
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  ingredientsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default RecipeCard;
