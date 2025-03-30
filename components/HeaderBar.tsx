import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import MaskedView from '@react-native-masked-view/masked-view';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animated: any = { View };
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

// Custom animations
const fadeInDownFast = {
  0: { opacity: 0, translateY: -10 },
  1: { opacity: 1, translateY: 0 },
};

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  rightButtons?: ReactNode;
  containerStyle?: ViewStyle;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  rightButtons,
  containerStyle,
}) => {
  // Determine if we should use animations
  const AnimatableView = Animated.View || View;
  
  // Should use gradient if available
  const shouldUseGradient = LinearGradient !== View;
  
  return (
    <SafeAreaView style={[styles.header, containerStyle]} edges={['top']}>
      <AnimatableView animation={fadeInDownFast} duration={600}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <MaskedView
              maskElement={
                <Text style={styles.titleMask}>{title}</Text>
              }
            >
              {shouldUseGradient ? (
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.titleGradient}
                />
              ) : (
                <View style={[styles.titleGradient, { backgroundColor: Colors.primary }]} />
              )}
            </MaskedView>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
          
          {rightButtons && (
            <View style={styles.headerButtons}>
              {rightButtons}
            </View>
          )}
        </View>
      </AnimatableView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleMask: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
  },
  titleGradient: {
    height: 45,
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: -5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
  },
});

export default HeaderBar; 