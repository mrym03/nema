import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

interface ScannerProps {
  onClose: () => void;
}

export default function ExpoBarcodeScannerComponent({ onClose }: ScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      'Barcode Found',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Add Item',
          onPress: () => {
            onClose();
            router.push(`../add-item?name=Scanned Item&barcode=${data}`);
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
        <Button title="Go Back" onPress={onClose} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      
      {scanned && (
        <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
      )}
      
      <Button title="Cancel" onPress={onClose} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
}); 