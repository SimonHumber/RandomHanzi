# Kanji Viet Learning Platform

A comprehensive learning platform for Chinese characters, HSK, and TOCFL vocabulary with Vietnamese translations.

This project includes both a **web application** and a **mobile app** for practicing Chinese vocabulary.

## Project Structure

```
kanjiViet/
├── web/                  # Web application
│   ├── src/              # Web application source code
│   │   ├── App.js        # Main web app
│   │   ├── HSKPage.js    # HSK vocabulary page
│   │   ├── TOCFLPage.js  # TOCFL vocabulary page
│   │   ├── kanjiData.json # Kanji vocabulary data
│   │   ├── hsk_level1.json # HSK level 1 data
│   │   └── tocfl_level1.json # TOCFL level 1 data
│   ├── public/           # Web app public assets
│   └── package.json      # Web app dependencies
├── mobile/              # Mobile application
│   ├── screens/         # Mobile app screens
│   ├── navigation/      # Navigation setup
│   ├── data/            # JSON data files
│   ├── App.js           # Mobile app entry point
│   └── package.json     # Mobile app dependencies
└── *.py                 # Data processing scripts
```

## Features

### Web Application
- 🌐 React-based web interface
- 📚 Multiple practice modes (Kanji, HSK, TOCFL)
- 🎯 Level selection and filtering
- 🎨 Modern, responsive UI

### Mobile Application
- 📱 Cross-platform (iOS & Android)
- 🚀 Built with React Native and Expo
- 📲 Live reloading and hot updates
- 🎯 Same features as web app, optimized for mobile

## Getting Started

### Web Application

1. **Navigate to Web Directory**
```bash
cd web
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Development Server**
```bash
npm start
```

4. **Open Browser**
Navigate to `http://localhost:3000`

### Mobile Application

1. **Navigate to Mobile Directory**
```bash
cd mobile
```

2. **Install Dependencies**
```bash
npm install
```

3. **Start Expo Development Server**
```bash
npm start
```

4. **Run on Device**
- Install **Expo Go** from app store
- Scan QR code with your phone
- Or use `npm run ios` / `npm run android`

## Practice Modes

### 1. Kanji Practice
Practice Japanese kanji with:
- Vietnamese readings
- Vietnamese translations
- English meanings
- Grade-based selection (1-6)

### 2. HSK Vocabulary
Study HSK (Hanyu Shuiping Kaoshi) vocabulary:
- Simplified & Traditional Chinese
- Jyutping pronunciation
- Vietnamese translations
- English meanings
- Han Viet readings
- Character filters

### 3. TOCFL Vocabulary
Practice TOCFL (Test of Chinese as a Foreign Language):
- Same features as HSK
- Taiwanese Mandarin focus

## Technologies Used

### Web Application
- React 18.2
- React Scripts
- CSS3

### Mobile Application
- React Native 0.81
- Expo 54
- React Navigation 7
- React Native Safe Area Context

## Data Files

All practice data is stored in JSON format:
- `web/src/kanjiData.json` - Kanji vocabulary organized by grade
- `web/src/hsk_level1.json` - HSK Level 1 vocabulary
- `web/src/tocfl_level1.json` - TOCFL Level 1 vocabulary

Note: Mobile app has its own copies in `mobile/data/` directory.

## Contributing

This is a personal learning project. Feel free to fork and customize for your own use!

## License

Personal project - for educational use.

## Contact

For questions or suggestions, please open an issue on the repository.

---

**Happy Learning! 📚🇨🇳🇻🇳**

