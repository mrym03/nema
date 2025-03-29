import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

interface EmptyStateProps {
  title: string;
  message: string;
  imageUrl?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, imageUrl }) => {
  return (
    <View style={styles.container}>
      {imageUrl && (
        <Image
          source={imageUrl}
          style={styles.image}
          contentFit="contain"
        />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    maxWidth: '80%',
  },
});

export default EmptyState;