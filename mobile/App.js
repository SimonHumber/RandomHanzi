import React from 'react';
import { StyleSheet, View } from 'react-native';
import MainNavigator from './navigation/MainNavigator';

export default function App() {
  return (
    <View style={styles.container}>
      <MainNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
