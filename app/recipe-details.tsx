import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useRecipeStore } from "@/store/recipeStore";
import { usePantryStore } from "@/store/pantryStore";
import Colors from "@/constants/colors";
import {
  Clock,
  Users,
  ThumbsUp,
  ExternalLink,
  ArrowLeft,
  Check,
  X,
  ChefHat,
  GripHorizontal,
  ShoppingCart,
  CookingPot,
  PlayCircle,
  Calendar,
} from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Animatable from "react-native-animatable";
import CardContainer from "@/components/CardContainer";
import PrimaryButton from "@/components/PrimaryButton";
import { markIngredientsAsOpened, calculateSustainabilityImpact } from "@/utils/recipeFunctions";
import { FoodItem } from "@/types";

// Try to import HTMLView, with a fallback to our simple HTML stripper if not available
let HTMLView: any = null;
try {
  HTMLView = require("react-native-htmlview").default;
} catch (e) {
  console.warn("HTMLView not available, using fallback HTML stripper");
}

// HTML rendering component that removes HTML tags for plain display when HTMLView isn't available
const HTMLText = ({ html }: { html: string }) => {
  if (!html) return null;

  if (HTMLView) {
    return <HTMLView value={`<div>${html}</div>`} stylesheet={htmlStyles} />;
  }

  // Simple HTML tag removal for plain text display (fallback)
  const plainText = html.replace(/<\/?[^>]+(>|$)/g, "");
  return <Text style={styles.htmlText}>{plainText}</Text>;
};

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

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRecipeById, toggleRecipeSelection, isRecipeSelected } = useRecipeStore();
  const { items: pantryItems } = usePantryStore();
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [cookingComplete, setCookingComplete] = useState(false);
  const [sustainability, setSustainability] = useState<{
    wasteReduction: number;
    co2Reduction: number;
    waterSavings: number;
    percentOfAnnualWaste: number;
  } | null>(null);
  const [recipeAdded, setRecipeAdded] = useState(false);

  useEffect(() => {
    const loadRecipeDetails = async () => {
      try {
        setLoading(true);
        const recipeData = await getRecipeById(id);
        setRecipe(recipeData);
        setRecipeAdded(isRecipeSelected(id));
        setLoading(false);
      } catch (err) {
        console.error("Error loading recipe details:", err);
        setError("Couldn't load recipe details");
        setLoading(false);
      }
    };

    loadRecipeDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipe details...</Text>
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{error || "Recipe not found"}</Text>
        <PrimaryButton
          title="Go Back"
          onPress={() => router.back()}
          width={150}
        />
      </View>
    );
  }

  // Organize ingredients into available and missing
  const getAvailableAndMissingIngredients = () => {
    if (!recipe.extendedIngredients) return { available: [], missing: [] };
    
    // Create lookup of pantry item names (lowercase for case-insensitive matching)
    const pantryItemNames = new Set(
      pantryItems.map(item => item.name.toLowerCase())
    );
    
    const available = [];
    const missing = [];
    
    for (const ingredient of recipe.extendedIngredients) {
      // Try to match ingredient with pantry items
      const name = ingredient.name || ingredient.originalName || '';
      if (pantryItemNames.has(name.toLowerCase()) || 
          pantryItems.some(item => name.toLowerCase().includes(item.name.toLowerCase()))) {
        available.push(ingredient);
      } else {
        missing.push(ingredient);
      }
    }
    
    return { available, missing };
  };

  const { available, missing } = getAvailableAndMissingIngredients();

  const handleOpenRecipe = async () => {
    if (!recipe.sourceUrl) {
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(recipe.sourceUrl);
    } catch (error) {
      console.error("Error opening browser:", error);
      // Fallback to basic linking
      Linking.openURL(recipe.sourceUrl);
    }
  };

  const handleCookRecipe = () => {
    if (available.length === 0) {
      Alert.alert(
        "No Ingredients Available",
        "You don't have any of the required ingredients in your pantry."
      );
      return;
    }

    setIsCooking(true);

    // Find the pantry items that match the available ingredients
    const ingredientIds: string[] = [];
    const usedItems: FoodItem[] = [];
    const usedItemNames: string[] = [];
    const usedQuantities: {[id: string]: number} = {};

    pantryItems.forEach(item => {
      // Check if this pantry item is used in any of the available ingredients
      const matchingIngredient = available.find(ingredient => {
        const ingredientName = (ingredient.name || ingredient.originalName || '').toLowerCase();
        return ingredientName.includes(item.name.toLowerCase()) || 
               item.name.toLowerCase().includes(ingredientName);
      });

      if (matchingIngredient) {
        ingredientIds.push(item.id);
        usedItems.push(item);
        
        // Get the amount used from the recipe
        const amountInRecipe = matchingIngredient.amount && !isNaN(matchingIngredient.amount) 
          ? matchingIngredient.amount 
          : 1;
          
        // Save the amount used for display  
        usedQuantities[item.id] = Math.min(amountInRecipe, item.quantity);
        
        // Format name with quantity for display
        const formattedName = `${item.name} (${usedQuantities[item.id]} ${item.unit || 'item'}${usedQuantities[item.id] > 1 && !['kg', 'g', 'ml', 'l'].includes(item.unit || '') ? 's' : ''})`;
        usedItemNames.push(formattedName);
      }
    });

    // Mark the ingredients as opened and update quantities
    const updatedItems = markIngredientsAsOpened(ingredientIds, available);

    // Calculate sustainability impact
    const impact = calculateSustainabilityImpact(usedItems);
    setSustainability(impact);

    // Create a nicely formatted list of used ingredients
    const ingredientsList = usedItemNames.join('\n• ');

    // Show success message without detailed metrics
    setTimeout(() => {
      setIsCooking(false);
      setCookingComplete(true);
      
      Alert.alert(
        "Recipe Cooked!",
        `You used the following ingredients from your pantry:\n\n• ${ingredientsList}\n\nThese items have been marked as opened or quantities have been updated.`,
        [{ text: "Great!" }]
      );
    }, 1500);
  };

  const handleAddToMealPlan = () => {
    toggleRecipeSelection(recipe);
    setRecipeAdded(!recipeAdded);
    
    if (!recipeAdded) {
      Alert.alert(
        "Recipe Added", 
        "Recipe has been added to your meal planning selection. Go to the Meal Plan tab to organize your weekly meals.",
        [
          { text: "View Meal Plan", onPress: () => router.push("/(tabs)/meal-plan") },
          { text: "Continue Browsing", style: "cancel" }
        ]
      );
    }
  };

  // Clean up HTML content for display
  const cleanSummary = recipe.summary
    ? recipe.summary.replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g,
        "$2"
      )
    : "No summary available for this recipe.";
    
  // Clean up instructions for display
  const cleanInstructions = recipe.instructions
    ? recipe.instructions.replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/g,
        "$2"
      )
    : "No detailed instructions available for this recipe. Please view the full recipe on the source website.";

  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;

  const GradientComponent = shouldUseGradient ? LinearGradient : View;

  const headerGradientProps = shouldUseGradient
    ? {
        colors: [
          "rgba(0,0,0,0.7)",
          "rgba(0,0,0,0.5)",
          "rgba(0,0,0,0.3)",
          "transparent",
        ],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        style: styles.imageGradient,
      }
    : {
        style: [styles.imageGradient, { backgroundColor: "rgba(0,0,0,0.5)" }],
      };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageContainer}>
            {recipe.imageUrl ? (
              <Image
                source={recipe.imageUrl}
                style={styles.image}
                contentFit="cover"
                placeholder="blurhash"
                transition={300}
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}

            <GradientComponent {...headerGradientProps}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed,
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
              <CardContainer
                style={styles.ingredientsContainer}
                elevation="medium"
              >
                <View style={styles.sectionTitleRow}>
                  <GripHorizontal size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Ingredients</Text>
                </View>
                
                <View style={styles.ingredientsInfo}>
                  <View style={styles.ingredientRow}>
                    <View style={styles.checkIconContainer}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.ingredientText}>
                      {recipe.usedIngredientCount} ingredient
                      {recipe.usedIngredientCount !== 1 ? "s" : ""} from your
                      pantry
                    </Text>
                  </View>

                  {recipe.missedIngredientCount > 0 && (
                    <View style={styles.ingredientRow}>
                      <View
                        style={[
                          styles.checkIconContainer,
                          styles.missedIconContainer,
                        ]}
                      >
                        <X size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.ingredientText}>
                        {recipe.missedIngredientCount} additional ingredient
                        {recipe.missedIngredientCount !== 1 ? "s" : ""} needed
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Available ingredients list */}
                {available.length > 0 && (
                  <View style={styles.detailedIngredients}>
                    <Text style={styles.ingredientSubheading}>Available in your pantry:</Text>
                    {available.map((ingredient, index) => (
                      <View key={`available-${index}`} style={styles.detailedIngredientRow}>
                        <View style={styles.bulletPoint}>
                          <Check size={14} color={Colors.success} />
                        </View>
                        <Text style={styles.detailedIngredientText}>
                          {ingredient.amount && !isNaN(ingredient.amount) ? 
                            `${ingredient.amount} ${ingredient.unit || ''} ` : ''}
                          {ingredient.name || ingredient.originalName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Missing ingredients list */}
                {missing.length > 0 && (
                  <View style={styles.detailedIngredients}>
                    <Text style={styles.ingredientSubheading}>Ingredients to buy:</Text>
                    {missing.map((ingredient, index) => (
                      <View key={`missing-${index}`} style={styles.detailedIngredientRow}>
                        <View style={styles.bulletPoint}>
                          <ShoppingCart size={14} color={Colors.danger} />
                        </View>
                        <Text style={styles.detailedIngredientText}>
                          {ingredient.amount && !isNaN(ingredient.amount) ? 
                            `${ingredient.amount} ${ingredient.unit || ''} ` : ''}
                          {ingredient.name || ingredient.originalName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </CardContainer>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" duration={600} delay={300}>
              <CardContainer style={styles.summaryContainer} elevation="medium">
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>About this Recipe</Text>
                </View>
                <HTMLText html={cleanSummary} />
              </CardContainer>
            </Animatable.View>
            
            {/* Instructions section */}
            {recipe.instructions && (
              <Animatable.View animation="fadeInUp" duration={600} delay={350}>
                <CardContainer style={styles.instructionsContainer} elevation="medium">
                  <View style={styles.sectionTitleRow}>
                    <ChefHat size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Instructions</Text>
                  </View>
                  <HTMLText html={cleanInstructions} />
                </CardContainer>
              </Animatable.View>
            )}

            <Animatable.View
              animation="fadeInUp"
              duration={600}
              delay={400}
              style={styles.buttonContainer}
            >
              <View style={styles.buttonsRow}>
                <View style={styles.buttonHalf}>
                  <PrimaryButton
                    title={recipeAdded ? "Added to Plan" : "Add to Meal Plan"}
                    onPress={handleAddToMealPlan}
                    icon={recipeAdded ? <Check size={20} color={Colors.success} /> : <Calendar size={20} color="#FFFFFF" />}
                  />
                </View>
                
                <View style={styles.buttonHalf}>
                  <PrimaryButton
                    title={cookingComplete ? "Cooked!" : "Cook Now"}
                    onPress={handleCookRecipe}
                    icon={<PlayCircle size={20} color="#FFFFFF" />}
                    variant="primary"
                    loading={isCooking}
                    disabled={isCooking || cookingComplete}
                  />
                </View>
              </View>
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
    fontWeight: "bold",
  },
  i: {
    fontStyle: "italic",
  },
  li: {
    marginBottom: 8,
  },
  ol: {
    marginLeft: 0,
    paddingLeft: 0,
  },
  ul: {
    marginLeft: 0,
    paddingLeft: 0,
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
    position: "relative",
    height: 280,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: Colors.textLight,
    fontSize: 16,
  },
  imageGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  titleContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 12,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaCard: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: "30%",
  },
  metaIcon: {
    marginBottom: 8,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  metaLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  ingredientsContainer: {
    padding: 16,
    marginBottom: 24,
  },
  ingredientsInfo: {
    gap: 12,
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIconContainer: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    height: 24,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
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
  detailedIngredients: {
    marginTop: 16,
  },
  ingredientSubheading: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  detailedIngredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 20,
    marginRight: 8,
    alignItems: 'center',
  },
  detailedIngredientText: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  summaryContainer: {
    padding: 16,
    marginBottom: 24,
  },
  instructionsContainer: {
    padding: 16,
    marginBottom: 24,
  },
  htmlText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonHalf: {
    width: '48%',
  },
  buttonSuccess: {
    backgroundColor: Colors.success,
  },
  sustainabilityInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  sustainabilityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  sustainabilityText: {
    fontSize: 16,
    color: Colors.text,
  },
});
