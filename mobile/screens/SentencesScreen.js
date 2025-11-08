import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import sentencesData from '../data/sentances.json';
import { useSettings } from '../context/SettingsContext';

const SENTENCES_DISABLED_STORAGE_KEY = '@kanji_viet_sentences_disabled';

export default function SentencesScreen() {
  const { settings } = useSettings();
  const [currentSentence, setCurrentSentence] = useState(null);
  const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showTraditional, setShowTraditional] = useState(false);
  const [showJyutping, setShowJyutping] = useState(false);
  const [showHanViet, setShowHanViet] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [disabledSentences, setDisabledSentences] = useState(new Set());
  const [showCopyIndicator, setShowCopyIndicator] = useState(false);

  // Load disabled sentences from AsyncStorage on mount
  useEffect(() => {
    const loadDisabledSentences = async () => {
      try {
        const saved = await AsyncStorage.getItem(SENTENCES_DISABLED_STORAGE_KEY);
        if (saved) {
          const savedArray = JSON.parse(saved);
          setDisabledSentences(new Set(savedArray));
        }
      } catch (error) {
        console.error('Error loading disabled sentences:', error);
      }
    };
    loadDisabledSentences();
  }, []);

  // Save disabled sentences to AsyncStorage whenever they change
  useEffect(() => {
    const saveDisabledSentences = async () => {
      try {
        const arrayToSave = Array.from(disabledSentences);
        await AsyncStorage.setItem(SENTENCES_DISABLED_STORAGE_KEY, JSON.stringify(arrayToSave));
      } catch (error) {
        console.error('Error saving disabled sentences:', error);
      }
    };
    saveDisabledSentences();
  }, [disabledSentences]);

  const generateRandomSentence = () => {
    const availableSentences = sentencesData.filter(
      (sentence, index) => !disabledSentences.has(`sentence-${index}`)
    );

    if (availableSentences.length === 0) {
      Alert.alert('No more sentences', 'Enable some sentences to continue.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableSentences.length);
    const selectedSentence = availableSentences[randomIndex];
    setCurrentSentence(selectedSentence);
    setShowVietnameseTranslation(false);
    setShowEnglish(false);
    setShowTraditional(false);
    setShowJyutping(false);
    setShowHanViet(false);
    setShowPinyin(false);
  };

  const toggleSentenceDisabled = (sentenceIndex) => {
    const newDisabled = new Set(disabledSentences);
    const key = `sentence-${sentenceIndex}`;
    if (newDisabled.has(key)) {
      newDisabled.delete(key);
    } else {
      newDisabled.add(key);
    }
    setDisabledSentences(newDisabled);
  };

  const getAvailableSentencesCount = () => {
    return sentencesData.filter(
      (sentence, index) => !disabledSentences.has(`sentence-${index}`)
    ).length;
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setShowCopyIndicator(true);
    setTimeout(() => {
      setShowCopyIndicator(false);
    }, 2000);
  };

  const getSentenceIndex = () => {
    if (!currentSentence) return -1;
    return sentencesData.findIndex(
      s => s.simplified === currentSentence.simplified && 
           s.traditional === currentSentence.traditional
    );
  };

  return (
    <View style={styles.wrapper}>
      {showCopyIndicator && (
        <View style={styles.copyIndicator}>
          <Text style={styles.copyIndicatorText}>Copied!</Text>
        </View>
      )}
      <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={3.0}
          minimumZoomScale={1.0}
          pinchZoomEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          <View style={styles.section}>
            <TouchableOpacity style={styles.generateButton} onPress={generateRandomSentence}>
              <Text style={styles.generateButtonText}>Generate Random Sentence</Text>
            </TouchableOpacity>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>Available: {getAvailableSentencesCount()}</Text>
              <Text style={styles.statsText}>Disabled: {disabledSentences.size}</Text>
            </View>
          </View>

          {currentSentence && (
            <View style={styles.card}>
              <TouchableOpacity
                onLongPress={() => copyToClipboard(
                  settings.mainDisplayMode === 'simplified'
                    ? currentSentence.simplified
                    : currentSentence.traditional
                )}
              >
                <Text style={styles.sentence}>
                  {settings.mainDisplayMode === 'simplified'
                    ? currentSentence.simplified
                    : currentSentence.traditional}
                </Text>
              </TouchableOpacity>
              <View style={styles.cardInfo}>
                {settings.showSimplified && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowTraditional(!showTraditional)}>
                      <Text style={styles.revealButtonText}>
                        {showTraditional ? 'Hide' : 'Show'} {settings.mainDisplayMode === 'simplified' ? 'Traditional' : 'Simplified'}
                      </Text>
                    </TouchableOpacity>
                    {showTraditional && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(
                        settings.mainDisplayMode === 'simplified'
                          ? currentSentence.traditional
                          : currentSentence.simplified
                      )}>
                        <Text style={styles.infoText}>
                          {settings.mainDisplayMode === 'simplified'
                            ? currentSentence.traditional
                            : currentSentence.simplified}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showPinyin && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowPinyin(!showPinyin)}>
                      <Text style={styles.revealButtonText}>{showPinyin ? 'Hide' : 'Show'} Pinyin</Text>
                    </TouchableOpacity>
                    {showPinyin && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentSentence.pinyin)}>
                        <Text style={styles.infoText}>{currentSentence.pinyin}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showJyutping && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowJyutping(!showJyutping)}>
                      <Text style={styles.revealButtonText}>{showJyutping ? 'Hide' : 'Show'} Jyutping</Text>
                    </TouchableOpacity>
                    {showJyutping && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentSentence.jyutping)}>
                        <Text style={styles.infoText}>{currentSentence.jyutping}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showHanViet && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowHanViet(!showHanViet)}>
                      <Text style={styles.revealButtonText}>{showHanViet ? 'Hide' : 'Show'} Han Viet Reading</Text>
                    </TouchableOpacity>
                    {showHanViet && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentSentence.hanviet)}>
                        <Text style={styles.infoText}>{currentSentence.hanviet}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showVietnameseTranslation && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowVietnameseTranslation(!showVietnameseTranslation)}>
                      <Text style={styles.revealButtonText}>{showVietnameseTranslation ? 'Hide' : 'Show'} Vietnamese Translation</Text>
                    </TouchableOpacity>
                    {showVietnameseTranslation && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentSentence.viet)}>
                        <Text style={styles.infoText}>{currentSentence.viet}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {settings.showEnglish && (
                  <>
                    <TouchableOpacity style={styles.revealButton} onPress={() => setShowEnglish(!showEnglish)}>
                      <Text style={styles.revealButtonText}>{showEnglish ? 'Hide' : 'Show'} English Translation</Text>
                    </TouchableOpacity>
                    {showEnglish && (
                      <TouchableOpacity onLongPress={() => copyToClipboard(currentSentence.english)}>
                        <Text style={styles.infoText}>{currentSentence.english}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.disableButton,
                      disabledSentences.has(`sentence-${getSentenceIndex()}`) && styles.disableButtonDisabled
                    ]}
                    onPress={() => toggleSentenceDisabled(getSentenceIndex())}
                  >
                    <Text style={styles.disableButtonText}>
                      {disabledSentences.has(`sentence-${getSentenceIndex()}`) ? 'Enable' : 'Disable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#282c34',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sentence: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
    lineHeight: 40,
  },
  cardInfo: {
    marginTop: 10,
  },
  revealButton: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  revealButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
    lineHeight: 26,
  },
  cardActions: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  disableButton: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disableButtonDisabled: {
    backgroundColor: '#51cf66',
  },
  disableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyIndicator: {
    position: 'absolute',
    top: 100,
    left: '50%',
    marginLeft: -50,
    backgroundColor: '#282c34',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
    width: 100,
    alignItems: 'center',
  },
  copyIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

