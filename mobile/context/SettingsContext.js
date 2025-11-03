import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const SettingsContext = createContext();

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    mainDisplayMode: 'traditional', // 'traditional' or 'simplified'
    showSimplified: true,
    showPinyin: true,
    showJyutping: true,
    showHanViet: true,
    showVietnameseTranslation: true,
    showEnglish: true,
  });

  // TODO: Load settings from AsyncStorage when implemented
  useEffect(() => {
    // Load saved settings here
  }, []);

  // TODO: Save settings to AsyncStorage when implemented
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Save to AsyncStorage here
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

