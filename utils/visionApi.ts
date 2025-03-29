import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FoodCategory } from '@/types';
import { GOOGLE_CLOUD_VISION_API_KEY } from './env';

// Use the API key from env.ts
const API_KEY = GOOGLE_CLOUD_VISION_API_KEY;
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

// Text recognition for OCR
export const recognizeText = async (imageUri: string): Promise<string> => {
  try {
    // Convert the image to base64
    const base64Image = await convertImageToBase64(imageUri);
    
    // Create the request body
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 5,
            },
          ],
        },
      ],
    };
    
    // Call the Cloud Vision API
    const response = await axios.post(API_URL, requestBody);
    
    // Extract and return the text
    const detections = response.data.responses[0].textAnnotations || [];
    return detections.length > 0 ? detections[0].description : '';
  } catch (error) {
    console.error('Error recognizing text:', error);
    throw error;
  }
};

// Label detection for product identification
export const identifyProduct = async (imageUri: string): Promise<{
  labels: string[],
  name: string,
  category: FoodCategory
}> => {
  try {
    // Convert the image to base64
    const base64Image = await convertImageToBase64(imageUri);
    
    // Create the request body
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10,
            },
          ],
        },
      ],
    };
    
    // Call the Cloud Vision API
    const response = await axios.post(API_URL, requestBody);
    
    // Extract labels
    const labels = response.data.responses[0].labelAnnotations || [];
    const labelTexts = labels.map((label: any) => label.description.toLowerCase());
    
    // Map to food categories
    const { name, category } = mapLabelsToFoodItem(labelTexts);
    
    return {
      labels: labelTexts,
      name,
      category
    };
  } catch (error) {
    console.error('Error identifying product:', error);
    throw error;
  }
};

// Helper function to convert image to base64
const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  let base64Image: string;
  
  if (Platform.OS === 'web') {
    // For web, fetch the image and convert to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    base64Image = await convertBlobToBase64(blob);
  } else {
    // For native platforms, use Expo FileSystem
    base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  
  return base64Image;
};

// Helper function to convert blob to base64 (for web)
const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // Remove the data URL prefix
    };
    reader.readAsDataURL(blob);
  });
};

// Map labels from Vision API to food items
const mapLabelsToFoodItem = (labels: string[]): { name: string, category: FoodCategory } => {
  // Define mappings for common food items
  const categoryMappings: Record<string, { name: string, category: FoodCategory }> = {
    // Produce
    'banana': { name: 'Banana', category: 'fruits' },
    'apple': { name: 'Apple', category: 'fruits' },
    'orange': { name: 'Orange', category: 'fruits' },
    'tomato': { name: 'Tomato', category: 'vegetables' },
    'lettuce': { name: 'Lettuce', category: 'vegetables' },
    'broccoli': { name: 'Broccoli', category: 'vegetables' },
    'carrot': { name: 'Carrot', category: 'vegetables' },
    'potato': { name: 'Potato', category: 'vegetables' },
    'fruit': { name: 'Mixed Fruit', category: 'fruits' },
    'vegetable': { name: 'Mixed Vegetables', category: 'vegetables' },
    
    // Dairy
    'milk': { name: 'Milk', category: 'dairy' },
    'cheese': { name: 'Cheese', category: 'dairy' },
    'yogurt': { name: 'Yogurt', category: 'dairy' },
    'butter': { name: 'Butter', category: 'dairy' },
    'cream': { name: 'Cream', category: 'dairy' },
    
    // Meat
    'chicken': { name: 'Chicken', category: 'meat' },
    'beef': { name: 'Beef', category: 'meat' },
    'pork': { name: 'Pork', category: 'meat' },
    'fish': { name: 'Fish', category: 'seafood' },
    'meat': { name: 'Meat', category: 'meat' },
    'steak': { name: 'Steak', category: 'meat' },
    
    // Grains
    'bread': { name: 'Bread', category: 'bakery' },
    'cereal': { name: 'Cereal', category: 'grains' },
    'rice': { name: 'Rice', category: 'grains' },
    'pasta': { name: 'Pasta', category: 'grains' },
    'noodle': { name: 'Noodles', category: 'grains' },
    
    // Drinks
    'juice': { name: 'Juice', category: 'beverages' },
    'water': { name: 'Water', category: 'beverages' },
    'soda': { name: 'Soda', category: 'beverages' },
    'beer': { name: 'Beer', category: 'beverages' },
    'wine': { name: 'Wine', category: 'beverages' },
    'coffee': { name: 'Coffee', category: 'beverages' },
    'tea': { name: 'Tea', category: 'beverages' },
    
    // Snacks
    'chocolate': { name: 'Chocolate', category: 'snacks' },
    'candy': { name: 'Candy', category: 'snacks' },
    'cookie': { name: 'Cookies', category: 'snacks' },
    'chip': { name: 'Chips', category: 'snacks' },
    'snack': { name: 'Snack', category: 'snacks' },
    
    // Canned
    'can': { name: 'Canned Food', category: 'canned' },
    'soup': { name: 'Soup', category: 'canned' },
    'bean': { name: 'Beans', category: 'canned' },
    
    // Condiments
    'ketchup': { name: 'Ketchup', category: 'condiments' },
    'mustard': { name: 'Mustard', category: 'condiments' },
    'sauce': { name: 'Sauce', category: 'condiments' },
    'oil': { name: 'Oil', category: 'condiments' },
    'vinegar': { name: 'Vinegar', category: 'condiments' },
    'spice': { name: 'Spice', category: 'spices' },
  };
  
  // Look for matches in the labels
  for (const label of labels) {
    for (const [key, value] of Object.entries(categoryMappings)) {
      if (label.includes(key)) {
        return value;
      }
    }
  }
  
  // If no specific match is found, try to determine category
  if (labels.some(l => l.includes('fruit'))) {
    return { name: 'Fruit', category: 'fruits' };
  }
  
  if (labels.some(l => l.includes('vegetable'))) {
    return { name: 'Vegetable', category: 'vegetables' };
  }
  
  if (labels.some(l => l.includes('meat'))) {
    return { name: 'Meat', category: 'meat' };
  }
  
  if (labels.some(l => l.includes('dairy'))) {
    return { name: 'Dairy Product', category: 'dairy' };
  }
  
  // Default
  return { name: 'Food Item', category: 'other' };
};

// Function to extract expiry date using regex
export const extractExpiryDate = (text: string): string | null => {
  // Match common date formats
  // Format: "Best Before: MM/DD/YYYY" or "Expiry: YYYY-MM-DD" or "Use By DD.MM.YYYY"
  const datePatterns = [
    /(?:best before|expiry|expiration|expires on|use by|best by)(?:\s*:?\s*)(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i,
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/i, // Just a date
    /(\d{2,4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2})/i, // YYYY-MM-DD format
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Function to standardize date format to YYYY-MM-DD
export const standardizeDate = (dateStr: string): string | null => {
  try {
    // Handle different separators
    const cleanedDate = dateStr.replace(/[\.\/]/g, '-');
    const parts = cleanedDate.split('-');
    
    if (parts.length !== 3) return null;
    
    let year: string, month: string, day: string;
    
    // Check if first part is year (YYYY-MM-DD)
    if (parts[0].length === 4) {
      [year, month, day] = parts;
    } 
    // MM-DD-YYYY format
    else if (parts[2].length === 4) {
      [month, day, year] = parts;
    } 
    // DD-MM-YYYY format (common in some countries)
    else if (parts[2].length === 4 && parseInt(parts[0]) <= 31) {
      [day, month, year] = parts;
    }
    // Handle 2-digit years
    else if (parts[2].length === 2) {
      const currentYear = new Date().getFullYear();
      const century = Math.floor(currentYear / 100) * 100;
      year = (century + parseInt(parts[2])).toString();
      [month, day] = [parts[0], parts[1]];
    }
    else {
      return null;
    }
    
    // Ensure month and day are two digits
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error standardizing date:', error);
    return null;
  }
}; 