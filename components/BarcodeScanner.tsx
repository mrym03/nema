import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { X } from 'lucide-react-native';

// Add missing colors
const ExtendedColors = {
  ...Colors,
  white: '#FFFFFF',
  black: '#000000',
};

interface BarcodeScannerProps {
  onClose: () => void;
}

export default function BarcodeScanner({ onClose }: BarcodeScannerProps) {
  const router = useRouter();

  const handleSimulatedScan = () => {
    Alert.alert(
      'Expo Go Limitation',
      'The barcode scanner requires a development build (expo prebuild). In this demo, we\'ll simulate scanning a milk carton.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Simulate Scan',
          onPress: () => {
            onClose();
            // Simulate adding a milk carton
            router.push('../add-item?name=Milk&category=dairy&quantity=1&unit=carton');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.title}>Camera Not Available</Text>
        <Text style={styles.message}>
          The barcode scanner requires a development build using EAS or expo prebuild.
        </Text>
        <Text style={styles.message}>
          Press the button below to simulate scanning a product.
        </Text>
        
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleSimulatedScan}
        >
          <Text style={styles.scanButtonText}>Simulate Scan</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={ExtendedColors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ExtendedColors.black,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ExtendedColors.white,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: ExtendedColors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  scanButtonText: {
    color: ExtendedColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  closeButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
}); 