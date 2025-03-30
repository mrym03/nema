import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { BlurView } from 'expo-blur';
import { PlusCircle, ArrowRight } from 'lucide-react-native';

// Conditional imports to handle potential errors
let Animated: any = { Value: class {}, timing: () => ({ start: () => {} }) };
let Easing: any = {};
let LinearGradient: any = View;

// Try to import the libraries, but use fallbacks if they fail
try {
  const ReactNative = require('react-native');
  Animated = ReactNative.Animated;
  Easing = ReactNative.Easing;
} catch (e) {
  console.warn('Animated API not available, using fallback');
}

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

const { width } = Dimensions.get('window');

interface EmptyStateProps {
  title: string;
  message: string;
  imageUrl?: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, imageUrl, actionButton }) => {
  // Animation values
  const imageScale = React.useRef(new Animated.Value(0.8)).current;
  const contentOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonScale = React.useRef(new Animated.Value(0.9)).current;
  
  // Floating animation for image
  const floatY = React.useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Animate elements in
    Animated.sequence([
      Animated.timing(imageScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.elastic(1))
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5))
      })
    ]).start();
    
    // Start floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin)
        })
      ])
    ).start();
  }, []);
  
  // Handle button press animation
  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad)
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4
    }).start();
  };
  
  const shouldUseGradient = LinearGradient !== View;
  
  return (
    <View style={styles.container}>
      {imageUrl && (
        <Animated.View style={[
          styles.imageWrapper,
          { 
            transform: [
              { scale: imageScale },
              { translateY: floatY }
            ]
          }
        ]}>
          <Image
            source={imageUrl}
            style={styles.image}
            contentFit="cover"
            transition={500}
          />
          
          {shouldUseGradient && (
            <LinearGradient
              colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
              style={styles.imageOverlay}
            />
          )}
        </Animated.View>
      )}
      
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: contentOpacity }
        ]}
      >
        <View style={styles.glassContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          {actionButton && (
            <Animated.View style={{ 
              transform: [{ scale: buttonScale }],
              alignSelf: 'center'
            }}>
              {shouldUseGradient ? (
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <TouchableOpacity 
                    style={styles.button}
                    onPress={actionButton.onPress}
                    activeOpacity={0.8}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <PlusCircle size={18} color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>{actionButton.title}</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: Colors.primary }]}
                  onPress={actionButton.onPress}
                  activeOpacity={0.8}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <PlusCircle size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>{actionButton.title}</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  imageWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  glassContainer: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonGradient: {
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});

export default EmptyState;