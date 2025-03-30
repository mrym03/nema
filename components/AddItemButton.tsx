import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Text, View, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Plus, X, ShoppingBag, Layers, Camera, Tag } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animated: any = { Value: class {}, timing: () => ({ start: () => {} }) };
let Easing: any = {};

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

try {
  const ReactNative = require('react-native');
  Animated = ReactNative.Animated;
  Easing = ReactNative.Easing;
} catch (e) {
  console.warn('Animated API not available, using fallback');
}

const { width, height } = Dimensions.get('window');

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
  
  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const menuScaleY = useRef(new Animated.Value(0)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuItemsOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // Floating animation for button
  const floatAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start floating animation for the button
    startFloatingAnimation();
  }, []);
  
  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    ).start();
  };
  
  const openMenu = () => {
    setMenuVisible(true);
    
    // Animate menu opening
    Animated.sequence([
      // Fade in background
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      // Slide up menu
      Animated.parallel([
        Animated.timing(menuScaleY, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.2))
        }),
        Animated.timing(menuOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        })
      ]),
      // Fade in menu items with stagger
      Animated.timing(menuItemsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      })
    ]).start();
  };
  
  const closeMenu = () => {
    // Animate menu closing
    Animated.parallel([
      Animated.timing(menuScaleY, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }),
      Animated.timing(menuOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start(() => {
      setMenuVisible(false);
      // Reset animation values
      menuItemsOpacity.setValue(0);
    });
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
  
  // Handle button press animation
  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.92,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  // Transform for floating effect
  const floatTransform = {
    transform: [{ translateY: floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -6]
    })}]
  };
  
  // Scale animation when pressed
  const scaleTransform = {
    transform: [
      { scale: buttonScale },
      { translateY: floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6]
      })}
    ]
  };
  
  return (
    <>
      <Animated.View style={[styles.buttonWrapper, scaleTransform]}>
        <TouchableOpacity 
          onPress={openMenu}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={styles.touchableArea}
        >
          {shouldUseGradient ? (
            <LinearGradient
              colors={['#63E2B7', '#3A8F71']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.container}
            >
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          ) : (
            <View style={[styles.container, { backgroundColor: '#63E2B7' }]}>
              <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent={true}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: backgroundOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalTouchableOverlay}
            activeOpacity={1}
            onPress={closeMenu}
          />
          
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                opacity: menuOpacity,
                transform: [
                  { 
                    scaleY: menuScaleY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1]
                    })
                  },
                  { 
                    translateY: menuScaleY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0]
                    })
                  }
                ],
              }
            ]}
          >
            <BlurView intensity={25} tint="dark" style={styles.blurContainer}>
              <View style={styles.handle} />
              
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Add to Pantry</Text>
                <TouchableOpacity 
                  onPress={closeMenu}
                  style={styles.closeButton}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <Animated.View style={{ opacity: menuItemsOpacity }}>
                <View style={styles.menuItemsContainer}>
                  <MenuOption 
                    icon={<ShoppingBag size={24} color="#FFFFFF" />}
                    title="Add Single Item"
                    description="Manually add an item to your pantry"
                    color="#63E2B7"
                    index={0}
                    onPress={handleAddSingleItem}
                  />
                  
                  <MenuOption 
                    icon={<Camera size={24} color="#FFFFFF" />}
                    title="Scan Multiple Items"
                    description="Add multiple items using your camera"
                    color="#4990FD"
                    index={1}
                    onPress={handleMultiItemScan}
                  />
                  
                  <MenuOption 
                    icon={<Tag size={24} color="#FFFFFF" />}
                    title="Scan Barcode"
                    description="Add item by scanning its barcode"
                    color="#FF8700"
                    index={2}
                    onPress={handleAddSingleItem}
                  />
                </View>
              </Animated.View>
            </BlurView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

interface MenuOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  index: number;
  onPress: () => void;
}

const MenuOption: React.FC<MenuOptionProps> = ({ 
  icon, 
  title, 
  description, 
  color,
  index,
  onPress 
}) => {
  // Animation values
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  // Should use gradient if available
  const shouldUseGradient = LinearGradient !== View;
  
  useEffect(() => {
    // Animate in with staggered delay
    Animated.sequence([
      Animated.delay(100 * index),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, []);
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true
    }).start();
  };
  
  return (
    <Animated.View style={[
      styles.menuOptionContainer,
      {
        opacity,
        transform: [{ scale }]
      }
    ]}>
      <TouchableOpacity
        style={styles.menuOptionTouchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.menuOptionContent}>
          {shouldUseGradient ? (
            <LinearGradient
              colors={[color, color + '90']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBackground}
            >
              {icon}
            </LinearGradient>
          ) : (
            <View style={[styles.iconBackground, { backgroundColor: color }]}>
              {icon}
            </View>
          )}
          
          <View style={styles.menuItemTextContainer}>
            <Text style={styles.menuItemText}>{title}</Text>
            <Text style={styles.menuItemDescription}>{description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  touchableArea: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  container: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalTouchableOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  menuContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomWidth: 0,
  },
  blurContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuItemsContainer: {
    gap: 16,
  },
  menuOptionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuOptionTouchable: {
    borderRadius: 16,
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
})

export default AddItemButton;