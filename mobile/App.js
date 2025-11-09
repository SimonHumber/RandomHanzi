import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SettingsProvider } from './context/SettingsContext';
import { PracticeProvider } from './context/PracticeContext';
import MainNavigator from './navigation/MainNavigator';

export default function App() {
  return (
    <SettingsProvider>
      <PracticeProvider>
        <View style={styles.container}>
          <MainNavigator />
        </View>
      </PracticeProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
