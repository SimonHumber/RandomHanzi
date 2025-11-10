# Random Hanzi

A React Native mobile app for practicing Chinese characters (Kanji), HSK, and TOCFL vocabulary with Vietnamese translations.

## Features

- **Kanji Practice**: Practice Japanese kanji with Vietnamese readings and translations
- **HSK Vocabulary**: Study HSK (Hanyu Shuiping Kaoshi) vocabulary
- **TOCFL Vocabulary**: Practice TOCFL (Test of Chinese as a Foreign Language) vocabulary

## Quick Start

### Development Mode (Requires Server Running)

```bash
npm start
```

Then:
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Scan the QR code with Expo Go
3. App will load on your phone

**Note**: App only works when development server is running.

### Building Standalone App (Works Offline)

To create an app that works on your phone without the server:

#### Option 1: Using EAS Build (Recommended)

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo (if not already logged in)
eas login

# Create EAS project (first time only)
eas init

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

**Requirements**:
- Free Expo account (sign up at expo.dev)
- For iOS: Apple Developer account ($99/year)
- For Android: Free to build

After build completes, download and install on your device.

#### Option 2: Local Build with Xcode (iOS only)

```bash
# Install pods (first time only)
cd ios && pod install && cd ..

# Build with Xcode
npx expo run:ios

# Or open in Xcode
open ios/KanjiViet.xcworkspace
```

**Requirements**:
- macOS with Xcode installed
- Apple Developer account
- iPhone connected via USB

## Project Structure

```
mobile/
├── App.js                 # Main app entry
├── navigation/            # React Navigation setup
│   └── MainNavigator.js
├── screens/              # App screens
│   ├── HomeScreen.js    # Home menu
│   ├── KanjiScreen.js   # Kanji practice
│   ├── HSKScreen.js     # HSK vocabulary
│   └── TOCFLScreen.js   # TOCFL vocabulary
├── data/                # Vocabulary JSON files
├── package.json         # Dependencies
├── app.json            # Expo config
└── eas.json           # EAS build config
```

## Technologies

- React Native 0.81.5
- Expo SDK 54
- React Navigation 6
- React 19.1.0

## Data Files

All vocabulary data is stored in JSON format:
- `data/kanjiData.json` - Kanji vocabulary organized by grade
- `data/hsk_level1.json` - HSK Level 1 vocabulary
- `data/tocfl_level1.json` - TOCFL Level 1 vocabulary

## Development

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

## Troubleshooting

### "Expected boolean but had string" error
- This was a React 19 compatibility issue that's been fixed with proper dependency versions.

### App won't scroll
- Fixed by using ScrollView instead of View for screen layouts.

### Can't install on phone without server
- You need to build a standalone app using EAS Build (see above).

## License

Personal project for educational use.

