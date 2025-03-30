import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image as RNImage,
  ActivityIndicator,
  Alert,
  FlatList,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { FoodCategory } from "@/types";
import { identifyMultipleFoodItemsWithOpenAI } from "@/utils/openaiVision";
import { USE_MOCK_OCR } from "@/utils/env";
import { usePantryStore } from "@/store/pantryStore";

// Food category default images
const categoryImages = {
  fruits:
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=300",
  vegetables:
    "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=300",
  dairy:
    "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=300",
  meat: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=300",
  seafood:
    "https://images.unsplash.com/photo-1579384264577-79580c9d3a36?q=80&w=300",
  grains:
    "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?q=80&w=300",
  bakery:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300",
  canned:
    "https://images.unsplash.com/photo-1584969434146-4714825f3b14?q=80&w=300",
  frozen:
    "https://images.unsplash.com/photo-1584704892024-aed56028ad0b?q=80&w=300",
  snacks:
    "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=300",
  beverages:
    "https://images.unsplash.com/photo-1582106245687-cbb466a9f07f?q=80&w=300",
  condiments:
    "https://images.unsplash.com/photo-1589632862914-e0c6f29381e4?q=80&w=300",
  spices:
    "https://images.unsplash.com/photo-1532336414791-78499e7733fe?q=80&w=300",
  other:
    "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=300",
};

// Common food items with specific images
const foodItemImages: { [key: string]: string } = {
  // Fruits
  apple:
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=300",
  banana:
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=300",
  orange:
    "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?q=80&w=300",
  grapes:
    "https://images.unsplash.com/photo-1537640538966-79f369143f8f?q=80&w=300",
  strawberries:
    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=300",
  lemon:
    "https://images.unsplash.com/photo-1582287014914-1db0624be8c3?q=80&w=300",
  avocado:
    "https://images.unsplash.com/photo-1601039641847-7857b994d704?q=80&w=300",

  // Vegetables
  spinach:
    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300",
  tomatoes:
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300",
  tomato:
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300",
  carrots:
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300",
  carrot:
    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300",
  broccoli:
    "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=300",
  onions:
    "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?q=80&w=300",
  onion:
    "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?q=80&w=300",
  potatoes:
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300",
  potato:
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=300",

  // Dairy
  milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=300",
  cheese:
    "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=300",
  yogurt:
    "https://images.unsplash.com/photo-1571212515416-fca988083b88?q=80&w=300",
  butter:
    "https://images.unsplash.com/photo-1589985270958-349dd394d5b2?q=80&w=300",
  eggs: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?q=80&w=300",
  egg: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?q=80&w=300",

  // Meat
  chicken:
    "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?q=80&w=300",
  beef: "https://images.unsplash.com/photo-1551446307-03787c4d619f?q=80&w=300",
  pork: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=300",
  bacon:
    "https://images.unsplash.com/photo-1625943553852-781c33e4f033?q=80&w=300",

  // Bakery
  bread:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=300",
  bagel:
    "https://images.unsplash.com/photo-1509722747041-616f39b57569?q=80&w=300",
  croissant:
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300",

  // Beverages
  water: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300",
  coffee:
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=300",
  tea: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=300",
  juice:
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=300",
  beer: "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=300",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300",
};

interface FoodItemDetection {
  name: string;
  category: FoodCategory;
  quantity: number;
  unit?: string;
  selected: boolean; // To track if the item is selected for adding
  imageUrl?: string; // Optional image URL
}

interface MultiItemScannerProps {
  onClose: () => void;
}

export default function MultiItemScanner({ onClose }: MultiItemScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedItems, setDetectedItems] = useState<FoodItemDetection[]>([]);
  const router = useRouter();
  const { addItem } = usePantryStore();

  // Function to get an appropriate image for the food item
  const getImageUrl = (item: {
    name: string;
    category: FoodCategory;
  }): string => {
    // Try to find a specific image for this food item
    const itemNameLower = item.name.toLowerCase().trim();
    if (foodItemImages[itemNameLower]) {
      return foodItemImages[itemNameLower];
    }

    // If no exact match, try to find a partial match
    for (const [key, url] of Object.entries(foodItemImages)) {
      if (itemNameLower.includes(key) || key.includes(itemNameLower)) {
        return url;
      }
    }

    // Fall back to a category-based image
    return categoryImages[item.category] || categoryImages.other;
  };

  const handleReviewSelectedItems = () => {
    const selectedItems = detectedItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Alert.alert(
        "No Items Selected",
        "Please select at least one item to add."
      );
      return;
    }

    // Close modal first
    onClose();

    // Add delay to ensure modal is closed
    setTimeout(() => {
      // Start the review workflow for the first item
      addItemsSequentially();
    }, 300);
  };

  const addItemsSequentially = () => {
    // Convert detectedItems to an array of selected items only
    const selectedItems = detectedItems
      .filter((item) => item.selected)
      .map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit || "pcs",
        imageUrl: item.imageUrl, // Include the image URL
      }));

    console.log(
      "Selected items for adding:",
      JSON.stringify(selectedItems, null, 2)
    );

    if (selectedItems.length === 0) {
      Alert.alert(
        "No items selected",
        "Please select at least one item to add."
      );
      return;
    }

    // First close the modal - this needs to be done before navigation
    onClose();

    // Use a timeout to ensure the modal is fully closed before navigation
    setTimeout(() => {
      try {
        // Stringify the items data once
        const itemsDataString = JSON.stringify(selectedItems);
        console.log(
          "Prepared items data string of length:",
          itemsDataString.length
        );

        // Navigate to add-item screen with the first item data
        console.log("Navigating to add-item with:", {
          first_item: selectedItems[0],
          total_items: selectedItems.length,
        });

        // Navigate to the add-item screen
        router.push({
          pathname: "/add-item",
          params: {
            name: selectedItems[0].name,
            category: selectedItems[0].category,
            quantity: selectedItems[0].quantity?.toString() || "1",
            unit: selectedItems[0].unit || "pcs",
            imageUrl: selectedItems[0].imageUrl,
            isFromMultiScan: "true",
            multiScanCurrentIndex: "0",
            multiScanTotalItems: selectedItems.length.toString(),
            multiScanItemsData: itemsDataString,
            forceUpdate: Date.now().toString(), // Force a refresh
          },
        });
      } catch (error) {
        console.error("Error during navigation:", error);
        Alert.alert(
          "Navigation Error",
          "There was a problem starting the item review process. Please try again."
        );
      }
    }, 1000); // Longer delay to ensure modal is fully closed
  };

  const toggleItemSelection = (index: number) => {
    const updatedItems = [...detectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setDetectedItems(updatedItems);
  };

  const pickImage = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Camera permission is required to scan products."
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setLoading(true);

      try {
        // Process the image
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        let identifiedItems: {
          name: string;
          category: FoodCategory;
          quantity: number;
          unit?: string;
        }[] = [];

        // Attempt to identify using OpenAI if enabled
        if (!USE_MOCK_OCR) {
          try {
            console.log(
              "Attempting to call OpenAI Vision API for multiple items..."
            );
            identifiedItems = await identifyMultipleFoodItemsWithOpenAI(
              manipResult.uri
            );
            console.log(
              "OpenAI API response:",
              JSON.stringify(identifiedItems)
            );
          } catch (error: any) {
            console.error(
              "OpenAI Vision API error details:",
              error.response?.data || error.message || error
            );
            Alert.alert(
              "API Error",
              "There was an error contacting the AI service. Using simulated data instead."
            );
          }
        }

        // Use simulated data if OpenAI failed or mock OCR is enabled
        if (identifiedItems.length === 0) {
          // Simulated items for testing
          identifiedItems = [
            { name: "Apple", category: "fruits", quantity: 3, unit: "pcs" },
            { name: "Milk", category: "dairy", quantity: 1, unit: "gallon" },
            { name: "Bread", category: "bakery", quantity: 1, unit: "loaf" },
            { name: "Chicken", category: "meat", quantity: 1, unit: "lb" },
            {
              name: "Carrot",
              category: "vegetables",
              quantity: 4,
              unit: "pcs",
            },
          ];
          console.log("Using simulated items:", identifiedItems);
        }

        // Convert to FoodItemDetection with selected flag and image URL
        const itemsWithSelection = identifiedItems.map((item) => ({
          ...item,
          selected: true, // Selected by default
          imageUrl: getImageUrl(item), // Add the image URL
        }));

        setDetectedItems(itemsWithSelection);
        setLoading(false);
      } catch (error) {
        console.error("Error processing image:", error);
        setLoading(false);
        Alert.alert("Error", "Failed to process the image. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Item Scanner</Text>
      <Text style={styles.subtitle}>
        Take a photo containing multiple food items
      </Text>

      {!image ? (
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />

            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  Identifying food items with AI...
                </Text>
              </View>
            ) : null}
          </View>

          {detectedItems.length > 0 && !loading ? (
            <>
              <Text style={styles.detectedItemsTitle}>
                Detected Items (
                {detectedItems.filter((item) => item.selected).length}/
                {detectedItems.length} selected)
              </Text>
              <FlatList
                data={detectedItems}
                keyExtractor={(_, index) => `item-${index}`}
                style={styles.itemList}
                renderItem={({ item, index }) => (
                  <View style={styles.itemRow}>
                    <Image
                      source={item.imageUrl}
                      style={styles.itemImage}
                      contentFit="cover"
                      transition={300}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemCategory}>{item.category}</Text>
                        {item.quantity > 1 && (
                          <Text style={styles.itemQuantity}>
                            Qty: {item.quantity} {item.unit || ""}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Switch
                      value={item.selected}
                      onValueChange={() => toggleItemSelection(index)}
                      trackColor={{
                        false: "#767577",
                        true: Colors.primaryLight,
                      }}
                      thumbColor={item.selected ? Colors.primary : "#f4f3f4"}
                      ios_backgroundColor="#767577"
                    />
                  </View>
                )}
              />

              <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>
                  You'll be able to review and edit each item's details before
                  adding to your pantry
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleReviewSelectedItems}
              >
                <Text style={styles.buttonText}>
                  Review & Edit{" "}
                  {detectedItems.filter((item) => item.selected).length} Items
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {!loading && (
            <TouchableOpacity
              style={detectedItems.length ? styles.rescanButton : styles.button}
              onPress={pickImage}
            >
              <Text
                style={
                  detectedItems.length
                    ? styles.rescanButtonText
                    : styles.buttonText
                }
              >
                {detectedItems.length ? "Scan Again" : "Take Photo"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    width: "100%",
    marginTop: 10,
  },
  rescanButton: {
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rescanButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  detectedItemsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  itemList: {
    width: "100%",
    marginBottom: 10,
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  itemCategory: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.textLight,
    marginLeft: 5,
  },
  helpTextContainer: {
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  helpText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
