import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FoodItem } from '@/types';
import Colors from '@/constants/colors';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { formatRelativeDate } from '@/utils/date';

interface ExpiringFoodAlertProps {
  items: FoodItem[];
  onPress: () => void;
}

const ExpiringFoodAlert: React.FC<ExpiringFoodAlertProps> = ({ items, onPress }) => {
  if (items.length === 0) return null;

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <AlertTriangle size={24} color="#fff" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Food expiring soon!</Text>
        <Text style={styles.message}>
          {items.length === 1 
            ? `${items[0].name} expires in ${formatRelativeDate(items[0].expiryDate)}`
            : `${items.length} items are expiring soon`
          }
        </Text>
      </View>
      
      <ChevronRight size={20} color="#fff" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});

export default ExpiringFoodAlert;