import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SettingsProvider } from './context/SettingsContext';
import MainNavigator from './navigation/MainNavigator';

export default function App() {
  return (
    <SettingsProvider>
      <View style={styles.container}>
        <MainNavigator />
      </View>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
