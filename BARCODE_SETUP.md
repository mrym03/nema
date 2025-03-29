# Setting Up a Real Barcode Scanner in Expo

This guide covers how to set up a real barcode scanner in your Zero Waste Pantry app using a development build.

## 1. Creating a Development Build with EAS

Expo Go has limitations with barcode scanning on physical devices. For full camera access, create a development build:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Log in to your Expo account:
```bash
eas login
```

3. Configure your project:
```bash
eas build:configure
```

4. Create a development build:
```bash
# For iOS
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

5. Install the development build on your device by following the instructions provided by EAS after the build completes.

## 2. Enhanced Barcode Scanner Implementation

Once you have a development build, replace your placeholder scanner with this enhanced version:

```typescript
// components/RealBarcodeScanner.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import axios from 'axios';

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
      // You can replace this with a real product database API
      // For example: Open Food Facts API
      const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (response.data.status === 1) {
        const product = response.data.product;
        return {
          name: product.product_name || 'Unknown Product',
          category: product.categories_tags?.[0]?.replace('en:', '') || 'Other',
          imageUrl: product.image_url,
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
    return <Text style={styles.text}>Requesting camera permission...</Text>;
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button title="Close" onPress={onClose} />
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
          <Text style={styles.text}>Fetching product information...</Text>
        </View>
      )}
      
      <View style={styles.closeButtonContainer}>
        <Button title="Close" onPress={onClose} />
      </View>
      
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
    top: 20,
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## 3. Product Database Integration

Your barcode scanner becomes more useful when connected to a product database. Some options include:

1. **Open Food Facts API**: Free and open database of food products
   - Documentation: https://world.openfoodfacts.org/data
   - Example endpoint: `https://world.openfoodfacts.org/api/v0/product/[barcode].json`

2. **UPC Database API**: Commercial API for product lookups
   - Requires API key and has usage quotas

3. **Create your own database**: For specialized products or categories

## 4. Updating Your App to Use the Real Scanner

Update your `add-item.tsx` file to use the real scanner in development builds:

```typescript
// Detect if running in a development build
const isDevelopmentBuild = Constants.appOwnership !== 'expo';

// In your component:
{isBarcodeScannerVisible && (
  <Modal
    visible={isBarcodeScannerVisible}
    animationType="slide"
    onRequestClose={() => setBarcodeScannerVisible(false)}
  >
    {isDevelopmentBuild ? (
      <RealBarcodeScanner onClose={() => setBarcodeScannerVisible(false)} />
    ) : (
      <ExpoBarcodeScannerComponent onClose={() => setBarcodeScannerVisible(false)} />
    )}
  </Modal>
)}
```

Don't forget to import:
```typescript
import Constants from 'expo-constants';
import RealBarcodeScanner from '../components/RealBarcodeScanner';
```

## 5. Testing on a Physical Device

1. Install your development build on your physical device
2. Launch the app
3. Navigate to the barcode scanner
4. Test scanning various product barcodes

## 6. Additional Features

Once your real scanner is working, consider these enhancements:

1. **Custom barcode formats**: Configure the scanner to recognize specific barcode types
2. **History**: Save previously scanned barcodes
3. **Offline mode**: Cache product data for offline use
4. **Custom database**: Build your own product database for specialized items

## 7. Troubleshooting

If you encounter issues with the barcode scanner:

1. **Camera permissions**: Make sure your app has the proper permissions in your `app.json`
2. **Lighting**: Ensure adequate lighting for scanning
3. **Focus**: Some devices may have autofocus issues, consider adding a manual focus option
4. **API connectivity**: Check your internet connection and API endpoint availability 