import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

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

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  height?: number;
}

const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  children,
  colors = [Colors.primary, Colors.primaryLight],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  height = 180,
}) => {
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  const GradientComponent = shouldUseGradient ? LinearGradient : View;
  
  const gradientProps = shouldUseGradient
    ? {
        colors,
        start,
        end,
        style: [styles.gradient, { height }]
      }
    : {
        style: [styles.gradient, { height, backgroundColor: colors[0] }]
      };

  return (
    <GradientComponent {...gradientProps}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {children && <View style={styles.childrenContainer}>{children}</View>}
      </View>
    </GradientComponent>
  );
};

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  childrenContainer: {
    width: '100%',
  },
});

export default GradientHeader; 