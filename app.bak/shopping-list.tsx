import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { useRecipeStore, ShoppingListItem } from "@/store/recipeStore";
import { usePantryStore } from "@/store/pantryStore";
import { Recipe } from "@/types";
import Colors from "@/constants/colors";
import { Image } from "expo-image";
import {
  ChevronLeft,
  ShoppingCart,
  Trash2,
  Check,
  Plus,
  RefreshCw,
  ListFilter,
} from "lucide-react-native";

export default function ShoppingListScreen() {
  const router = useRouter();
  const {
    selectedRecipes,
    clearSelectedRecipes,
    unselectRecipe,
    shoppingList,
    generateShoppingList,
    isLoading,
  } = useRecipeStore();
  const { addItem } = usePantryStore();
  const [activeTab, setActiveTab] = useState<"recipes" | "shoppingList">(
    "recipes"
  );

  // Generate shopping list when component mounts
  useEffect(() => {
    if (selectedRecipes.length > 0 && shoppingList.length === 0) {
      generateShoppingList();
    }
  }, [selectedRecipes, shoppingList]);

  const handleRemoveRecipe = (recipe: Recipe) => {
    Alert.alert(
      "Remove Recipe",
      `Remove ${recipe.title} from your selected recipes?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            unselectRecipe(recipe.id);
            // Regenerate shopping list after removing a recipe
            generateShoppingList();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Recipes",
      "Are you sure you want to clear all selected recipes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearSelectedRecipes();
          },
        },
      ]
    );
  };

  const handleAddToPantry = (item: ShoppingListItem) => {
    // Add the ingredient to the pantry
    addItem({
      name: item.name,
      category: "other", // Default category
      quantity: 1, // Default quantity
      unit: item.unit || "item",
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
      notes: `Added from shopping list for: ${item.recipes.join(", ")}`,
      isOpen: false, // Add the missing isOpen property
    });

    // Alert the user
    Alert.alert(
      "Added to Pantry",
      `${item.name} has been added to your pantry.`
    );

    // Regenerate the shopping list to update it
    generateShoppingList();
  };

  const handleAddAllToPantry = () => {
    if (shoppingList.length === 0) {
      Alert.alert("No Items", "There are no items to add to your pantry.");
      return;
    }

    Alert.alert(
      "Add All to Pantry",
      "Are you sure you want to add all shopping list items to your pantry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: () => {
            // Add all items to pantry
            shoppingList.forEach((item) => {
              addItem({
                name: item.name,
                category: "other",
                quantity: 1,
                unit: item.unit || "item",
                expiryDate: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                notes: `Added from shopping list for: ${item.recipes.join(
                  ", "
                )}`,
                isOpen: false, // Add the missing isOpen property
              });
            });

            Alert.alert(
              "Added to Pantry",
              `${shoppingList.length} items have been added to your pantry.`
            );

            // Regenerate the shopping list
            generateShoppingList();
          },
        },
      ]
    );
  };

  const renderRecipesList = () => {
    if (selectedRecipes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recipes selected</Text>
          <Text style={styles.emptySubtext}>
            Go back to the recipes page to select recipes
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back to Recipes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.headerActions}>
          <Text style={styles.subtitle}>
            {selectedRecipes.length} recipes selected
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Trash2 size={16} color={Colors.danger} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.recipeList}
          contentContainerStyle={styles.recipeListContent}
        >
          {selectedRecipes.map((recipe) => (
            <View key={recipe.id} style={styles.recipeCard}>
              <Image
                source={recipe.imageUrl}
                style={styles.recipeImage}
                contentFit="cover"
              />
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipe.title}
                </Text>
                <Text style={styles.recipeDescription}>
                  {recipe.readyInMinutes} min | {recipe.servings} servings
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveRecipe(recipe)}
              >
                <Trash2 size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderShoppingList = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating shopping list...</Text>
        </View>
      );
    }

    if (shoppingList.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Shopping list is empty</Text>
          <Text style={styles.emptySubtext}>
            {selectedRecipes.length > 0
              ? "All ingredients for your recipes are already in your pantry"
              : "Select recipes to generate a shopping list"}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Back to Recipes</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.headerActions}>
          <Text style={styles.subtitle}>
            {shoppingList.length} items to buy
          </Text>
          <TouchableOpacity
            style={styles.addAllButton}
            onPress={handleAddAllToPantry}
          >
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addAllButtonText}>Add All to Pantry</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.shoppingList}
          contentContainerStyle={styles.shoppingListContent}
        >
          {shoppingList.map((item, index) => (
            <View key={index} style={styles.ingredient}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientAmount}>
                  {item.amount} {item.unit}
                </Text>
                <Text style={styles.ingredientRecipes} numberOfLines={1}>
                  For: {item.recipes.join(", ")}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToPantry(item)}
              >
                <Plus size={18} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Shopping List</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={generateShoppingList}
          disabled={isLoading}
        >
          <RefreshCw size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "recipes" && styles.activeTab]}
          onPress={() => setActiveTab("recipes")}
        >
          <ListFilter
            size={18}
            color={activeTab === "recipes" ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "recipes" && styles.activeTabText,
            ]}
          >
            Selected Recipes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "shoppingList" && styles.activeTab]}
          onPress={() => setActiveTab("shoppingList")}
        >
          <ShoppingCart
            size={18}
            color={
              activeTab === "shoppingList" ? Colors.primary : Colors.textLight
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "shoppingList" && styles.activeTabText,
            ]}
          >
            Shopping List
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "recipes" ? renderRecipesList() : renderShoppingList()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textLight,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.danger,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 6,
  },
  addAllButtonText: {
    fontSize: 14,
    color: Colors.primary,
  },
  recipeList: {
    flex: 1,
  },
  recipeListContent: {
    padding: 16,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeImage: {
    width: 80,
    height: 80,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: Colors.text,
  },
  recipeDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  removeButton: {
    padding: 12,
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textLight,
  },
  shoppingList: {
    flex: 1,
  },
  shoppingListContent: {
    padding: 16,
  },
  ingredient: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: Colors.text,
  },
  ingredientAmount: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 2,
  },
  ingredientRecipes: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  addButton: {
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
