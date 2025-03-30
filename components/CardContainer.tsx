import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/colors';

// Conditional imports for Animatable to handle potential errors
let Animatable: any = { View };

try {
  Animatable = require('react-native-animatable');
} catch (e) {
  console.warn('Animatable not available, using fallback');
}

type ElevationLevel = 'none' | 'low' | 'medium' | 'high';

interface CardContainerProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevation?: ElevationLevel;
  animate?: boolean;
  animation?: string;
  duration?: number;
  delay?: number;
}

const CardContainer: React.FC<CardContainerProps> = ({
  children,
  style,
  elevation = 'medium',
  animate = true,
  animation = 'fadeIn',
  duration = 600,
  delay = 0,
}) => {
  // Determine shadow styles based on elevation level
  const elevationStyles = {
    none: {},
    low: styles.shadowLow,
    medium: styles.shadowMedium,
    high: styles.shadowHigh,
  };

  // Determine if we should use animations or fallback to regular View
  const shouldAnimate = animate && Animatable.View !== View;
  const AnimatableView = shouldAnimate ? Animatable.View : View;
  
  const animationProps = shouldAnimate
    ? {
        animation,
        duration,
        delay,
        useNativeDriver: true
      }
    : {};

  return (
    <AnimatableView
      style={[styles.container, elevationStyles[elevation], style]}
      {...animationProps}
    >
      {children}
    </AnimatableView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0,
  },
  shadowLow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shadowHigh: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default CardContainer; 