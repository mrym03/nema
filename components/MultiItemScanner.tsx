import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { FoodCategory } from '@/types';
import { identifyMultipleFoodItemsWithOpenAI } from '@/utils/openaiVision';
import { USE_MOCK_OCR } from '@/utils/env';
import { usePantryStore } from '@/store/pantryStore';

interface FoodItemDetection {
  name: string;
  category: FoodCategory;
  selected: boolean; // To track if the item is selected for adding
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

  const handleReviewSelectedItems = () => {
    const selectedItems = detectedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add.');
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
      .filter(item => item.selected)
      .map(item => ({
        name: item.name,
        category: item.category
      }));
    
    console.log('Selected items for adding:', JSON.stringify(selectedItems, null, 2));
    
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please select at least one item to add.');
      return;
    }
    
    // Close scanner modal
    onClose();
    
    // Short delay to ensure modal is closed
    setTimeout(() => {
      // Navigate to add-item screen with the first item data
      // and pass all items data for sequential processing
      console.log('Navigating to add item with first item:', selectedItems[0]);
      console.log('Total items:', selectedItems.length);
      
      router.replace({
        pathname: "/add-item",
        params: {
          name: selectedItems[0].name,
          category: selectedItems[0].category,
          isFromMultiScan: "true",
          multiScanCurrentIndex: "0",
          multiScanTotalItems: selectedItems.length.toString(),
          multiScanItemsData: JSON.stringify(selectedItems),
          forceUpdate: Date.now().toString() // Force update to ensure fresh rendering
        }
      });
    }, 300);
  };

  const toggleItemSelection = (index: number) => {
    const updatedItems = [...detectedItems];
    updatedItems[index].selected = !updatedItems[index].selected;
    setDetectedItems(updatedItems);
  };

  const pickImage = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to scan products.');
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
        
        let identifiedItems: {name: string, category: FoodCategory}[] = [];
        
        // Attempt to identify using OpenAI if enabled
        if (!USE_MOCK_OCR) {
          try {
            console.log("Attempting to call OpenAI Vision API for multiple items...");
            identifiedItems = await identifyMultipleFoodItemsWithOpenAI(manipResult.uri);
            console.log("OpenAI API response:", JSON.stringify(identifiedItems));
          } catch (error: any) {
            console.error('OpenAI Vision API error details:', error.response?.data || error.message || error);
            Alert.alert('API Error', 'There was an error contacting the AI service. Using simulated data instead.');
          }
        }
        
        // Use simulated data if OpenAI failed or mock OCR is enabled
        if (identifiedItems.length === 0) {
          // Simulated items for testing
          identifiedItems = [
            { name: 'Apple', category: 'fruits' },
            { name: 'Milk', category: 'dairy' },
            { name: 'Bread', category: 'bakery' },
            { name: 'Chicken', category: 'meat' },
            { name: 'Carrot', category: 'vegetables' },
          ];
          console.log("Using simulated items:", identifiedItems);
        }
        
        // Convert to FoodItemDetection with selected flag
        const itemsWithSelection = identifiedItems.map(item => ({
          ...item,
          selected: true // Selected by default
        }));
        
        setDetectedItems(itemsWithSelection);
        setLoading(false);
        
      } catch (error) {
        console.error('Error processing image:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to process the image. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Multi-Item Scanner</Text>
      <Text style={styles.subtitle}>Take a photo containing multiple food items</Text>
      
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
                <Text style={styles.loadingText}>Identifying food items with AI...</Text>
              </View>
            ) : null}
          </View>
          
          {detectedItems.length > 0 && !loading ? (
            <>
              <Text style={styles.detectedItemsTitle}>
                Detected Items ({detectedItems.filter(item => item.selected).length}/{detectedItems.length} selected)
              </Text>
              <FlatList
                data={detectedItems}
                keyExtractor={(_, index) => `item-${index}`}
                style={styles.itemList}
                renderItem={({ item, index }) => (
                  <View style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    <Switch
                      value={item.selected}
                      onValueChange={() => toggleItemSelection(index)}
                      trackColor={{ false: '#767577', true: Colors.primaryLight }}
                      thumbColor={item.selected ? Colors.primary : '#f4f3f4'}
                      ios_backgroundColor="#767577"
                    />
                  </View>
                )}
              />
              
              <View style={styles.helpTextContainer}>
                <Text style={styles.helpText}>
                  You'll be able to review and edit each item's details before adding to your pantry
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.button, styles.addButton]} 
                onPress={handleReviewSelectedItems}
              >
                <Text style={styles.buttonText}>
                  Review & Edit {detectedItems.filter(item => item.selected).length} Items
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
          
          {!loading && (
            <TouchableOpacity 
              style={detectedItems.length ? styles.rescanButton : styles.button} 
              onPress={pickImage}
            >
              <Text style={detectedItems.length ? styles.rescanButtonText : styles.buttonText}>
                {detectedItems.length ? 'Scan Again' : 'Take Photo'}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    width: '100%',
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
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4/3,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  detectedItemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  itemList: {
    width: '100%',
    marginBottom: 10,
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemCategory: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  helpTextContainer: {
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  helpText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});