import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';

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
      
      {actionButton && (
        <TouchableOpacity 
          style={styles.button}
          onPress={actionButton.onPress}
        >
          <Text style={styles.buttonText}>{actionButton.title}</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmptyState;