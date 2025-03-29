import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { usePantryStore } from '@/store/pantryStore';
import { FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import CategoryPicker from '@/components/CategoryPicker';
import { Calendar, X, Barcode, Camera, ChevronsUp, ShoppingBag, Layers } from 'lucide-react-native';
// Temporarily comment out barcode scanners to make app run in Expo Go
// import ExpoBarcodeScannerComponent from '@/components/ExpoBarcodeScannerComponent';
// import RealBarcodeScanner from '@/components/RealBarcodeScanner';
import OCRScanner from '@/components/OCRScanner';
import ProductScanner from '@/components/ProductScanner';
import MultiItemScanner from '@/components/MultiItemScanner';
import Constants from 'expo-constants';

export default function AddItemScreen() {
  const router = useRouter();
  const { addItem } = usePantryStore();
  const params = useLocalSearchParams();
  
  console.log('PARAMS RECEIVED:', JSON.stringify(params, null, 2));
  
  // Initialize with params if available
  const [name, setName] = useState(params.name ? params.name.toString() : '');
  // Validate category or default to 'other'
  const validCategories: FoodCategory[] = [
    'fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'grains', 
    'bakery', 'canned', 'frozen', 'snacks', 'beverages', 'condiments', 
    'spices', 'other'
  ];
  const initialCategory = params.category && 
    validCategories.includes(params.category.toString() as FoodCategory) ? 
    params.category.toString() as FoodCategory : 'other';
  
  const [category, setCategory] = useState<FoodCategory>(initialCategory);
  const [quantity, setQuantity] = useState(params.quantity ? params.quantity.toString() : '1');
  const [unit, setUnit] = useState(params.unit ? params.unit.toString() : 'item');
  const [expiryDate, setExpiryDate] = useState(
    params.expiryDate ? params.expiryDate.toString() : 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(params.notes ? params.notes.toString() : '');
  
  // Other state variables
  const [isBarcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const [isOCRModalVisible, setOCRModalVisible] = useState(false);
  const [isProductScannerVisible, setProductScannerVisible] = useState(false);
  const [isMultiItemScannerVisible, setMultiItemScannerVisible] = useState(false);
  const [isScanMenuVisible, setScanMenuVisible] = useState(false);
  
  // For multi-scan workflow
  const [isFromMultiScan, setIsFromMultiScan] = useState(params.isFromMultiScan === "true");
  const [multiScanTotalItems, setMultiScanTotalItems] = useState(
    params.multiScanTotalItems ? Number(params.multiScanTotalItems) : 0
  );
  const [multiScanCurrentIndex, setMultiScanCurrentIndex] = useState(
    params.multiScanCurrentIndex ? Number(params.multiScanCurrentIndex) : 0
  );
  const [multiScanItemsData, setMultiScanItemsData] = useState<Array<{name: string, category: FoodCategory}>>([]);
  
  // To prevent infinite navigation loops
  const hasInitializedRef = useRef(false);
  
  // Initialize multi-scan items data if available
  useEffect(() => {
    if (params.multiScanItemsData && !hasInitializedRef.current) {
      try {
        const itemsData = JSON.parse(params.multiScanItemsData.toString());
        setMultiScanItemsData(itemsData);
        console.log('Loaded multi-scan items data:', itemsData);
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Failed to parse multiScanItemsData:', error);
      }
    }
    
    // Open multi-item scanner if requested
    if (params.openMultiItemScanner === "true") {
      console.log('Auto-opening multi-item scanner');
      setTimeout(() => {
        setMultiItemScannerVisible(true);
      }, 300);
    }
  }, [params.multiScanItemsData, params.openMultiItemScanner]);
  
  // Update form fields when params change (particularly important for navigation between items)
  useEffect(() => {
    console.log('Params changed, updating form fields:', JSON.stringify(params, null, 2));
    
    // Update name if provided in params
    if (params.name) {
      const newName = params.name.toString();
      console.log('Setting name to:', newName);
      setName(newName);
    }
    
    // Update category if provided in params and valid
    if (params.category) {
      const newCategory = params.category.toString() as FoodCategory;
      if (validCategories.includes(newCategory)) {
        console.log('Setting category to:', newCategory);
        setCategory(newCategory);
      } else {
        console.log('Invalid category received:', newCategory, 'defaulting to "other"');
        setCategory('other');
      }
    }
    
    // Update other fields if provided
    if (params.quantity) {
      setQuantity(params.quantity.toString());
    }
    
    if (params.unit) {
      setUnit(params.unit.toString());
    }
    
    if (params.expiryDate) {
      setExpiryDate(params.expiryDate.toString());
    }
    
    if (params.notes) {
      setNotes(params.notes.toString());
    }
    
    // Update multi-scan related fields
    if (params.isFromMultiScan === "true") {
      setIsFromMultiScan(true);
    }
    
    if (params.multiScanTotalItems) {
      setMultiScanTotalItems(Number(params.multiScanTotalItems));
    }
    
    if (params.multiScanCurrentIndex) {
      setMultiScanCurrentIndex(Number(params.multiScanCurrentIndex));
    }
  }, [params.name, params.category, params.quantity, params.unit, params.expiryDate, params.notes, 
      params.isFromMultiScan, params.multiScanTotalItems, params.multiScanCurrentIndex, params.forceUpdate]);
  
  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the item');
      return;
    }
    
    console.log('Saving item:', name, category);
    addItem({
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'item',
      expiryDate: new Date(`${expiryDate}T00:00:00`).toISOString(),
      notes: notes.trim(),
    });
    
    // If this is part of a multi-scan workflow
    if (isFromMultiScan) {
      const nextIndex = multiScanCurrentIndex + 1;
      console.log(`Moving to item ${nextIndex + 1}/${multiScanTotalItems}`);
      
      if (nextIndex < multiScanTotalItems) {
        // Store current item name for the alert
        const currentName = name;
        
        // Show confirmation and navigate to next item
        Alert.alert(
          'Item Saved',
          `"${currentName}" has been added to your pantry.`,
          [{ text: 'Next Item', onPress: () => setMultiScanCurrentIndex(prevIndex => prevIndex + 1) }]
        );
      } else {
        // This was the last item, go back to main screen
        Alert.alert('Success', `All ${multiScanTotalItems} items have been added to your pantry.`);
        router.push("/");
      }
    } else {
      // Regular single item workflow
      router.back();
    }
  };

  const handleBarcodeScan = () => {
    Alert.alert(
      'Barcode Scanning',
      'Barcode scanning is only available in development builds. Would you like to simulate scanning a barcode?',
      [
        {
          text: 'Simulate Scan',
          onPress: () => {
            // Simulate finding a milk product
            setName('Organic Milk');
            setCategory('dairy');
            setQuantity('1');
            setUnit('liter');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
    setScanMenuVisible(false);
  };
  
  // Custom title that shows progress for multi-scan workflow
  const getScreenTitle = () => {
    if (isFromMultiScan) {
      return `Add Item (${multiScanCurrentIndex + 1}/${multiScanTotalItems})`;
    }
    return 'Add Food Item';
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: getScreenTitle(),
          headerRight: () => (
            <Pressable 
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Multi-scan progress indicator */}
        {isFromMultiScan && (
          <View style={styles.multiScanProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Multi-Item Scan</Text>
              <Text style={styles.progressCount}>
                Item {multiScanCurrentIndex + 1} of {multiScanTotalItems}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${((multiScanCurrentIndex) / multiScanTotalItems) * 100}%` }
                ]} 
              />
            </View>
            {multiScanItemsData && multiScanItemsData.length > 0 && (
              <View style={styles.progressItemsList}>
                {multiScanItemsData.map((item, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.progressItem, 
                      index === multiScanCurrentIndex && styles.progressItemActive,
                      index < multiScanCurrentIndex && styles.progressItemComplete
                    ]}
                  >
                    <Text 
                      style={[
                        styles.progressItemText,
                        index === multiScanCurrentIndex && styles.progressItemTextActive,
                        index < multiScanCurrentIndex && styles.progressItemTextComplete
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isFromMultiScan && (
            <View style={styles.editInstructionsContainer}>
              <Text style={styles.editInstructionsText}>
                Review and edit this item's details if needed, then press Save to continue
              </Text>
            </View>
          )}
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Apples, Milk, Chicken"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <CategoryPicker
              selectedCategory={category}
              onSelectCategory={setCategory}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., kg, liter, piece"
                value={unit}
                onChangeText={setUnit}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Expiry Date</Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
              <Calendar size={20} color={Colors.textLight} />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes here..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.pressed
              ]}
              onPress={() => {
                if (isFromMultiScan) {
                  Alert.alert(
                    'Cancel Multi-Item Add',
                    'Do you want to stop adding these items?',
                    [
                      {
                        text: 'Continue Editing',
                        style: 'cancel'
                      },
                      {
                        text: 'Exit',
                        style: 'destructive',
                        onPress: () => router.push('/')
                      }
                    ]
                  );
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                styles.saveButtonLarge,
                pressed && styles.pressed
              ]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonLargeText}>
                {isFromMultiScan ? `Save & ${multiScanCurrentIndex + 1 < multiScanTotalItems ? 'Next' : 'Finish'}` : 'Save Item'}
              </Text>
            </Pressable>
          </View>
          
          {/* Only show scan menu in non-multi-scan mode */}
          {!isFromMultiScan && (
            <View style={styles.scanOptionsContainer}>
              {isScanMenuVisible ? (
                <View style={styles.scanOptionsMenu}>
                  <TouchableOpacity 
                    style={styles.scanOption}
                    onPress={handleBarcodeScan}
                  >
                    <Barcode size={24} color={Colors.icon} />
                    <Text style={styles.scanOptionText}>Scan Barcode</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.scanOption}
                    onPress={() => {
                      setScanMenuVisible(false);
                      setOCRModalVisible(true);
                    }}
                  >
                    <Calendar size={24} color={Colors.icon} />
                    <Text style={styles.scanOptionText}>Scan Expiry Date (OCR)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.scanOption}
                    onPress={() => {
                      setScanMenuVisible(false);
                      setProductScannerVisible(true);
                    }}
                  >
                    <ShoppingBag size={24} color={Colors.icon} />
                    <Text style={styles.scanOptionText}>Identify Product</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.scanOption}
                    onPress={() => {
                      setScanMenuVisible(false);
                      setMultiItemScannerVisible(true);
                    }}
                  >
                    <Layers size={24} color={Colors.icon} />
                    <Text style={styles.scanOptionText}>Scan Multiple Items</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.scanMenuButton}
                  onPress={() => setScanMenuVisible(true)}
                >
                  <ChevronsUp size={24} color={Colors.textLight} />
                  <Text style={styles.scanMenuButtonText}>Scan</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
        
        {/* OCR Scanner Modal */}
        <Modal
          visible={isOCRModalVisible}
          animationType="slide"
          onRequestClose={() => setOCRModalVisible(false)}
        >
          <OCRScanner onClose={() => setOCRModalVisible(false)} />
        </Modal>
        
        {/* Product Scanner Modal */}
        <Modal
          visible={isProductScannerVisible}
          animationType="slide"
          onRequestClose={() => setProductScannerVisible(false)}
        >
          <ProductScanner onClose={() => setProductScannerVisible(false)} />
        </Modal>
        
        {/* Multi-Item Scanner Modal */}
        <Modal
          visible={isMultiItemScannerVisible}
          animationType="slide"
          onRequestClose={() => setMultiItemScannerVisible(false)}
        >
          <MultiItemScanner onClose={() => setMultiItemScannerVisible(false)} />
        </Modal>
        
        {/* Removed Barcode Scanner Modal */}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonLarge: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButtonLargeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  scanOptionsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  scanMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanMenuButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  scanOptionsMenu: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  scanOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  scanOptionText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  multiScanProgress: {
    padding: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  progressCount: {
    fontSize: 14,
    color: Colors.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressItemsList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  progressItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  progressItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressItemComplete: {
    backgroundColor: Colors.card,
    borderColor: Colors.primaryLight,
  },
  progressItemText: {
    fontSize: 12,
    color: Colors.text,
  },
  progressItemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  progressItemTextComplete: {
    color: Colors.textLight,
  },
  editInstructionsContainer: {
    padding: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInstructionsText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
});