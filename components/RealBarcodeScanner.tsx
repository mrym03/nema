import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Colors from '@/constants/colors';

interface BarcodeScannerProps {
  onClose: () => void;
}

export default function RealBarcodeScanner({ onClose }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);
      // Using Open Food Facts API for product lookup
      const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (response.data.status === 1) {
        const product = response.data.product;
        return {
          name: product.product_name || 'Unknown Product',
          category: mapCategory(product.categories_tags?.[0]?.replace('en:', '') || 'other'),
          imageUrl: product.image_url,
          quantity: product.quantity || '1',
          unit: product.quantity_unit || 'item',
        };
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Map Open Food Facts categories to app categories
  const mapCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'beverages': 'drinks',
      'drinks': 'drinks',
      'dairies': 'dairy',
      'dairy': 'dairy',
      'milk': 'dairy',
      'cheese': 'dairy',
      'meat': 'meat',
      'poultry': 'meat',
      'beef': 'meat',
      'pork': 'meat',
      'vegetables': 'produce',
      'fruits': 'produce',
      'produce': 'produce',
      'bakery': 'grains',
      'bread': 'grains',
      'cereals': 'grains',
      'pasta': 'grains',
      'rice': 'grains',
      'grains': 'grains',
      'snacks': 'snacks',
      'desserts': 'snacks',
      'frozen': 'frozen',
      'canned': 'canned',
      'condiments': 'condiments',
      'sauces': 'condiments',
      'spices': 'condiments'
    };
    
    // Convert to lowercase for matching
    const lowercaseCategory = category.toLowerCase();
    
    // Find a matching category
    for (const [key, value] of Object.entries(categoryMap)) {
      if (lowercaseCategory.includes(key)) {
        return value;
      }
    }
    
    // Default category
    return 'other';
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    try {
      const productData = await fetchProductData(data);
      
      if (productData) {
        Alert.alert(
          'Product Found',
          `Name: ${productData.name}\nCategory: ${productData.category}`,
          [
            {
              text: 'Add Item',
              onPress: () => {
                onClose();
                // Navigate to add-item with product data
                router.push({
                  pathname: '../add-item',
                  params: { 
                    barcode: data,
                    name: productData.name,
                    category: productData.category,
                    quantity: productData.quantity,
                    unit: productData.unit,
                    imageUrl: productData.imageUrl || ''
                  }
                });
              },
            },
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
          ]
        );
      } else {
        Alert.alert(
          'Product Not Found',
          `Barcode: ${data}`,
          [
            {
              text: 'Add Manually',
              onPress: () => {
                onClose();
                router.push({
                  pathname: '../add-item',
                  params: { barcode: data }
                });
              },
            },
            {
              text: 'Scan Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: onClose,
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process barcode');
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button title="Close" onPress={onClose} color={Colors.danger} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {scanned && loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.text}>Fetching product information...</Text>
        </View>
      )}
      
      <View style={styles.closeButtonContainer}>
        <Button title="Close" onPress={onClose} color={Colors.danger} />
      </View>
      
      <View style={styles.scanArea} />
      
      <View style={styles.scanInstructions}>
        <Text style={styles.text}>Position barcode within frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    padding: 5,
  },
  scanInstructions: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    margin: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
}); 