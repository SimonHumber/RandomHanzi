import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@kanji_viet_settings';

// Create the context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Chinese settings
    mainDisplayMode: 'traditional', // 'traditional' or 'simplified'
    showSimplified: true,
    showPinyin: true,
    showJyutping: true,
    showHanViet: true,
    showVietnameseTranslation: true,
    showEnglish: true,
    // Japanese settings
    showOnyomi: true,
    showKunyomi: true,
    showKanjiHanViet: true, // Han Viet for Japanese kanji
    showKanjiVietnameseTranslation: true, // Vietnamese translation for Japanese kanji
    showKanjiEnglish: true, // English for Japanese kanji
  });

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) {
          const savedSettings = JSON.parse(saved);
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };
    saveSettings();
  }, [settings]);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

