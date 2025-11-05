import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import kanjiData from '../data/kanjiData.json';
import { useSettings } from '../context/SettingsContext';

const KANJI_DISABLED_STORAGE_KEY = '@kanji_viet_kanji_disabled';

export default function KanjiScreen() {
  const { settings } = useSettings();
  const [selectedGrades, setSelectedGrades] = useState([1]);
  const [currentKanji, setCurrentKanji] = useState(null);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [disabledKanji, setDisabledKanji] = useState(new Set());
  const [randomDisableCount, setRandomDisableCount] = useState('10');
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);

  const allKanji = [];
  for (let grade = 1; grade <= 6; grade++) {
    if (kanjiData[grade]) {
      allKanji.push(...kanjiData[grade]);
    }
  }

  // Load disabled kanji from AsyncStorage on mount
  useEffect(() => {
    const loadDisabledKanji = async () => {
      try {
        const saved = await AsyncStorage.getItem(KANJI_DISABLED_STORAGE_KEY);
        if (saved) {
          const savedArray = JSON.parse(saved);
          setDisabledKanji(new Set(savedArray));
        }
      } catch (error) {
        console.error('Error loading disabled kanji:', error);
      }
    };
    loadDisabledKanji();
  }, []);

  // Save disabled kanji to AsyncStorage whenever they change
  useEffect(() => {
    const saveDisabledKanji = async () => {
      try {
        const arrayToSave = Array.from(disabledKanji);
        await AsyncStorage.setItem(KANJI_DISABLED_STORAGE_KEY, JSON.stringify(arrayToSave));
      } catch (error) {
        console.error('Error saving disabled kanji:', error);
      }
    };
    saveDisabledKanji();
  }, [disabledKanji]);

  const generateRandomKanji = () => {
    const availableKanji = allKanji.filter(kanji => !disabledKanji.has(kanji.kanji));

    if (availableKanji.length === 0) {
      Alert.alert('No more kanji', 'Enable some kanji to continue.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableKanji.length);
    const selectedKanji = availableKanji[randomIndex];
    setCurrentKanji(selectedKanji);
    setShowVietnamese(false);
    setShowVietnameseTranslation(false);
    setShowEnglish(false);
  };

  const toggleGrade = (grade) => {
    const newGrades = [...selectedGrades];
    if (newGrades.includes(grade)) {
      newGrades.splice(newGrades.indexOf(grade), 1);
    } else {
      newGrades.push(grade);
    }
    setSelectedGrades(newGrades);
  };

  const toggleKanjiDisabled = (kanji) => {
    const newDisabled = new Set(disabledKanji);
    if (newDisabled.has(kanji)) {
      newDisabled.delete(kanji);
    } else {
      newDisabled.add(kanji);
    }
    setDisabledKanji(newDisabled);
  };

  const getAvailableKanjiCount = () => {
    return allKanji.filter(kanji => !disabledKanji.has(kanji.kanji)).length;
  };

  const disableAllKanji = () => {
    const allKanjiSet = new Set(allKanji.map(k => k.kanji));
    setDisabledKanji(allKanjiSet);
  };

  const enableAllKanji = () => {
    setDisabledKanji(new Set());
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setShowCopyIndicator(true);
    setTimeout(() => {
      setShowCopyIndicator(false);
    }, 2000);
  };

  const randomDisableKanji = () => {
    const availableKanji = allKanji.filter(kanji => !disabledKanji.has(kanji.kanji));

    if (availableKanji.length === 0) {
      Alert.alert('No kanji available', 'No kanji available to disable.');
      return;
    }

    const count = parseInt(randomDisableCount, 10);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Invalid input', 'Please enter a valid number.');
      return;
    }

    const numToDisable = Math.min(count, availableKanji.length);
    const shuffled = availableKanji.sort(() => 0.5 - Math.random());
    const toDisable = shuffled.slice(0, numToDisable).map(k => k.kanji);

    const newDisabled = new Set([...disabledKanji, ...toDisable]);
    setDisabledKanji(newDisabled);

    Alert.alert('Disabled!', `Disabled ${numToDisable} random kanji.`);
  };

  return (
    <View style={styles.wrapper}>
      {showCopyIndicator && (
        <View style={styles.copyIndicator}>
          <Text style={styles.copyIndicatorText}>Copied!</Text>
        </View>
      )}
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Kanji Grades:</Text>
            <View style={styles.buttonRow}>
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeButton,
                    selectedGrades.includes(grade) && styles.gradeButtonSelected
                  ]}
                  onPress={() => toggleGrade(grade)}
                >
                  <Text style={[
                    styles.gradeButtonText,
                    selectedGrades.includes(grade) && styles.gradeButtonTextSelected
                  ]}>
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.generateButton} onPress={generateRandomKanji}>
              <Text style={styles.generateButtonText}>Generate Random Kanji</Text>
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>Available: {getAvailableKanjiCount()}</Text>
              <Text style={styles.statsText}>Disabled: {disabledKanji.size}</Text>
            </View>
          </View>

          {currentKanji && (
            <View style={styles.card}>
              <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.kanji)}>
                <Text style={styles.character}>{currentKanji.kanji}</Text>
              </TouchableOpacity>
              <View style={styles.cardInfo}>
                {settings.showHanViet && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowVietnamese(!showVietnamese)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showVietnamese ? 'Hide' : 'Show'} Vietnamese Reading
                      </Text>
                    </TouchableOpacity>
                    {showVietnamese && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.vietnamese)}>
                        <Text style={styles.infoText}>{currentKanji.vietnamese}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showVietnameseTranslation && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowVietnameseTranslation(!showVietnameseTranslation)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showVietnameseTranslation ? 'Hide' : 'Show'} Vietnamese Translation
                      </Text>
                    </TouchableOpacity>
                    {showVietnameseTranslation && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.vietTranslation)}>
                        <Text style={styles.infoText}>{currentKanji.vietTranslation}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showEnglish && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowEnglish(!showEnglish)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showEnglish ? 'Hide' : 'Show'} English Translation
                      </Text>
                    </TouchableOpacity>
                    {showEnglish && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.english)}>
                        <Text style={styles.infoText}>{currentKanji.english}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <TouchableOpacity
                  style={[
                    styles.disableButton,
                    disabledKanji.has(currentKanji.kanji) && styles.enableButton
                  ]}
                  onPress={() => toggleKanjiDisabled(currentKanji.kanji)}
                >
                  <Text style={styles.disableButtonText}>
                    {disabledKanji.has(currentKanji.kanji) ? 'Enable' : 'Disable'} This Kanji
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            {false && (
              <View style={styles.randomDisableContainer}>
                <TextInput
                  style={styles.randomDisableInput}
                  value={randomDisableCount}
                  onChangeText={setRandomDisableCount}
                  keyboardType="numeric"
                  placeholder="10"
                />
                <TouchableOpacity
                  style={[styles.bulkButton, styles.randomDisableButton]}
                  onPress={randomDisableKanji}
                  disabled={getAvailableKanjiCount() === 0}
                >
                  <Text style={styles.bulkButtonText}>Random Disable</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.bulkButton, styles.enableAllButton]}
              onPress={enableAllKanji}
              disabled={disabledKanji.size === 0}
            >
              <Text style={styles.bulkButtonText}>Enable All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.disableAllButton]}
              onPress={disableAllKanji}
              disabled={getAvailableKanjiCount() === 0}
            >
              <Text style={styles.bulkButtonText}>Disable All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollView: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { padding: 15 },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap' },
  gradeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
    marginBottom: 10,
    marginRight: 10,
  },
  gradeButtonSelected: { backgroundColor: '#61dafb' },
  gradeButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  gradeButtonTextSelected: { color: '#fff' },
  generateButton: { backgroundColor: '#61dafb', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  generateButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statsText: { fontSize: 14, color: '#666' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  character: { fontSize: 72, textAlign: 'center', marginBottom: 20, fontWeight: 'bold', color: '#333' },
  cardInfo: {},
  revealButton: { backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  revealButtonText: { color: '#333', fontSize: 14, fontWeight: '600' },
  infoText: { fontSize: 18, textAlign: 'center', color: '#000', fontWeight: '600', marginBottom: 15 },
  disableButton: { backgroundColor: '#ff6b6b', padding: 12, borderRadius: 8, alignItems: 'center' },
  enableButton: { backgroundColor: '#51cf66' },
  disableButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  bulkButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  enableAllButton: { backgroundColor: '#51cf66' },
  disableAllButton: { backgroundColor: '#ff6b6b' },
  randomDisableButton: { backgroundColor: '#ffa94d' },
  bulkButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  randomDisableContainer: { flexDirection: 'row', marginBottom: 10 },
  randomDisableInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    fontSize: 14,
    backgroundColor: 'white'
  },
  copyIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#282c34',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  copyIndicatorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

