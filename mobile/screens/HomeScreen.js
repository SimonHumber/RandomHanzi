import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Kanji Viet Mobile</Text>
        <Text style={styles.subtitle}>Learn Chinese characters and vocabulary</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('HSK')}
        >
          <Text style={styles.menuButtonIcon}>中</Text>
          <Text style={styles.menuButtonText}>HSK Vocabulary</Text>
          <Text style={styles.menuButtonDescription}>
            Practice HSK Chinese vocabulary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('TOCFL')}
        >
          <Text style={styles.menuButtonIcon}>台</Text>
          <Text style={styles.menuButtonText}>TOCFL Vocabulary</Text>
          <Text style={styles.menuButtonDescription}>
            Practice TOCFL Chinese vocabulary
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Kanji')}
        >
          <Text style={styles.menuButtonIcon}>日</Text>
          <Text style={styles.menuButtonText}>Kanji Practice</Text>
          <Text style={styles.menuButtonDescription}>
            Practice Japanese kanji with Vietnamese readings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Sentences')}
        >
          <Text style={styles.menuButtonIcon}>句</Text>
          <Text style={styles.menuButtonText}>Sentence Practice</Text>
          <Text style={styles.menuButtonDescription}>
            Practice Chinese sentences with translations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('CharacterList')}
        >
          <Text style={styles.menuButtonIcon}>表</Text>
          <Text style={styles.menuButtonText}>Character List</Text>
          <Text style={styles.menuButtonDescription}>
            Browse all characters by type and level
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Tones')}
        >
          <Text style={styles.menuButtonIcon}>音</Text>
          <Text style={styles.menuButtonText}>Tone Guide</Text>
          <Text style={styles.menuButtonDescription}>
            Learn about tones in Mandarin, Cantonese, and Vietnamese
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuButtonIcon}>設定</Text>
          <Text style={styles.menuButtonText}>Settings</Text>
          <Text style={styles.menuButtonDescription}>
            Configure translation preferences
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Choose a practice mode to begin
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#282c34',
    padding: 40,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonIcon: {
    fontSize: 60,
    color: '#000',
    marginBottom: 15,
  },
  menuButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  menuButtonDescription: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  footer: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    padding: 20,
  },
});

