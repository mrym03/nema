# Zero Waste Pantry App

A mobile application to help reduce food waste by tracking expiration dates of pantry items and providing notifications before items expire.

## Features

- Track pantry items with expiration dates
- Receive notifications before items expire
- Scan barcodes to quickly add products
- Scan expiration dates using OCR (Optical Character Recognition)
- Identify foods with AI image recognition
- View items by categories and expiration status

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