# Zero Waste Pantry App

A mobile application to help reduce food waste by tracking expiration dates of pantry items and providing notifications before items expire.

## Features

- Track pantry items with expiration dates
- Receive notifications before items expire
- Scan barcodes to quickly add products
- Scan expiration dates using OCR (Optical Character Recognition)
- Identify foods with AI image recognition
- View items by categories and expiration status

## NEW: AI-Powered Smart Meal Planning

We've added a new AI-powered meal planning feature that optimizes your weekly meals to minimize food waste. This feature:

- Uses expiration dates to prioritize ingredients that will spoil soon
- Ensures recipe variety throughout the week
- Prevents recipe repetition within the same day
- Preserves your existing meal selections when re-optimizing
- Intelligently combines ingredients to minimize shopping needs

### Setting Up Environment Variables

To use all features of the app, you'll need to set up the following environment variables:

1. Copy the `.env.example` file to create your `.env` file:

   ```
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file:

   ```
   # Required for AI features
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

   # Required for recipe information (if using Spoonacular)
   EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key_here

   # For barcode scanning
   EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_upc_database_api_key_here

   # For OCR capabilities (if using)
   EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=your_vision_api_key_here

   # Optional Firebase configuration (if using)
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
   ```

3. Restart the development server

> ⚠️ **Security Note**: Never commit your `.env` file to version control. The `.gitignore` file is configured to exclude this file. Only the `.env.example` file with placeholder values should be committed.

If no API keys are provided, the app will fall back to local functionality or mock data where possible.

### How AI Meal Planning Works

The AI meal planning feature combines our rule-based optimization algorithm with OpenAI's GPT-4o-mini model to create an advanced meal planning system that:

1. Analyzes your pantry items and their expiration dates
2. Calculates an initial score for each recipe based on:
   - How many pantry ingredients it uses
   - How soon those ingredients will expire
   - How many new ingredients you'd need to buy
3. Sends this data to the GPT-4o-mini API to enhance the planning with:
   - More sophisticated variety considerations
   - Better recipe combinations that minimize waste
   - Explanations for why each recipe was selected
4. Creates a complete meal plan customized to your preferences

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your mobile device or an emulator

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/zero-waste-pantry.git
   cd zero-waste-pantry
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Start the development server

   ```
   npm start
   ```

4. Open the app on your device using Expo Go by scanning the QR code in the terminal

## Advanced Features

### AI Food Recognition

The app includes an AI-powered food scanner that can identify food items from photos:

1. Take a photo of any food item
2. The AI analyzes the image and identifies the food
3. The food name and category are automatically filled in the add item form

This feature uses the OpenAI Vision API to accurately identify a wide range of food items.

### Real Barcode Scanning

The app includes a simulated barcode scanner for use with Expo Go. For real barcode scanning capabilities:

1. See the [Barcode Scanner Setup Guide](BARCODE_SETUP.md) for instructions on creating a development build with EAS.
2. Follow the implementation steps to connect to a product database API.

### OCR for Expiration Dates

The app includes a simulated OCR for reading expiration dates. For real OCR capabilities:

1. See the [OCR Setup Guide](OCR_SETUP.md) for instructions on integrating with Google Cloud Vision API.
2. Follow the implementation steps to extract and process expiration dates from product packaging.

## Project Structure

```
zero-waste-pantry/
├── app/                # Main application files
│   ├── (tabs)/         # Tab-based navigation
│   ├── _layout.tsx     # Root layout component
│   ├── add-item.tsx    # Add item screen
│   ├── auth.tsx        # Authentication screen
│   └── ...             # Other screens
├── components/         # Reusable components
│   ├── ExpoBarcodeScannerComponent.tsx  # Barcode scanner component
│   ├── OCRScanner.tsx  # OCR scanner component
│   ├── ProductScanner.tsx  # AI food scanner component
│   └── ...             # Other components
├── constants/          # App constants
├── utils/              # Utility functions
│   ├── openaiVision.ts  # OpenAI Vision API integration
│   ├── visionApi.ts     # Google Cloud Vision API integration
│   └── ...             # Other utilities
└── ...
```

## Database Schema

The app uses Supabase for data storage with the following tables:

### Pantry Items Table

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users table)
- `name`: String (product name)
- `category`: String (product category)
- `expiry_date`: Date (expiration date)
- `created_at`: Timestamp
- `barcode`: String (optional)
- `image_url`: String (optional)

### Users Table

- `id`: UUID (primary key)
- `email`: String
- `created_at`: Timestamp

## Authentication

The app includes a test login flow for development purposes. For production, implement a full authentication system with Supabase or another auth provider.

## Development with Expo

### Expo Go Limitations

Some features like barcode scanning and OCR have limited functionality in Expo Go:

- Barcode scanning is simulated in Expo Go with a button to simulate scanning
- OCR is simulated with predefined responses
- AI food scanning will fall back to simulated responses if API connection fails

### Creating a Development Build

To use full native capabilities such as camera access for real barcode scanning:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure your project
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/) for the development framework
- [Supabase](https://supabase.com/) for database and authentication
- [Open Food Facts](https://world.openfoodfacts.org/) for product database API
- [OpenAI](https://openai.com/) for AI-powered food identification
