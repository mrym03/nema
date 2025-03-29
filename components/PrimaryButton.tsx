import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import Colors from '@/constants/colors';

// Conditional imports to handle potential errors
let LinearGradient: any = View;
let Animatable: any = { View };

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
  Animatable = require('react-native-animatable');
} catch (e) {
  console.warn('react-native-animatable not available, using fallback');
}

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  width?: number | string;
  style?: any;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  size = 'medium',
  width,
  style,
}) => {
  const getGradientColors = () => {
    if (disabled) return ['#CCCCCC', '#BBBBBB'];
    
    switch (variant) {
      case 'secondary':
        return Colors.gradientSecondary;
      case 'success':
        return Colors.gradientSuccess;
      case 'danger':
        return ['#EF4444', '#DC2626'];
      case 'outline':
        return ['transparent', 'transparent'];
      case 'primary':
      default:
        return Colors.gradientPrimary;
    }
  };
  
  const getHeight = () => {
    switch (size) {
      case 'small':
        return 36;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 48;
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      case 'medium':
      default:
        return 16;
    }
  };
  
  const getTextColor = () => {
    if (disabled) return Colors.textLight;
    if (variant === 'outline') return Colors.primary;
    return '#FFFFFF';
  };
  
  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? Colors.border : Colors.primary;
    }
    return 'transparent';
  };
  
  const getBackgroundColor = () => {
    if (disabled) return '#CCCCCC';
    
    switch (variant) {
      case 'secondary':
        return Colors.secondary;
      case 'success':
        return Colors.success;
      case 'danger':
        return Colors.danger;
      case 'outline':
        return 'transparent';
      case 'primary':
      default:
        return Colors.primary;
    }
  };
  
  const handlePress = () => {
    if (!disabled && !loading) {
      // Directly call onPress without animation if Animatable is not available
      onPress();
    }
  };
  
  const ContainerComponent = Animatable.View || View;
  
  // Determine if we should use LinearGradient or fallback to a regular view
  const shouldUseGradient = LinearGradient !== View;
  
  return (
    <ContainerComponent
      style={[
        styles.container,
        { height: getHeight(), width: width },
        style
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={disabled || loading}
        style={styles.touchable}
      >
        {shouldUseGradient ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gradient,
              { borderColor: getBorderColor(), borderWidth: variant === 'outline' ? 1.5 : 0 }
            ]}
          >
            {loading ? (
              <ActivityIndicator 
                color={variant === 'outline' ? Colors.primary : '#FFFFFF'} 
                size="small" 
              />
            ) : (
              <View style={styles.contentContainer}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[
                  styles.text, 
                  { 
                    fontSize: getFontSize(), 
                    color: getTextColor(),
                    marginLeft: icon ? 8 : 0
                  }
                ]}>
                  {title}
                </Text>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.gradient,
              { 
                borderColor: getBorderColor(), 
                borderWidth: variant === 'outline' ? 1.5 : 0,
                backgroundColor: getBackgroundColor()
              }
            ]}
          >
            {loading ? (
              <ActivityIndicator 
                color={variant === 'outline' ? Colors.primary : '#FFFFFF'} 
                size="small" 
              />
            ) : (
              <View style={styles.contentContainer}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[
                  styles.text, 
                  { 
                    fontSize: getFontSize(), 
                    color: getTextColor(),
                    marginLeft: icon ? 8 : 0
                  }
                ]}>
                  {title}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PrimaryButton; 