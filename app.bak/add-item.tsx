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
import { Image } from 'expo-image';
import { getDefaultShelfLife, getDefaultOpenedShelfLife, calculateExpiryDate } from '@/utils/date';

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
  const [imageUrl, setImageUrl] = useState(params.imageUrl ? params.imageUrl.toString() : '');
  // For fruits, automatically set isOpen to true, otherwise default to false
  const [isOpen, setIsOpen] = useState(category === 'fruits' ? true : false);
  
  // Update isOpen whenever category changes
  useEffect(() => {
    if (category === 'fruits') {
      setIsOpen(true);
    }
  }, [category]);
  
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
  const [multiScanItemsData, setMultiScanItemsData] = useState<Array<{name: string, category: FoodCategory, imageUrl?: string, quantity?: number}>>([]);
  
  // Initialize multi-scan items data if available
  useEffect(() => {
    console.log('Initializing with params:', JSON.stringify(params, null, 2));
    
    if (params.multiScanItemsData) {
      try {
        const itemsDataString = params.multiScanItemsData.toString();
        console.log('Raw multiScanItemsData string length:', itemsDataString.length);
        
        const itemsData = JSON.parse(itemsDataString);
        console.log('Parsed multiScanItemsData, found', itemsData.length, 'items');
        
        if (Array.isArray(itemsData) && itemsData.length > 0) {
          console.log('Setting multiScanItemsData with', itemsData.length, 'items');
          setMultiScanItemsData(itemsData);
          
          // Also update multiScanTotalItems and multiScanCurrentIndex from params
          if (params.multiScanTotalItems) {
            const totalItems = Number(params.multiScanTotalItems);
            console.log('Setting multiScanTotalItems to', totalItems);
            setMultiScanTotalItems(totalItems);
          }
          
          if (params.multiScanCurrentIndex) {
            const currentIndex = Number(params.multiScanCurrentIndex);
            console.log('Setting multiScanCurrentIndex to', currentIndex);
            setMultiScanCurrentIndex(currentIndex);
            
            // Get the current item data
            if (currentIndex < itemsData.length) {
              const currentItem = itemsData[currentIndex];
              console.log('Setting fields from currentItem:', currentItem);
              setName(currentItem.name || '');
              if (currentItem.category && validCategories.includes(currentItem.category)) {
                setCategory(currentItem.category);
              }
              if (currentItem.imageUrl) {
                setImageUrl(currentItem.imageUrl);
              }
              if (currentItem.quantity) {
                setQuantity(currentItem.quantity.toString());
              }
            }
          }
        } else {
          console.error('Invalid multiScanItemsData format:', itemsData);
        }
      } catch (error) {
        console.error('Failed to parse multiScanItemsData:', error);
        console.error('Raw data causing parse error:', params.multiScanItemsData);
      }
    }
    
    // Open multi-item scanner if requested
    if (params.openMultiItemScanner === "true") {
      console.log('Auto-opening multi-item scanner');
      setTimeout(() => {
        setMultiItemScannerVisible(true);
      }, 300);
    }
  }, [params.multiScanItemsData, params.multiScanCurrentIndex, params.multiScanTotalItems, params.openMultiItemScanner, params.forceUpdate]);
  
  // Update form fields when params change (particularly important for navigation between items)
  useEffect(() => {
    // We don't need to update everything here since the main initialization now handles this
    // This is just for extra fields not directly related to the multiScanItemsData
    
    // Update isFromMultiScan flag
    if (params.isFromMultiScan === "true") {
      console.log('Setting isFromMultiScan to true');
      setIsFromMultiScan(true);
    }
    
    // Update quantity, unit, and notes if they're in params but not in the multiScanItemsData
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
    
    if (params.imageUrl) {
      setImageUrl(params.imageUrl.toString());
    }
  }, [params.isFromMultiScan, params.quantity, params.unit, params.expiryDate, params.notes, params.imageUrl]);
  
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
      imageUrl: imageUrl.trim() || undefined,
      isOpen: isOpen,
      unopenedShelfLife: getDefaultShelfLife(category),
      openedShelfLife: getDefaultOpenedShelfLife(category),
    });
    
    // If this is part of a multi-scan workflow
    if (isFromMultiScan) {
      const nextIndex = multiScanCurrentIndex + 1;
      console.log(`Moving to item ${nextIndex + 1}/${multiScanTotalItems}`);
      console.log('multiScanItemsData:', JSON.stringify(multiScanItemsData));
      
      if (nextIndex < multiScanTotalItems && multiScanItemsData && multiScanItemsData.length > nextIndex) {
        // Get the next item's data
        const nextItem = multiScanItemsData[nextIndex];
        console.log('Next item data:', nextItem);
        
        // Store the current name for the alert message
        const currentName = name;
        
        // First navigate to the next item - don't put this inside the Alert callback
        router.replace({
          pathname: "/add-item",
          params: {
            name: nextItem.name,
            category: nextItem.category,
            quantity: nextItem.quantity?.toString() || "1",
            imageUrl: nextItem.imageUrl,
            isFromMultiScan: "true",
            multiScanCurrentIndex: nextIndex.toString(),
            multiScanTotalItems: multiScanTotalItems.toString(),
            multiScanItemsData: JSON.stringify(multiScanItemsData),
            forceUpdate: Date.now().toString()
          }
        });
        
        // Then show the confirmation alert (without navigation in the callback)
        setTimeout(() => {
          Alert.alert(
            'Item Saved',
            `"${currentName}" has been added to your pantry.`,
            [{ text: 'OK', style: 'default' }]
          );
        }, 300);
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
            setImageUrl('https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=300'); // Add milk image
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
        
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {isFromMultiScan && (
              <View style={styles.editInstructionsContainer}>
                <Text style={styles.editInstructionsText}>
                  Review and edit this item's details if needed, then press Save to continue
                </Text>
              </View>
            )}
            
            {/* Show image preview if available */}
            {imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={imageUrl}
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            ) : null}
            
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
          
          {category === 'fruits' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Product Status</Text>
              <View style={styles.fruitStatusContainer}>
                <Text style={styles.fruitStatusText}>
                  Fruits are automatically marked as "open" since they naturally expire once purchased.
                </Text>
              </View>
              <Text style={styles.helperText}>
                Fresh fruits typically last about {getDefaultOpenedShelfLife('fruits')} days.
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Is the product open?</Text>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {isOpen ? 'Yes, already opened' : 'No, unopened'}
                </Text>
                <TouchableOpacity 
                  style={[styles.switch, isOpen ? styles.switchOn : styles.switchOff]}
                  onPress={() => setIsOpen(!isOpen)}
                >
                  <View style={[styles.switchThumb, isOpen ? styles.switchThumbOn : styles.switchThumbOff]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                {isOpen 
                  ? `Opened items typically expire in ${getDefaultOpenedShelfLife(category)} days when opened.` 
                  : `Unopened items typically last about ${getDefaultShelfLife(category)} days.`}
              </Text>
            </View>
          )}
          
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
                <Calendar size={24} color={Colors.text} />
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
                      <Barcode size={24} color={Colors.text} />
                      <Text style={styles.scanOptionText}>Scan Barcode</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.scanOption}
                      onPress={() => {
                        setScanMenuVisible(false);
                        setOCRModalVisible(true);
                      }}
                    >
                      <Calendar size={24} color={Colors.text} />
                      <Text style={styles.scanOptionText}>Scan Expiry Date (OCR)</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.scanOption}
                      onPress={() => {
                        setScanMenuVisible(false);
                        setProductScannerVisible(true);
                      }}
                    >
                      <ShoppingBag size={24} color={Colors.text} />
                      <Text style={styles.scanOptionText}>Identify Product</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.scanOption}
                      onPress={() => {
                        setScanMenuVisible(false);
                        setMultiItemScannerVisible(true);
                      }}
                    >
                      <Layers size={24} color={Colors.text} />
                      <Text style={styles.scanOptionText}>Scan Multiple Items</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.scanMenuButton}
                    onPress={() => setScanMenuVisible(true)}
                  >
                    <ChevronsUp size={24} color={Colors.text} />
                    <Text style={styles.scanMenuButtonText}>Scan</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
        </ScrollView>
        </KeyboardAvoidingView>
        
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
    paddingBottom: 100, // Add extra padding at the bottom
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scanMenuButtonIcon: {
    marginRight: 12,
    color: Colors.primary,
  },
  scanMenuButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  scanMenuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
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
  imagePreviewContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  inputContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
  },
  switch: {
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  switchOn: {
    backgroundColor: Colors.primary,
  },
  switchOff: {
    backgroundColor: Colors.card,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 8,
    backgroundColor: Colors.text,
  },
  switchThumbOn: {
    backgroundColor: '#fff',
  },
  switchThumbOff: {
    backgroundColor: Colors.textLight,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fruitStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  fruitStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});