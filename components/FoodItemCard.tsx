import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { FoodItem } from '@/types';
import { formatRelativeDate, isExpiringSoon, isExpired } from '@/utils/date';
import { CATEGORIES } from '@/constants/categories';
import Colors from '@/constants/colors';
import { Clock, AlertTriangle } from 'lucide-react-native';

interface FoodItemCardProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
}

const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onPress }) => {
  const category = CATEGORIES[item.category];
  const daysUntilExpiry = formatRelativeDate(item.expiryDate);
  const isExpiring = isExpiringSoon(item.expiryDate);
  const expired = isExpired(item.expiryDate);

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={() => onPress(item)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=300'}
          style={styles.image}
          contentFit="cover"
        />
        <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
          <Text style={styles.categoryText}>{category.label}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
        
        <View style={styles.expiryContainer}>
          {expired ? (
            <View style={styles.expiryRow}>
              <AlertTriangle size={16} color={Colors.danger} />
              <Text style={[styles.expiryText, styles.expiredText]}>Expired</Text>
            </View>
          ) : (
            <View style={styles.expiryRow}>
              <Clock size={16} color={isExpiring ? Colors.warning : Colors.textLight} />
              <Text 
                style={[
                  styles.expiryText, 
                  isExpiring && styles.expiringSoonText
                ]}
              >
                Expires in {daysUntilExpiry}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  expiryContainer: {
    marginTop: 4,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  expiringSoonText: {
    color: Colors.warning,
    fontWeight: '500',
  },
  expiredText: {
    color: Colors.danger,
    fontWeight: '500',
  },
});

export default FoodItemCard;