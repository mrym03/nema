import React from 'react';
import { Tabs } from 'expo-router';
import Colors from '@/constants/colors';
import { Refrigerator, ChefHat, ShoppingCart } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 6,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pantry',
          tabBarLabel: 'Pantry',
          tabBarIcon: ({ color, size }) => (
            <Refrigerator size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color, size }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: 'Shopping List',
          tabBarLabel: 'Shopping',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}