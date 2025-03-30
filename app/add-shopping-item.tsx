import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useShoppingListStore } from "@/store/shoppingListStore";
import { FoodCategory } from "@/types";
import Colors from "@/constants/colors";
import CategoryPicker from "@/components/CategoryPicker";
import { generateId } from "@/utils/helpers";

export default function AddShoppingItemScreen() {
  const router = useRouter();
  const { addItem } = useShoppingListStore();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("other");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("item");
  const [recipes, setRecipes] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name for the item");
      return;
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    addItem({
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit: unit.trim() || "item",
      recipes: recipes.trim() ? [recipes.trim()] : [],
    });

    router.back();
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Add to Shopping List",
            headerRight: () => (
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                ]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            ),
          }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Apples, Milk, Chicken"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <CategoryPicker
              selectedCategory={category}
              onSelectCategory={setCategory}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., kg, liter, piece"
                value={unit}
                onChangeText={setUnit}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>For Recipe (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Lasagna, Chicken Curry"
              value={recipes}
              onChangeText={setRecipes}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={handleSave}
          >
            <Text style={styles.addButtonText}>Add to Shopping List</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
