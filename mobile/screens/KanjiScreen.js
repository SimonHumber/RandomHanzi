import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import kanjiData from '../data/kanjiData.json';

export default function KanjiScreen() {
  const [selectedGrades, setSelectedGrades] = useState([1]);
  const [currentKanji, setCurrentKanji] = useState(null);
  const [showVietnamese, setShowVietnamese] = useState(false);
  const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [disabledKanji, setDisabledKanji] = useState(new Set());

  const allKanji = [];
  for (let grade = 1; grade <= 6; grade++) {
    if (kanjiData[grade]) {
      allKanji.push(...kanjiData[grade]);
    }
  }

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

  return (
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
            <Text style={styles.character}>{currentKanji.kanji}</Text>
            <View style={styles.cardInfo}>
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => setShowVietnamese(!showVietnamese)}
              >
                <Text style={styles.revealButtonText}>
                  {showVietnamese ? 'Hide' : 'Show'} Vietnamese Reading
                </Text>
              </TouchableOpacity>
              {showVietnamese && (
                <Text style={styles.infoText}>{currentKanji.vietnamese}</Text>
              )}

              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => setShowVietnameseTranslation(!showVietnameseTranslation)}
              >
                <Text style={styles.revealButtonText}>
                  {showVietnameseTranslation ? 'Hide' : 'Show'} Vietnamese Translation
                </Text>
              </TouchableOpacity>
              {showVietnameseTranslation && (
                <Text style={styles.infoText}>{currentKanji.vietTranslation}</Text>
              )}

              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => setShowEnglish(!showEnglish)}
              >
                <Text style={styles.revealButtonText}>
                  {showEnglish ? 'Hide' : 'Show'} English Translation
                </Text>
              </TouchableOpacity>
              {showEnglish && (
                <Text style={styles.infoText}>{currentKanji.english}</Text>
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
  );
}

const styles = StyleSheet.create({
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
});

