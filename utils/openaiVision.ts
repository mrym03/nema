import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FoodCategory } from '@/types';
import { OPENAI_API_KEY } from './env';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper function to convert image to base64
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
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

// Identify the food item in an image using OpenAI's Vision model
export const identifyFoodWithOpenAI = async (imageUri: string): Promise<{
  name: string,
  category: FoodCategory
}> => {
  try {
    console.log("Starting OpenAI Vision API process...");
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    console.log("Image converted to base64");
    
    // Create request body for OpenAI API
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a food recognition AI. Analyze this image and identify what food item is shown. IMPORTANT: Be very specific and accurate. DO NOT default to common items like milk or dairy without clear evidence. If you're uncertain, identify based on what you see. Only respond with the exact food name and its category in this format: 'Item: [food name], Category: [category]'. Valid categories are strictly limited to: fruits, vegetables, dairy, meat, seafood, grains, bakery, canned, frozen, snacks, beverages, condiments, spices, or other."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 150
    };
    
    console.log("Sending request to OpenAI API...");
    
    // Call OpenAI API
    const response = await axios.post(OPENAI_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });
    
    console.log("Received response from OpenAI API");
    
    // Extract response text
    const responseText = response.data.choices[0]?.message?.content || '';
    console.log("Raw API response:", responseText);
    
    // Parse the response to extract food name and category
    const itemMatch = responseText.match(/Item:\s*([^,\n]+)/i);
    const categoryMatch = responseText.match(/Category:\s*([^,\n]+)/i);
    
    let foodName = itemMatch ? itemMatch[1].trim() : 'Unknown Food';
    let rawCategory = categoryMatch ? categoryMatch[1].trim().toLowerCase() : 'other';
    
    console.log(`Extracted food name: "${foodName}", category: "${rawCategory}"`);
    
    // Validate the category
    const validCategories: FoodCategory[] = [
      'fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'grains', 
      'bakery', 'canned', 'frozen', 'snacks', 'beverages', 'condiments', 
      'spices', 'other'
    ];
    
    // Map to valid category if not exact match
    const categoryMap: Record<string, FoodCategory> = {
      'fruit': 'fruits',
      'vegetable': 'vegetables',
      'baked goods': 'bakery',
      'bread': 'bakery',
      'pastry': 'bakery',
      'beverage': 'beverages',
      'drink': 'beverages',
      'condiment': 'condiments',
      'spice': 'spices',
      'grain': 'grains',
      'cereal': 'grains',
      'pasta': 'grains',
      'rice': 'grains',
      'fish': 'seafood'
    };
    
    let foodCategory: FoodCategory = categoryMap[rawCategory] || rawCategory as FoodCategory;
    
    // Default to 'other' if category is not valid
    if (!validCategories.includes(foodCategory as FoodCategory)) {
      console.log(`Converting invalid category "${foodCategory}" to "other"`);
      foodCategory = 'other';
    }
    
    console.log(`Final result - Name: "${foodName}", Category: "${foodCategory}"`);
    
    return {
      name: foodName,
      category: foodCategory as FoodCategory
    };
  } catch (error: any) {
    console.error('Error identifying food with OpenAI:', 
      error.response?.data || error.message || error);
    throw error;
  }
};

/**
 * Identifies multiple food items in a single image using OpenAI's Vision API
 * @param imageUri Uri of the image to analyze
 * @returns Array of identified food items and their categories
 */
export async function identifyMultipleFoodItemsWithOpenAI(
  imageUri: string
): Promise<Array<{ name: string; category: FoodCategory }>> {
  try {
    console.log("Starting multiple food item identification with OpenAI Vision API...");
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    console.log("Image converted to base64");
    
    // Construct request body
    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI that identifies food items from images. 
          Your task is to analyze the image and list ALL food items visible, providing:
          1. The name of each food item
          2. Its appropriate food category
          
          Valid food categories are: fruits, vegetables, dairy, meat, seafood, grains, bakery, canned, frozen, snacks, beverages, condiments, spices, other.
          
          Format your response as a JSON array with objects containing "name" and "category" for each item. 
          Example: [{"name": "Apple", "category": "fruits"}, {"name": "Bread", "category": "bakery"}]
          
          If you're uncertain about an item, list it as "other" category.
          Identify as many distinct items as you can see in the image.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What food items do you see in this image? Please identify each food item and its category." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    };
    
    console.log("Sending request to OpenAI API...");
    
    // Send request to OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    
    // Extract response content
    const content = response.data.choices[0].message.content;
    console.log("OpenAI response:", content);
    
    // Parse the food items from the response
    try {
      // Extract JSON array from the response (handling cases where there might be extra text)
      const jsonMatch = content.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.log("No JSON array found in response");
        return [];
      }
      
      const jsonStr = jsonMatch[0];
      const foodItems = JSON.parse(jsonStr);
      
      // Map of raw categories to valid categories to ensure consistent formatting
      const categoryMap: Record<string, FoodCategory> = {
        fruit: 'fruits',
        vegetable: 'vegetables',
        dairy: 'dairy',
        meat: 'meat',
        seafood: 'seafood',
        grain: 'grains',
        bakery: 'bakery',
        canned: 'canned',
        frozen: 'frozen',
        snack: 'snacks',
        beverage: 'beverages',
        condiment: 'condiments',
        spice: 'spices',
        other: 'other'
      };
      
      // Process each item to ensure valid categories
      const validFoodItems = foodItems.map((item: any) => {
        const rawCategory = (item.category || '').toLowerCase().trim();
        // Use mapping or default to 'other' if category is invalid
        const validCategory = (categoryMap[rawCategory] || rawCategory) as FoodCategory;
        
        // If it's still not a valid category, default to 'other'
        const validCategories: FoodCategory[] = [
          'fruits', 'vegetables', 'dairy', 'meat', 'seafood', 'grains', 
          'bakery', 'canned', 'frozen', 'snacks', 'beverages', 'condiments', 
          'spices', 'other'
        ];
        
        const category = validCategories.includes(validCategory) ? validCategory : 'other';
        
        return {
          name: item.name || "Unknown Food Item",
          category
        };
      });
      
      console.log("Identified food items:", validFoodItems);
      return validFoodItems;
    } catch (error) {
      console.error("Error parsing food items from response:", error);
      return [];
    }
    
  } catch (error: any) {
    console.error("Error in identifyMultipleFoodItemsWithOpenAI:", error);
    console.error("Error details:", error.response?.data || error.message);
    throw error;
  }
} 