import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ShoppingListItem as ShoppingListItemType } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import Colors from '@/constants/colors';
import { Check, Trash2 } from 'lucide-react-native';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({ 
  item, 
  onToggle, 
  onDelete 
}) => {
  const category = CATEGORIES[item.category];

  return (
    <View style={styles.container}>
      <Pressable 
        style={({ pressed }) => [
          styles.checkbox,
          item.completed && styles.checkboxCompleted,
          pressed && styles.pressed
        ]}
        onPress={() => onToggle(item.id)}
      >
        {item.completed && <Check size={16} color="#fff" />}
      </Pressable>
      
      <View style={styles.content}>
        <Text 
          style={[
            styles.name,
            item.completed && styles.completedText
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.quantity}>
            {item.quantity} {item.unit}
          </Text>
          
          <View 
            style={[
              styles.categoryBadge, 
              { backgroundColor: category.color }
            ]}
          >
            <Text style={styles.categoryText}>{category.label}</Text>
          </View>
        </View>
      </View>
      
      <Pressable 
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.pressed
        ]}
        onPress={() => onDelete(item.id)}
      >
        <Trash2 size={20} color={Colors.danger} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantity: {
    fontSize: 14,
    color: Colors.textLight,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ShoppingListItem;