import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import KanjiScreen from '../screens/KanjiScreen';
import HSKScreen from '../screens/HSKScreen';
import TOCFLScreen from '../screens/TOCFLScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#282c34',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Kanji Viet Mobile' }}
          />
          <Stack.Screen 
            name="Kanji" 
            component={KanjiScreen}
            options={{ title: 'Kanji Practice' }}
          />
          <Stack.Screen 
            name="HSK" 
            component={HSKScreen}
            options={{ title: 'HSK Vocabulary' }}
          />
          <Stack.Screen 
            name="TOCFL" 
            component={TOCFLScreen}
            options={{ title: 'TOCFL Vocabulary' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

