# Setting Up OCR with Google Cloud Vision API

This guide explains how to implement real Optical Character Recognition (OCR) capabilities in your Zero Waste Pantry app using Google Cloud Vision API.

## 1. Set Up a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable billing for your project
4. Go to "APIs & Services" > "Library"
5. Search for "Cloud Vision API" and enable it

## 2. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key and store it securely

## 3. Install Required Packages

```bash
npm install @react-native-google-signin/google-signin @react-native-community/netinfo axios
```

## 4. Create a Google Cloud Vision API Service

```typescript
// utils/visionApi.ts

import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Add your API key here
const API_KEY = 'YOUR_GOOGLE_CLOUD_VISION_API_KEY';
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

export const recognizeText = async (imageUri: string): Promise<string> => {
  try {
    // Convert the image to base64
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
```

## 5. Update OCRScanner Component

Replace the simulated OCR in your `OCRScanner.tsx` component with the real API call:

```typescript
// Import the vision API functions
import { recognizeText, extractExpiryDate, standardizeDate } from '@/utils/visionApi';

// In your processImage function:
const processImage = async (uri: string) => {
  setLoading(true);
  setResult(null);
  
  try {
    // Resize the image (keep this part)
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { format: SaveFormat.JPEG, compress: 0.8 }
    );
    
    // Call the Google Cloud Vision API
    const recognizedText = await recognizeText(manipResult.uri);
    setResult(recognizedText);
    
    // Try to extract the expiry date
    const extractedDate = extractExpiryDate(recognizedText);
    let formattedDate = null;
    
    if (extractedDate) {
      formattedDate = standardizeDate(extractedDate);
    }
    
    Alert.alert(
      'OCR Result',
      `Detected text: ${recognizedText.substring(0, 100)}${recognizedText.length > 100 ? '...' : ''}`,
      [
        {
          text: 'Use This Date',
          onPress: () => {
            onClose();
            if (formattedDate) {
              router.push(`../add-item?expiryDate=${formattedDate}`);
            } else {
              router.push('../add-item');
            }
          },
        },
        {
          text: 'Try Again',
          onPress: () => {
            setImage(null);
            setResult(null);
          },
        },
      ]
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to process the image');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

## 6. Important Security Considerations

1. **Never hardcode your API key** in your application code that gets distributed to users. Instead:
   - Use environment variables during development
   - For production, implement a secure backend proxy service

2. **Implement request quotas** to prevent excessive API usage costs

3. **Add error handling** for network failures and API restrictions

## 7. Production Setup

For a production app, you should:

1. Create a simple backend service (e.g., using Node.js or Firebase Functions)
2. Make OCR requests through your backend
3. Keep your API key secure on the server
4. Implement rate limiting and user authentication

Example backend route:
```javascript
// Example Cloud Function
exports.processImage = functions.https.onCall(async (data, context) => {
  // Authenticate the user
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Unauthorized');
  }
  
  // Make the Vision API request with your securely stored API key
  // Process the base64 image sent in the data.image field
  // Return the results
});
``` 