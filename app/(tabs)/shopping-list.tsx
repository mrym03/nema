import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
  SectionList,
  ToastAndroid,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShoppingListStore } from "@/store/shoppingListStore";
import { usePantryStore } from "@/store/pantryStore";
import {
  ShoppingListItem as ShoppingListItemType,
  FoodCategory,
} from "@/types";
import Colors from "@/constants/colors";
import ShoppingListItem from "@/components/ShoppingListItem";
import EmptyState from "@/components/EmptyState";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Check,
  CheckCircle,
  Edit,
} from "lucide-react-native";
import { CATEGORIES } from "@/constants/categories";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import HeaderBar from "@/components/HeaderBar";
import { useRouter } from "expo-router";

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animatable: any = { View };

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

try {
  Animatable = require("react-native-animatable");
} catch (e) {
  console.warn("react-native-animatable not available, using fallback");
}

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    items,
    addItem,
    updateItem,
    removeItem,
    clearCompletedItems,
    moveItemToPantry,
    clearAllItems,
  } = useShoppingListStore();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Group items by category for section list
  const groupedItems = useMemo(() => {
    // First organize by category
    const grouped: Record<FoodCategory, ShoppingListItemType[]> = {} as Record<
      FoodCategory,
      ShoppingListItemType[]
    >;

    items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    // Convert to sections format
    return Object.entries(grouped)
      .map(([category, categoryItems]) => ({
        title: category as FoodCategory,
        data: categoryItems,
      }))
      .sort((a, b) => {
        // Sort sections by number of items (descending)
        return b.data.length - a.data.length;
      });
  }, [items]);

  const handleAddItem = () => {
    router.push("/add-shopping-item");
  };

  const handleClearCompleted = () => {
    if (items.some((item) => item.completed)) {
      Alert.alert(
        "Clear Completed Items",
        "Are you sure you want to remove all completed items?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: () => clearCompletedItems(),
          },
        ]
      );
    } else {
      Alert.alert(
        "No Completed Items",
        "There are no completed items to clear."
      );
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      // If all are selected, deselect all
      setSelectedItems([]);
    } else {
      // Otherwise select all
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select items to delete.");
      return;
    }

    Alert.alert(
      "Delete Selected Items",
      `Are you sure you want to delete ${selectedItems.length} selected item${
        selectedItems.length > 1 ? "s" : ""
      }?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedItems.forEach((id) => removeItem(id));
            setSelectedItems([]);
            setSelectMode(false);

            if (Platform.OS === "android") {
              ToastAndroid.show("Items deleted", ToastAndroid.SHORT);
            }
          },
        },
      ]
    );
  };

  const handleMoveToPantry = (id: string) => {
    moveItemToPantry(id);

    // Show feedback to the user
    if (Platform.OS === "android") {
      ToastAndroid.show("Item moved to pantry", ToastAndroid.SHORT);
    } else {
      // For iOS, we've already shown an alert in the ShoppingListItem component
      // So no need for additional feedback here
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ShoppingListItemType }) => (
      <ShoppingListItem
        item={item}
        onToggle={() => {
          if (selectMode) {
            handleSelectItem(item.id);
          } else {
            updateItem(item.id, { completed: !item.completed });
          }
        }}
        onRemove={() => removeItem(item.id)}
        onMoveToPantry={handleMoveToPantry}
        isSelected={selectedItems.includes(item.id)}
        selectMode={selectMode}
      />
    ),
    [updateItem, removeItem, moveItemToPantry, selectMode, selectedItems]
  );

  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: { title: FoodCategory; data: ShoppingListItemType[] };
    }) => {
      const category = CATEGORIES[section.title];
      return (
        <View
          style={[
            styles.sectionHeader,
            { backgroundColor: `${category.color}20` },
          ]}
        >
          <View style={styles.sectionHeaderContent}>
            <View
              style={[
                styles.sectionColorDot,
                { backgroundColor: category.color },
              ]}
            />
            <Text style={styles.sectionTitle}>{category.label}</Text>
          </View>
          <Text style={styles.sectionCount}>{section.data.length} items</Text>
        </View>
      );
    },
    []
  );

  const renderEmptyState = () => (
    <EmptyState
      title="Your shopping list is empty"
      message="Add items to your shopping list to keep track of what you need to buy."
      imageUrl="https://images.unsplash.com/photo-1601598851547-4302969d0614?q=80&w=300"
    />
  );

  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;

  // Header component with conditional gradient
  const HeaderComponent = shouldUseGradient ? LinearGradient : View;
  const headerProps = shouldUseGradient
    ? {
        colors: [Colors.primary, Colors.primaryDark],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: [
          styles.header,
          { paddingTop: insets.top > 0 ? insets.top : 16 },
        ],
      }
    : {
        style: [
          styles.header,
          { backgroundColor: Colors.primary },
          { paddingTop: insets.top > 0 ? insets.top : 16 },
        ],
      };

  // Calculate the bottom padding to avoid the tab bar and add button overlap
  const tabBarHeight = Platform.OS === "ios" ? 90 : 75;
  const addButtonHeight = 56; // Approximate height of the add button with margin
  const bottomPadding =
    (insets.bottom > 0 ? tabBarHeight : tabBarHeight + 10) + addButtonHeight;

  // Animation values for floating effect
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  // Start floating animation on component mount
  React.useEffect(() => {
    startFloatingAnimation();
  }, []);

  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  };

  // Handle button press animation
  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.92,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Scale and floating transform for the button
  const scaleTransform = {
    transform: [
      { scale: buttonScale },
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <HeaderBar
          title="Shopping List"
          subtitle={`${items.length} items`}
          rightButtons={
            <>
              {selectMode ? (
                <>
                  <Pressable
                    style={styles.iconButton}
                    onPress={handleSelectAll}
                  >
                    <Ionicons
                      name={
                        selectedItems.length === items.length
                          ? "checkmark-circle"
                          : "checkmark-circle-outline"
                      }
                      size={24}
                      color={
                        selectedItems.length === items.length
                          ? Colors.success
                          : Colors.textDark
                      }
                    />
                  </Pressable>
                  <Pressable
                    style={styles.iconButton}
                    onPress={handleDeleteSelected}
                    disabled={selectedItems.length === 0}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={
                        selectedItems.length === 0
                          ? Colors.textLight
                          : Colors.danger
                      }
                    />
                  </Pressable>
                  <Pressable
                    style={styles.iconButton}
                    onPress={toggleSelectMode}
                  >
                    <Ionicons
                      name="close-outline"
                      size={24}
                      color={Colors.textDark}
                    />
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.iconButton}
                    onPress={toggleSelectMode}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={24}
                      color={Colors.textDark}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.iconButton}
                    onPress={handleClearCompleted}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color={Colors.textDark}
                    />
                  </Pressable>
                </>
              )}
            </>
          }
        />

        <View style={styles.contentContainer}>
          {items.length > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>
                {items.length} {items.length === 1 ? "item" : "items"} to buy
                {selectMode &&
                  selectedItems.length > 0 &&
                  ` (${selectedItems.length} selected)`}
              </Text>
            </View>
          )}

          <SectionList
            sections={groupedItems}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: bottomPadding },
            ]}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
          />
        </View>
      </View>

      {/* Floating Action Button with gradient and animation */}
      <Animated.View style={[styles.buttonWrapper, scaleTransform]}>
        <TouchableOpacity
          style={styles.touchableArea}
          onPress={handleAddItem}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          {shouldUseGradient ? (
            <LinearGradient
              colors={["#63E2B7", "#3A8F71"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emergencyFab}
            >
              <Plus size={28} color="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          ) : (
            <View style={[styles.emergencyFab, { backgroundColor: "#63E2B7" }]}>
              <Plus size={28} color="#FFFFFF" strokeWidth={2} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  listContent: {
    padding: 16,
  },
  addButtonWrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 100,
    right: 24,
    zIndex: 1000, // Greatly increased z-index
    elevation: 10, // Increased elevation for Android
  },
  totalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "500",
  },
  fabButton: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#63E2B7",
    bottom: 30,
    right: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
  },

  // Button wrapper styles
  buttonWrapper: {
    position: "absolute",
    bottom: 120,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99999,
  },
  touchableArea: {
    borderRadius: 32,
    overflow: "hidden",
  },
  // Emergency super-visible button
  emergencyFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
