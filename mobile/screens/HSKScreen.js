import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import hskData from '../data/hsk_level1.json';

export default function HSKScreen() {
  const [selectedLevels, setSelectedLevels] = useState([1]);
  const [currentWord, setCurrentWord] = useState(null);
  const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showTraditional, setShowTraditional] = useState(false);
  const [showJyutping, setShowJyutping] = useState(false);
  const [showHanViet, setShowHanViet] = useState(false);
  const [disabledWords, setDisabledWords] = useState(new Set());
  const [characterFilter, setCharacterFilter] = useState('all');

  const generateRandomWord = () => {
    let filteredWords = hskData.filter(word =>
      selectedLevels.includes(1) && !disabledWords.has(word.id)
    );

    if (characterFilter === 'single') {
      filteredWords = filteredWords.filter(word => word.characterCount === 1);
    } else if (characterFilter === 'multi') {
      filteredWords = filteredWords.filter(word => word.characterCount > 1);
    }

    if (filteredWords.length === 0) {
      Alert.alert('No more words', 'Enable some words or change the character filter to continue.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    const selectedWord = filteredWords[randomIndex];
    setCurrentWord(selectedWord);
    setShowVietnameseTranslation(false);
    setShowEnglish(false);
    setShowTraditional(false);
    setShowJyutping(false);
    setShowHanViet(false);
  };

  const toggleLevel = (level) => {
    const newLevels = [...selectedLevels];
    if (newLevels.includes(level)) {
      newLevels.splice(newLevels.indexOf(level), 1);
    } else {
      newLevels.push(level);
    }
    setSelectedLevels(newLevels);
  };

  const toggleWordDisabled = (wordId) => {
    const newDisabled = new Set(disabledWords);
    if (newDisabled.has(wordId)) {
      newDisabled.delete(wordId);
    } else {
      newDisabled.add(wordId);
    }
    setDisabledWords(newDisabled);
  };

  const getAvailableWordsCount = () => {
    let filteredWords = hskData.filter(word =>
      selectedLevels.includes(1) && !disabledWords.has(word.id)
    );

    if (characterFilter === 'single') {
      filteredWords = filteredWords.filter(word => word.characterCount === 1);
    } else if (characterFilter === 'multi') {
      filteredWords = filteredWords.filter(word => word.characterCount > 1);
    }

    return filteredWords.length;
  };

  const disableAllWords = () => {
    const allWordIds = new Set(hskData.map(word => word.id));
    setDisabledWords(allWordIds);
  };

  const enableAllWords = () => {
    setDisabledWords(new Set());
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select HSK Levels:</Text>
          <View style={styles.buttonRow}>
            {[1, 2, 3, 4, 5, 6].map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.levelButton, selectedLevels.includes(level) && styles.levelButtonSelected, level > 1 && styles.levelButtonDisabled]}
                onPress={() => toggleLevel(level)}
                disabled={level > 1}
              >
                <Text style={[styles.levelButtonText, selectedLevels.includes(level) && styles.levelButtonTextSelected]}>
                  Level {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Character Filter:</Text>
          <View style={styles.buttonRow}>
            {['all', 'single', 'multi'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterButton, characterFilter === filter && styles.filterButtonSelected]}
                onPress={() => setCharacterFilter(filter)}
              >
                <Text style={[styles.filterButtonText, characterFilter === filter && styles.filterButtonTextSelected]}>
                  {filter === 'all' ? 'All' : filter === 'single' ? 'Single' : 'Multi'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.generateButton} onPress={generateRandomWord}>
            <Text style={styles.generateButtonText}>Generate Random Word</Text>
          </TouchableOpacity>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Available: {getAvailableWordsCount()}</Text>
            <Text style={styles.statsText}>Disabled: {disabledWords.size}</Text>
          </View>
        </View>

        {currentWord && (
          <View style={styles.card}>
            <Text style={styles.character}>{currentWord.traditionalChinese}</Text>
            <View style={styles.cardInfo}>
              <TouchableOpacity style={styles.revealButton} onPress={() => setShowTraditional(!showTraditional)}>
                <Text style={styles.revealButtonText}>{showTraditional ? 'Hide' : 'Show'} Simplified</Text>
              </TouchableOpacity>
              {showTraditional && <Text style={styles.infoText}>{currentWord.simplifiedChinese}</Text>}

              <TouchableOpacity style={styles.revealButton} onPress={() => setShowJyutping(!showJyutping)}>
                <Text style={styles.revealButtonText}>{showJyutping ? 'Hide' : 'Show'} Jyutping</Text>
              </TouchableOpacity>
              {showJyutping && <Text style={styles.infoText}>{currentWord.jyutping}</Text>}

              <TouchableOpacity style={styles.revealButton} onPress={() => setShowVietnameseTranslation(!showVietnameseTranslation)}>
                <Text style={styles.revealButtonText}>{showVietnameseTranslation ? 'Hide' : 'Show'} Vietnamese Translation</Text>
              </TouchableOpacity>
              {showVietnameseTranslation && <Text style={styles.infoText}>{currentWord.vietnamese}</Text>}

              <TouchableOpacity style={styles.revealButton} onPress={() => setShowEnglish(!showEnglish)}>
                <Text style={styles.revealButtonText}>{showEnglish ? 'Hide' : 'Show'} English Translation</Text>
              </TouchableOpacity>
              {showEnglish && <Text style={styles.infoText}>{currentWord.english}</Text>}

              <TouchableOpacity style={styles.revealButton} onPress={() => setShowHanViet(!showHanViet)}>
                <Text style={styles.revealButtonText}>{showHanViet ? 'Hide' : 'Show'} Han Viet Reading</Text>
              </TouchableOpacity>
              {showHanViet && <Text style={styles.infoText}>{currentWord.hanviet}</Text>}

              <TouchableOpacity
                style={[styles.disableButton, disabledWords.has(currentWord.id) && styles.enableButton]}
                onPress={() => toggleWordDisabled(currentWord.id)}
              >
                <Text style={styles.disableButtonText}>
                  {disabledWords.has(currentWord.id) ? 'Enable' : 'Disable'} This Word
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity style={[styles.bulkButton, styles.enableAllButton]} onPress={enableAllWords} disabled={disabledWords.size === 0}>
            <Text style={styles.bulkButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkButton, styles.disableAllButton]} onPress={disableAllWords} disabled={getAvailableWordsCount() === 0}>
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
  levelButton: { padding: 10, borderRadius: 8, backgroundColor: '#e0e0e0', minWidth: 80, alignItems: 'center', marginBottom: 10, marginRight: 10 },
  levelButtonSelected: { backgroundColor: '#61dafb' },
  levelButtonDisabled: { opacity: 0.5 },
  levelButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  levelButtonTextSelected: { color: '#fff' },
  filterButton: { padding: 10, borderRadius: 8, backgroundColor: '#e0e0e0', minWidth: 80, alignItems: 'center', marginBottom: 10, marginRight: 10 },
  filterButtonSelected: { backgroundColor: '#61dafb' },
  filterButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  filterButtonTextSelected: { color: '#fff' },
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

