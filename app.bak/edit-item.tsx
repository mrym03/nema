import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { usePantryStore } from '@/store/pantryStore';
import { FoodCategory } from '@/types';
import Colors from '@/constants/colors';
import CategoryPicker from '@/components/CategoryPicker';
import { Calendar } from 'lucide-react-native';

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem } = usePantryStore();
  
  const item = items.find(i => i.id === id);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('other');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setExpiryDate(new Date(item.expiryDate).toISOString().split('T')[0]);
      setNotes(item.notes || '');
    } else {
      Alert.alert("Error", "Item not found");
      router.back();
    }
  }, [item]);
  
  const handleSave = () => {
    if (!item) return;
    
    if (!name.trim()) {
      // Show error
      return;
    }
    
    updateItem(item.id, {
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'item',
      expiryDate: new Date(`${expiryDate}T00:00:00`).toISOString(),
      notes: notes.trim(),
    });
    
    router.back();
  };
  
  if (!item) return null;
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Edit Food Item',
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
              onPress={() => router.back()}
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
              <Text style={styles.saveButtonLargeText}>Save Changes</Text>
            </Pressable>
          </View>
        </ScrollView>
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
});