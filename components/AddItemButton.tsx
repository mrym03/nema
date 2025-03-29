import React, { useState } from 'react';
import { StyleSheet, Pressable, Text, View, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Plus, X, ShoppingBag, Layers } from 'lucide-react-native';

interface AddItemButtonProps {
  onPress: () => void;
  label?: string;
}

const AddItemButton: React.FC<AddItemButtonProps> = ({ 
  onPress, 
  label = 'Add Item' 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  
  const openMenu = () => {
    setMenuVisible(true);
  };
  
  const closeMenu = () => {
    setMenuVisible(false);
  };
  
  const handleAddSingleItem = () => {
    closeMenu();
    onPress();
  };
  
  const handleMultiItemScan = () => {
    closeMenu();
    // Open add-item screen with the multi-item scanner modal visible
    router.push({
      pathname: "../add-item",
      params: {
        openMultiItemScanner: "true"
      }
    });
  };
  
  return (
    <>
      <Pressable 
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed
        ]}
        onPress={openMenu}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Add to Pantry</Text>
              <TouchableOpacity onPress={closeMenu}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddSingleItem}
            >
              <ShoppingBag size={24} color={Colors.icon} />
              <Text style={styles.menuItemText}>Add Single Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleMultiItemScan}
            >
              <Layers size={24} color={Colors.icon} />
              <Text style={styles.menuItemText}>Scan Multiple Items</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: Colors.text,
  },
});

export default AddItemButton;