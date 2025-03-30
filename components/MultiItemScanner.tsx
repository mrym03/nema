import React, { useState, useRef } from "react";
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
  Platform,
  StatusBar,
  Animated,
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

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

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function MultiItemScanner({ onClose }: MultiItemScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedItems, setDetectedItems] = useState<FoodItemDetection[]>([]);
  const [cameraMode, setCameraMode] = useState<boolean>(true);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  const router = useRouter();
  const { addItem } = usePantryStore();
  const insets = useSafeAreaInsets();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();

  React.useEffect(() => {
    (async () => {
      if (permission && !permission.granted) {
        await requestPermission();
      }
    })();

    // Start rotation animation for the loader
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, [permission]);

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

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady) return;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setImage(photo.uri);
      setCameraMode(false);

      // Process the image
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
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
          console.log("OpenAI API response:", JSON.stringify(identifiedItems));
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
      console.error("Error taking picture:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image from gallery:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const processCapturedImage = async (imageUri: string) => {
    setImage(imageUri);
    setCameraMode(false);
    setLoading(true);

    try {
      // Process the image
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
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
          console.log("OpenAI API response:", JSON.stringify(identifiedItems));
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
  };

  const returnToCamera = () => {
    setImage(null);
    setCameraMode(true);
    setDetectedItems([]);
  };

  // Spin animation for the loading icon
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to use this feature.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.permissionButton,
            { marginTop: 12, backgroundColor: Colors.danger },
          ]}
          onPress={onClose}
        >
          <Text style={styles.permissionButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(16, insets.bottom),
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Pantry Scanner</Text>
          <Text style={styles.subtitle}>
            {cameraMode
              ? "Snap a photo of multiple food items at once"
              : detectedItems.length > 0
              ? `${detectedItems.length} item${
                  detectedItems.length !== 1 ? "s" : ""
                } detected`
              : "Processing image..."}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeIconButton}
          onPress={onClose}
          hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <Ionicons name="close" size={28} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {cameraMode ? (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              onCameraReady={() => setCameraReady(true)}
            />

            <View style={styles.cameraOverlay}>
              {/* Camera frame borders */}
              <View style={styles.frameBorderTopLeft} />
              <View style={styles.frameBorderTopRight} />
              <View style={styles.frameBorderBottomLeft} />
              <View style={styles.frameBorderBottomRight} />
            </View>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImageFromGallery}
              >
                <Ionicons name="images" size={26} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={!cameraReady}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={styles.placeholderButton} />
            </View>
          </View>

          <View style={styles.cameraHelpContainer}>
            <Text style={styles.cameraHelpText}>
              Position multiple food items in frame
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: image }}
              style={styles.imagePreview}
              contentFit="cover"
            />

            {loading ? (
              <BlurView
                style={styles.loadingOverlay}
                intensity={35}
                tint="dark"
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh-circle" size={60} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.loadingText}>
                  Identifying food items with AI...
                </Text>
              </BlurView>
            ) : null}
          </View>

          {detectedItems.length > 0 && !loading ? (
            <>
              <View style={styles.detectedHeader}>
                <Text style={styles.detectedItemsTitle}>Detected Items</Text>
                <Text style={styles.detectedItemsCount}>
                  {detectedItems.filter((item) => item.selected).length}/
                  {detectedItems.length} selected
                </Text>
              </View>

              <FlatList
                data={detectedItems}
                keyExtractor={(_, index) => `item-${index}`}
                style={styles.itemList}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.itemRow,
                      item.selected && styles.itemRowSelected,
                    ]}
                  >
                    <Image
                      source={item.imageUrl}
                      style={styles.itemImage}
                      contentFit="cover"
                      transition={300}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <View style={styles.itemDetails}>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryText}>
                            {item.category}
                          </Text>
                        </View>
                        {item.quantity > 0 && (
                          <Text style={styles.itemQuantity}>
                            {item.quantity} {item.unit || ""}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Switch
                      value={item.selected}
                      onValueChange={() => toggleItemSelection(index)}
                      trackColor={{
                        false: "#767577",
                        true: `${Colors.primary}80`,
                      }}
                      thumbColor={item.selected ? Colors.primary : "#f4f3f4"}
                      ios_backgroundColor="#76757750"
                    />
                  </View>
                )}
              />

              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={returnToCamera}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>New Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.primaryActionButton,
                    detectedItems.filter((item) => item.selected).length ===
                      0 && styles.disabledButton,
                  ]}
                  onPress={handleReviewSelectedItems}
                  disabled={
                    detectedItems.filter((item) => item.selected).length === 0
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.actionButtonText}>Add Selected</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            !loading && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>Processing image...</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={returnToCamera}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Take New Photo</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: Colors.text,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  closeIconButton: {
    padding: 5,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cameraWrapper: {
    width: "100%",
    aspectRatio: 3 / 4,
    alignSelf: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frameBorderTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#FFFFFF",
    borderTopLeftRadius: 12,
  },
  frameBorderTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#FFFFFF",
    borderTopRightRadius: 12,
  },
  frameBorderBottomLeft: {
    position: "absolute",
    bottom: 120,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#FFFFFF",
    borderBottomLeftRadius: 12,
  },
  frameBorderBottomRight: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#FFFFFF",
    borderBottomRightRadius: 12,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },
  galleryButton: {
    padding: 12,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
  },
  placeholderButton: {
    width: 50,
  },
  cameraHelpContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  cameraHelpText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  imagePreviewContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  detectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detectedItemsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  detectedItemsCount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  itemList: {
    flex: 1,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRowSelected: {
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.textLight,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.textLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryActionButton: {
    backgroundColor: Colors.primary,
    flex: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 20,
    textAlign: "center",
  },
});
