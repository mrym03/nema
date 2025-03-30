import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { ShoppingListItem as ShoppingListItemType } from "@/types";
import { CATEGORIES } from "@/constants/categories";
import Colors from "@/constants/colors";
import {
  Check,
  Trash2,
  BookOpen,
  MoveRight,
  ShoppingBag,
  Edit,
} from "lucide-react-native";
import { useRouter } from "expo-router";

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onMoveToPantry?: (id: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  item,
  onToggle,
  onRemove,
  onMoveToPantry,
}) => {
  const category = CATEGORIES[item.category];
  const router = useRouter();

  // Format quantity to be cleaner (remove decimal if it's a whole number)
  const formatQuantity = (quantity: number) => {
    return Number.isInteger(quantity)
      ? quantity.toString()
      : quantity.toFixed(1);
  };

  const handleMoveToPantry = () => {
    Alert.alert(
      "Move to Pantry",
      "This will remove the item from your shopping list and add it to your pantry. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move",
          onPress: () => {
            if (onMoveToPantry) {
              onMoveToPantry(item.id);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: "/edit-shopping-item",
      params: { id: item.id },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.checkbox,
          item.completed && styles.checkboxCompleted,
          pressed && styles.pressed,
        ]}
        onPress={() => onToggle(item.id)}
      >
        {item.completed && <Check size={16} color="#fff" />}
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[styles.name, item.completed && styles.completedText]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <View style={styles.detailsRow}>
          <Text style={styles.quantity}>
            {formatQuantity(item.quantity)} {item.unit}
          </Text>

          <View
            style={[styles.categoryBadge, { backgroundColor: category.color }]}
          >
            <Text style={styles.categoryText}>{category.label}</Text>
          </View>
        </View>

        {item.recipes && item.recipes.length > 0 && (
          <View style={styles.recipeRow}>
            <BookOpen size={12} color={Colors.textLight} />
            <Text style={styles.recipeText} numberOfLines={1}>
              For:{" "}
              {Array.isArray(item.recipes)
                ? item.recipes.join(", ")
                : item.recipes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            pressed && styles.pressed,
          ]}
          onPress={handleEdit}
        >
          <Edit size={16} color="#fff" />
        </Pressable>

        {item.completed && onMoveToPantry && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.moveButton,
              pressed && styles.pressed,
            ]}
            onPress={handleMoveToPantry}
          >
            <ShoppingBag size={16} color="#fff" />
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
          onPress={() => onRemove(item.id)}
        >
          <Trash2 size={20} color={Colors.danger} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: Colors.textLight,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "500",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  recipeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeText: {
    fontSize: 12,
    color: Colors.textLight,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: Colors.info,
  },
  moveButton: {
    backgroundColor: Colors.success,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ShoppingListItem;
