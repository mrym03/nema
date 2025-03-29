import React, { useState } from 'react';
import { StyleSheet, Pressable, Text, View, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Plus, X, ShoppingBag, Layers } from 'lucide-react-native';

// Conditional imports to handle potential errors
let LinearGradient: any = View;

// Try to import the libraries, but use fallbacks if they fail
try {
  // First try the Expo version of LinearGradient
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  try {
    // Fall back to react-native-linear-gradient if Expo version fails
    LinearGradient = require('react-native-linear-gradient').LinearGradient;
  } catch (e) {
    console.warn('Linear gradient not available, using fallback');
  }
}

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
  
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  const GradientComponent = shouldUseGradient ? LinearGradient : View;
  
  const gradientProps = shouldUseGradient
    ? {
        colors: [Colors.primary, Colors.primaryDark],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: styles.container
      }
    : {
        style: [styles.container, { backgroundColor: Colors.primary }]
      };

  return (
    <>
      <TouchableOpacity 
        style={styles.buttonWrapper}
        onPress={openMenu}
        activeOpacity={0.8}
      >
        <GradientComponent {...gradientProps}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.label}>{label}</Text>
        </GradientComponent>
      </TouchableOpacity>
      
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
              <TouchableOpacity 
                onPress={closeMenu}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleAddSingleItem}
              activeOpacity={0.7}
            >
              <GradientComponent
                colors={[Colors.primaryLight, '#fff']}
                style={styles.iconBackground}
              >
                <ShoppingBag size={24} color={Colors.primary} />
              </GradientComponent>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Add Single Item</Text>
                <Text style={styles.menuItemDescription}>
                  Manually add an item to your pantry
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleMultiItemScan}
              activeOpacity={0.7}
            >
              <GradientComponent
                colors={[Colors.secondaryLight, '#fff']}
                style={styles.iconBackground}
              >
                <Layers size={24} color={Colors.secondary} />
              </GradientComponent>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>Scan Multiple Items</Text>
                <Text style={styles.menuItemDescription}>
                  Add multiple items using your camera
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    color: 'white',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  iconBackground: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
});

export default AddItemButton;