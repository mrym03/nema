# EAS Build Instructions for iOS 18.3.2

This document provides step-by-step instructions for creating a development build of the Zero Waste Pantry app for your iOS device.

## Prerequisites

1. An Apple Developer account (can be a free account for development builds)
2. An iOS device running iOS 18.3.2
3. Expo account

## Fix npm Permissions (if needed)

Before starting, fix the npm permissions issue by running:

```bash
sudo chown -R $(whoami) "/Users/$(whoami)/.npm"
```

## Install EAS CLI

```bash
npm install -g eas-cli
```

## Login to Expo

```bash
npx eas-cli login
```

Follow the prompts to log in to your Expo account.

## Configure Your Project for EAS Build

We've already created the necessary configuration files:
- `eas.json`: EAS build profiles configuration
- Updated `app.json`: App configuration with iOS bundle identifier

However, you need to add your Expo project ID to `app.json`. Get it by running:

```bash
npx eas-cli project:info
```

If you don't have a project yet:

```bash
npx eas-cli project:create
```

Then update the `projectId` in the `app.json` file under `expo.extra.eas.projectId`.

## Credential Management

For iOS builds, you need to handle credentials. EAS can manage this for you:

```bash
npx eas-cli credentials:sync
```

This will guide you through:
1. Registering your app with Apple
2. Creating a provisioning profile
3. Setting up certificates

For a development build, select options for development and ad-hoc distribution.

## Start the Build

Now you can start the iOS development build:

```bash
npx eas-cli build --platform ios --profile development
```

The build process:
1. Uploads your project to EAS Build servers
2. Builds your application (15-20 minutes)
3. Provides installation options when complete

## Install on Your Device

EAS offers several ways to install your development build:

1. **EAS Update** (recommended): Opens a QR code you can scan with your iOS Camera
2. **Install via Apple Developer App**: EAS provides instructions
3. **TestFlight**: If you choose internal distribution, you can use TestFlight

For iOS 18.3.2, you'll likely need to use method 1 or 2.

## Using the Development Build

Once installed, your app will:
1. Have full camera access for barcode scanning
2. Connect to the Open Food Facts API for product lookups
3. Use Google Cloud Vision API for OCR (if configured)

## Troubleshooting

If you encounter issues:

1. **Build Failures**: Check logs in the EAS dashboard
2. **iOS Installation Issues**: Make sure your Apple ID is added to the provisioning profile
3. **Camera Access**: If camera doesn't work, check your app's permission settings

## Update Your API Keys

Before using the app fully, update these in your code:
1. In `utils/visionApi.ts`: Replace `YOUR_GOOGLE_CLOUD_VISION_API_KEY`

## Further Help

For additional assistance with EAS:
- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/ 

npm install -g localtunnel
lt --port 8081  # Note the URL 