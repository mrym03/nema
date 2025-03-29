import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { 
  ShoppingCart, 
  Apple, 
  BookOpen, 
  User,
  Home
} from 'lucide-react-native';

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

// Custom tab bar component with animations
// Using any type to avoid complex typing issues with the tab navigator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TabBar(props: any) {
  const { state, descriptors, navigation } = props;
  const insets = useSafeAreaInsets();
  
  // Check if LinearGradient and Animatable are available
  const shouldUseGradient = LinearGradient !== View;
  const AnimatableView = Animatable.View || View;
  
  const TabBarContainer = shouldUseGradient 
    ? LinearGradient
    : View;
  
  const tabBarContainerProps = shouldUseGradient 
    ? {
        colors: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.98)'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
        style: [
          styles.tabBar,
          { paddingBottom: insets.bottom || 15 }
        ]
      }
    : {
        style: [
          styles.tabBar, 
          { backgroundColor: 'rgba(255,255,255,0.95)' },
          { paddingBottom: insets.bottom || 15 }
        ]
      };
  
  return (
    <TabBarContainer {...tabBarContainerProps}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const getIcon = () => {
          const iconColor = isFocused ? Colors.primary : Colors.textLight;
          const size = 24;

          switch (route.name) {
            case 'index':
              return <Home size={size} color={iconColor} />;
            case 'shopping-list':
              return <ShoppingCart size={size} color={iconColor} />;
            case 'recipes':
              return <BookOpen size={size} color={iconColor} />;
            case 'account':
              return <User size={size} color={iconColor} />;
            default:
              return <Home size={size} color={iconColor} />;
          }
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getLabel = () => {
          switch (route.name) {
            case 'index':
              return 'My Pantry';
            case 'shopping-list':
              return 'Shopping';
            case 'recipes':
              return 'Recipes';
            case 'account':
              return 'Account';
            default:
              return route.name;
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            android_ripple={{ color: Colors.primaryLight, borderless: true }}
          >
            <View style={styles.tabItemContainer}>
              {isFocused ? (
                <AnimatableView
                  animation="bounceIn"
                  duration={500}
                >
                  {getIcon()}
                </AnimatableView>
              ) : (
                getIcon()
              )}
              
              {isFocused && (
                <AnimatableView 
                  animation="fadeIn" 
                  duration={300}
                  style={styles.indicator}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </TabBarContainer>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="shopping-list" />
      <Tabs.Screen name="recipes" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 'auto',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 45,
  },
  indicator: {
    position: 'absolute',
    bottom: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});