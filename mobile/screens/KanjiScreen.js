import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import kanjiGrade1Data from '../data/kanji_grade1.json';
import kanjiGrade2Data from '../data/kanji_grade2.json';
import { useSettings } from '../context/SettingsContext';

const KANJI_DISABLED_STORAGE_KEY = '@kanji_viet_kanji_disabled';

export default function KanjiScreen() {
  const { settings } = useSettings();
  const [selectedGrades, setSelectedGrades] = useState([1]);
  const [currentKanji, setCurrentKanji] = useState(null);
  const [showOnyomi, setShowOnyomi] = useState(false);
  const [showKunyomi, setShowKunyomi] = useState(false);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [disabledKanji, setDisabledKanji] = useState(new Set());
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);

  // Combine all kanji data (grade 1 and 2)
  const allKanji = useMemo(() => {
    const combined = [];
    // Add grade 1 kanji with level property
    if (kanjiGrade1Data) {
      kanjiGrade1Data.forEach(kanji => {
        combined.push({ ...kanji, level: 1 });
      });
    }
    // Add grade 2 kanji with level property
    if (kanjiGrade2Data) {
      kanjiGrade2Data.forEach(kanji => {
        combined.push({ ...kanji, level: 2 });
      });
    }
    return combined;
  }, []);

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
    if (allKanji.length === 0) {
      return;
    }

    let availableKanji = allKanji.filter(kanji =>
      selectedGrades.includes(kanji.level) && !disabledKanji.has(kanji.kanji)
    );

    if (availableKanji.length === 0) {
      Alert.alert('No more kanji', 'Enable some kanji to continue.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableKanji.length);
    const selectedKanji = availableKanji[randomIndex];
    setCurrentKanji(selectedKanji);
    setShowOnyomi(false);
    setShowKunyomi(false);
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
    return allKanji.filter(kanji =>
      selectedGrades.includes(kanji.level) && !disabledKanji.has(kanji.kanji)
    ).length;
  };

  const disableAllKanji = () => {
    const filteredKanji = allKanji.filter(kanji => selectedGrades.includes(kanji.level));
    const allKanjiSet = new Set(filteredKanji.map(k => k.kanji));
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
                {settings.showOnyomi && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowOnyomi(!showOnyomi)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showOnyomi ? 'Hide' : 'Show'} On'yomi
                      </Text>
                    </TouchableOpacity>
                    {showOnyomi && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.onyomi || '')}>
                        <Text style={styles.infoText}>{currentKanji.onyomi || ''}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showKunyomi && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowKunyomi(!showKunyomi)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showKunyomi ? 'Hide' : 'Show'} Kun'yomi
                      </Text>
                    </TouchableOpacity>
                    {showKunyomi && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.kunyomi || '')}>
                        <Text style={styles.infoText}>{currentKanji.kunyomi || ''}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showKanjiHanViet && (
                  <>
                    <TouchableOpacity
                      style={styles.revealButton}
                      onPress={() => setShowVietnamese(!showVietnamese)}
                    >
                      <Text style={styles.revealButtonText}>
                        {showVietnamese ? 'Hide' : 'Show'} Han Viet
                      </Text>
                    </TouchableOpacity>
                    {showVietnamese && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.hanviet || '')}>
                        <Text style={styles.infoText}>{currentKanji.hanviet || ''}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showKanjiVietnameseTranslation && (
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
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentKanji.viet || '')}>
                        <Text style={styles.infoText}>{currentKanji.viet || ''}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showKanjiEnglish && (
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
  bulkButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
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

