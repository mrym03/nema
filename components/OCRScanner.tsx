import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
// Import conditionally in the component to avoid errors

interface OCRScannerProps {
  onClose: () => void;
}

export default function OCRScanner({ onClose }: OCRScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required for OCR scanning');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      // Resize the image to reduce upload size
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { format: SaveFormat.JPEG, compress: 0.8 }
      );
      
      // Always use simulated OCR in Expo Go
      // In a development build, you would use the real OCR service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      // Simulate a typical expiry date from a food package
      const simulatedText = "Best Before: 12/31/2023";
      setResult(simulatedText);
      
      Alert.alert(
        'OCR Result',
        `Detected text: ${simulatedText}`,
        [
          {
            text: 'Use This Date',
            onPress: () => {
              onClose();
              // Parse the date and format it as YYYY-MM-DD for the expiry date field
              const dateMatch = simulatedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
              if (dateMatch) {
                const [_, month, day, year] = dateMatch;
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                router.push(`../add-item?expiryDate=${formattedDate}`);
              } else {
                router.push('../add-item');
              }
            },
          },
          {
            text: 'Try Again',
            onPress: () => {
              setImage(null);
              setResult(null);
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
      console.error('OCR processing error:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OCR Scanner</Text>
      <Text style={styles.subtitle}>Scan expiration dates from food packages</Text>
      
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
              <Text style={styles.loadingText}>Processing image...</Text>
            </View>
          ) : result ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{result}</Text>
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
    aspectRatio: 3/4,
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