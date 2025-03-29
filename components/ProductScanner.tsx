import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { FoodCategory, FoodItem } from '@/types';
import { identifyFoodWithOpenAI } from '@/utils/openaiVision';
import { USE_MOCK_OCR } from '@/utils/env';
import { usePantryStore } from '@/store/pantryStore';

// Import conditionally to avoid errors in Expo Go
let visionApi: any = null;
try {
  // This will only work in development builds where the API is available
  visionApi = require('@/utils/visionApi');
} catch (error) {
  console.log('Vision API not available, using simulated responses');
}

interface ProductScannerProps {
  onClose: () => void;
}

export default function ProductScanner({ onClose }: ProductScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addItem } = usePantryStore();

  const handleAddIdentifiedProduct = (product: {name: string, category: FoodCategory}) => {
    // Close modal first
    onClose();
    
    // Log the product data
    console.log("Product identified - will navigate with:", product);
    
    // Add a small delay to ensure modal is closed
    setTimeout(() => {
      // Use replace to avoid stacking screens
      router.replace({
        pathname: "/add-item",
        params: {
          name: product.name,
          category: product.category,
          forceUpdate: Date.now().toString() // Add a timestamp to force re-rendering
        }
      });
    }, 300);
  };
  
  // Option to edit details before adding
  const handleEditThenAdd = (product: {name: string, category: FoodCategory}) => {
    // Close modal first
    onClose();
    
    // Add a small delay to ensure modal is closed
    setTimeout(() => {
      // Navigate to add-item screen with product details
      console.log("Navigating to add-item with:", product);
      router.replace({
        pathname: "/add-item",
        params: {
          name: product.name,
          category: product.category,
          forceUpdate: Date.now().toString() // Add a timestamp to force re-rendering
        }
      });
    }, 300);
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
        
        let identifiedProduct;
        
        // Attempt to identify using OpenAI if enabled
        if (!USE_MOCK_OCR) {
          try {
            console.log("Attempting to call OpenAI Vision API...");
            identifiedProduct = await identifyFoodWithOpenAI(manipResult.uri);
            console.log("OpenAI API response:", JSON.stringify(identifiedProduct));
          } catch (error: any) {
            console.error('OpenAI Vision API error details:', error.response?.data || error.message || error);
            Alert.alert('API Error', 'There was an error contacting the AI service. Using simulated data instead.');
          }
        }
        
        // Use simulated data if OpenAI failed or mock OCR is enabled
        if (!identifiedProduct) {
          // Simulated product list for testing
          const simulatedProducts = [
            { name: 'Apple', category: 'fruits' as FoodCategory },
            { name: 'Milk', category: 'dairy' as FoodCategory },
            { name: 'Bread', category: 'bakery' as FoodCategory },
            { name: 'Chicken', category: 'meat' as FoodCategory },
            { name: 'Carrot', category: 'vegetables' as FoodCategory },
          ];
          
          // Random product for simulation
          identifiedProduct = simulatedProducts[Math.floor(Math.random() * simulatedProducts.length)];
          console.log("Using simulated product:", identifiedProduct);
        }
        
        setLoading(false);
        
        // Show the result and prompt user
        Alert.alert(
          'Product Identified',
          `Detected: ${identifiedProduct.name}\nCategory: ${identifiedProduct.category}`,
          [
            {
              text: 'Use This Product',
              onPress: () => handleAddIdentifiedProduct(identifiedProduct),
            },
            {
              text: 'Try Again',
              onPress: () => {
                setImage(null);
                pickImage();
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            }
          ]
        );
      } catch (error) {
        console.error('Error processing image:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to process the image. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Food Scanner</Text>
      <Text style={styles.subtitle}>Take a photo of any food item to identify it</Text>
      
      {!image ? (
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          
          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Identifying food with AI...</Text>
            </View>
          ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
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
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.danger,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 