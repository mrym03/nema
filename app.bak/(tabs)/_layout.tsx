import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Stack, Tabs } from 'expo-router';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  List,
  Calendar,
  Settings,
  Home as HomeIcon, 
  User,
  Scan,
  ChefHat,
  ShoppingCart,
  Leaf
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

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

function TabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Check if required components are available
  const shouldUseGradient = LinearGradient !== View;
  const AnimatableView = Animatable.View || View;
  
  // Get current tab name
  const getCurrentTabName = () => {
    const route = state.routes[state.index];
    return route?.name || '';
  };

  return (
    <View style={[
      styles.container,
      {
        height: 70 + (insets.bottom > 0 ? insets.bottom : 15),
        paddingBottom: insets.bottom > 0 ? insets.bottom : 15
      }
    ]}>
      {shouldUseGradient ? (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.97)']}
          style={styles.background}
        />
      ) : (
        <View style={[styles.background, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} />
      )}
      
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          
          const isFocused = state.index === index;
          
          // Get the appropriate icon based on the route name
          const getIcon = () => {
            const iconProps = {
              size: 24,
              color: isFocused ? Colors.primary : Colors.textLight,
              style: { marginBottom: 2 }
            };
            
            switch (route.name) {
              case 'index':
                return <HomeIcon {...iconProps} />;
              case 'scan':
                return <Scan {...iconProps} />;
              case 'recipes':
                return <ChefHat {...iconProps} />;
              case 'meal-plan':
                return <Calendar {...iconProps} />;
              case 'grocery-list':
                return <ShoppingCart {...iconProps} />;
              case 'sustainability':
                return <Leaf {...iconProps} />;
              default:
                return <List {...iconProps} />;
            }
          };
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
            >
              {getIcon()}
              
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? Colors.primary : Colors.textLight }
              ]}>
                {label === 'index' ? 'Pantry' : 
                 label === 'grocery-list' ? 'Grocery' :
                 label}
              </Text>
              
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pantry',
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: 'Meal Plan',
        }}
      />
      <Tabs.Screen
        name="grocery-list"
        options={{
          title: 'Shopping-list',
        }}
      />
      <Tabs.Screen
        name="sustainability"
        options={{
          title: 'Sustainability',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 100,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 70,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
  }
});