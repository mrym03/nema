import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { usePantryStore } from '@/store/pantryStore';
import { useShoppingListStore } from '@/store/shoppingListStore';
import Colors from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import { formatDate, formatRelativeDate, isExpiringSoon, isExpired } from '@/utils/date';
import { Clock, Calendar, Trash2, Edit2, ShoppingCart, Minus, Plus } from 'lucide-react-native';

export default function ItemDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, removeItem, consumeItem } = usePantryStore();
  const { addItem: addToShoppingList } = useShoppingListStore();
  
  const item = items.find(i => i.id === id);
  
  if (!item) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Item not found</Text>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }
  
  const category = CATEGORIES[item.category];
  const isExpiring = isExpiringSoon(item.expiryDate);
  const expired = isExpired(item.expiryDate);
  
  const handleEdit = () => {
    router.push({
      pathname: '/edit-item',
      params: { id: item.id }
    });
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this item from your pantry?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            removeItem(item.id);
            router.back();
          }
        }
      ]
    );
  };
  
  const handleAddToShoppingList = () => {
    addToShoppingList({
      name: item.name,
      category: item.category,
      quantity: 1,
      unit: item.unit,
    });
    
    Alert.alert(
      "Added to Shopping List",
      `${item.name} has been added to your shopping list.`
    );
  };
  
  const handleConsume = () => {
    Alert.alert(
      "Consume Item",
      "Did you use this item?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, all of it", 
          onPress: () => {
            consumeItem(item.id);
            router.back();
          }
        },
        { 
          text: "Yes, partially", 
          onPress: () => {
            // For simplicity, we'll just consume 1 unit
            consumeItem(item.id, 1);
            router.back();
          }
        }
      ]
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: item.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.headerButton,
                  pressed && styles.pressed
                ]}
                onPress={handleEdit}
              >
                <Edit2 size={20} color={Colors.text} />
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.headerButton,
                  styles.deleteButton,
                  pressed && styles.pressed
                ]}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={Colors.danger} />
              </Pressable>
            </View>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView>
          <Image
            source={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300'}
            style={styles.image}
            contentFit="cover"
          />
          
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.name}>{item.name}</Text>
              <View 
                style={[
                  styles.categoryBadge, 
                  { backgroundColor: category.color }
                ]}
              >
                <Text style={styles.categoryText}>{category.label}</Text>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>{item.quantity} {item.unit}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoRow}>
                  <Calendar size={16} color={Colors.textLight} />
                  <Text style={styles.infoLabel}>Added on</Text>
                </View>
                <Text style={styles.infoValue}>{formatDate(item.addedAt)}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <View style={styles.infoRow}>
                  <Clock 
                    size={16} 
                    color={expired ? Colors.danger : isExpiring ? Colors.warning : Colors.textLight} 
                  />
                  <Text 
                    style={[
                      styles.infoLabel,
                      expired && styles.expiredText,
                      isExpiring && styles.expiringSoonText
                    ]}
                  >
                    {expired ? 'Expired on' : 'Expires on'}
                  </Text>
                </View>
                <Text 
                  style={[
                    styles.infoValue,
                    expired && styles.expiredText,
                    isExpiring && styles.expiringSoonText
                  ]}
                >
                  {formatDate(item.expiryDate)} ({formatRelativeDate(item.expiryDate)})
                </Text>
              </View>
              
              {item.notes && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.notes}>{item.notes}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.actionButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.consumeButton,
                  pressed && styles.pressed
                ]}
                onPress={handleConsume}
              >
                <Minus size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Consume</Text>
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.shoppingListButton,
                  pressed && styles.pressed
                ]}
                onPress={handleAddToShoppingList}
              >
                <ShoppingCart size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Add to Shopping List</Text>
              </Pressable>
            </View>
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  deleteButton: {
    backgroundColor: Colors.card,
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  categoryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  expiringSoonText: {
    color: Colors.warning,
  },
  expiredText: {
    color: Colors.danger,
  },
  notes: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  consumeButton: {
    backgroundColor: Colors.secondary,
  },
  shoppingListButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});