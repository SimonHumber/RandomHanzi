import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hskLevel1Data from '../data/hsk_level1.json';
import hskLevel2Data from '../data/hsk_level2.json';
import tocflData from '../data/tocfl_level1.json';
import kanjiGrade1Data from '../data/kanji_grade1.json';
import kanjiGrade2Data from '../data/kanji_grade2.json';
import sentencesData from '../data/sentances.json';
import { useSettings } from '../context/SettingsContext';

const HSK_DISABLED_STORAGE_KEY = '@kanji_viet_hsk_disabled';
const TOCFL_DISABLED_STORAGE_KEY = '@kanji_viet_tocfl_disabled';
const KANJI_DISABLED_STORAGE_KEY = '@kanji_viet_kanji_disabled';
const SENTENCES_DISABLED_STORAGE_KEY = '@kanji_viet_sentences_disabled';

export default function CharacterListScreen() {
    const { settings } = useSettings();
    const [selectedType, setSelectedType] = useState('hsk'); // 'hsk', 'tocfl', 'kanji', 'sentences'
    const [selectedLevels, setSelectedLevels] = useState([1]);
    const [searchQuery, setSearchQuery] = useState('');
    const [characterFilter, setCharacterFilter] = useState('all'); // 'all', 'single', 'multi'
    const [showFilters, setShowFilters] = useState(false); // Toggle for showing/hiding filters
    const [disabledHSK, setDisabledHSK] = useState(new Set());
    const [disabledTOCFL, setDisabledTOCFL] = useState(new Set());
    const [disabledKanji, setDisabledKanji] = useState(new Set());
    const [disabledSentences, setDisabledSentences] = useState(new Set());

    // Combine HSK level 1 and 2 data
    const hskData = useMemo(() => {
        const level1 = (hskLevel1Data || []).map(word => ({ ...word, level: 1 }));
        const level2 = (hskLevel2Data || []).map(word => ({ ...word, level: 2 }));
        return [...level1, ...level2];
    }, []);

    // Flatten Kanji data by grade (grade 1 and 2)
    const allKanji = useMemo(() => {
        const flattened = [];
        // Add grade 1 kanji with level property
        if (kanjiGrade1Data) {
            kanjiGrade1Data.forEach(kanji => {
                flattened.push({ ...kanji, level: 1 });
            });
        }
        // Add grade 2 kanji with level property
        if (kanjiGrade2Data) {
            kanjiGrade2Data.forEach(kanji => {
                flattened.push({ ...kanji, level: 2 });
            });
        }
        return flattened;
    }, []);

    // Load disabled items from AsyncStorage on mount
    useEffect(() => {
        const loadDisabledItems = async () => {
            try {
                const hskSaved = await AsyncStorage.getItem(HSK_DISABLED_STORAGE_KEY);
                if (hskSaved) {
                    const hskArray = JSON.parse(hskSaved);
                    setDisabledHSK(new Set(hskArray));
                }

                const tocflSaved = await AsyncStorage.getItem(TOCFL_DISABLED_STORAGE_KEY);
                if (tocflSaved) {
                    const tocflArray = JSON.parse(tocflSaved);
                    setDisabledTOCFL(new Set(tocflArray));
                }

                const kanjiSaved = await AsyncStorage.getItem(KANJI_DISABLED_STORAGE_KEY);
                if (kanjiSaved) {
                    const kanjiArray = JSON.parse(kanjiSaved);
                    setDisabledKanji(new Set(kanjiArray));
                }

                const sentencesSaved = await AsyncStorage.getItem(SENTENCES_DISABLED_STORAGE_KEY);
                if (sentencesSaved) {
                    const sentencesArray = JSON.parse(sentencesSaved);
                    setDisabledSentences(new Set(sentencesArray));
                }
            } catch (error) {
                console.error('Error loading disabled items:', error);
            }
        };
        loadDisabledItems();
    }, []);

    // Save disabled items to AsyncStorage whenever they change
    useEffect(() => {
        const saveDisabledItems = async () => {
            try {
                await AsyncStorage.setItem(HSK_DISABLED_STORAGE_KEY, JSON.stringify(Array.from(disabledHSK)));
                await AsyncStorage.setItem(TOCFL_DISABLED_STORAGE_KEY, JSON.stringify(Array.from(disabledTOCFL)));
                await AsyncStorage.setItem(KANJI_DISABLED_STORAGE_KEY, JSON.stringify(Array.from(disabledKanji)));
                await AsyncStorage.setItem(SENTENCES_DISABLED_STORAGE_KEY, JSON.stringify(Array.from(disabledSentences)));
            } catch (error) {
                console.error('Error saving disabled items:', error);
            }
        };
        saveDisabledItems();
    }, [disabledHSK, disabledTOCFL, disabledKanji, disabledSentences]);

    // Get available levels for selected type
    const getAvailableLevels = () => {
        if (selectedType === 'hsk') {
            return [1, 2];
        } else if (selectedType === 'tocfl') {
            return [1];
        } else if (selectedType === 'kanji') {
            return [1, 2, 3, 4, 5, 6];
        } else if (selectedType === 'sentences') {
            return []; // Sentences don't have levels
        }
        return [];
    };

    // Get filtered data based on selected type, levels, and search query
    const getFilteredData = () => {
        if (!selectedType) {
            return [];
        }
        // Sentences don't have levels, so don't require selectedLevels
        if (selectedType !== 'sentences' && selectedLevels.length === 0) {
            return [];
        }

        let data = [];
        if (selectedType === 'hsk') {
            data = hskData.filter(word => selectedLevels.includes(word.level));
        } else if (selectedType === 'tocfl') {
            // TOCFL data is only level 1, so filter based on selectedLevels including 1
            if (selectedLevels.includes(1)) {
                data = tocflData;
            } else {
                return [];
            }
        } else if (selectedType === 'kanji') {
            data = allKanji.filter(kanji => selectedLevels.includes(kanji.level));
        } else if (selectedType === 'sentences') {
            // Sentences don't have levels, so return all (excluding disabled)
            data = (sentencesData || []).filter((sentence, index) =>
                !disabledSentences.has(`sentence-${index}`)
            );
        } else {
            return [];
        }

        // Apply character filter for HSK and TOCFL
        if ((selectedType === 'hsk' || selectedType === 'tocfl') && characterFilter !== 'all') {
            if (characterFilter === 'single') {
                data = data.filter(item => item.characterCount === 1);
            } else if (characterFilter === 'multi') {
                data = data.filter(item => item.characterCount > 1);
            }
        }

        // Apply search filter if query exists
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            if (selectedType === 'hsk' || selectedType === 'tocfl') {
                data = data.filter(item => {
                    const simplified = (item.simplifiedChinese || '').toLowerCase();
                    const traditional = (item.traditionalChinese || '').toLowerCase();
                    const pinyin = (item.pinyin || '').toLowerCase();
                    const jyutping = (item.jyutping || '').toLowerCase();
                    const hanviet = (item.hanviet || '').toLowerCase();
                    const vietnamese = (item.vietnamese || '').toLowerCase();
                    const english = (item.english || '').toLowerCase();

                    return simplified.includes(query) ||
                        traditional.includes(query) ||
                        pinyin.includes(query) ||
                        jyutping.includes(query) ||
                        hanviet.includes(query) ||
                        vietnamese.includes(query) ||
                        english.includes(query);
                });
            } else if (selectedType === 'kanji') {
                data = data.filter(item => {
                    const kanji = (item.kanji || '').toLowerCase();
                    const onyomi = (item.onyomi || '').toLowerCase();
                    const kunyomi = (item.kunyomi || '').toLowerCase();
                    const hanviet = (item.hanviet || '').toLowerCase();
                    const viet = (item.viet || '').toLowerCase();
                    const english = (item.english || '').toLowerCase();

                    return kanji.includes(query) ||
                        onyomi.includes(query) ||
                        kunyomi.includes(query) ||
                        hanviet.includes(query) ||
                        viet.includes(query) ||
                        english.includes(query);
                });
            } else if (selectedType === 'sentences') {
                data = data.filter(item => {
                    const simplified = (item.simplified || '').toLowerCase();
                    const traditional = (item.traditional || '').toLowerCase();
                    const pinyin = (item.pinyin || '').toLowerCase();
                    const jyutping = (item.jyutping || '').toLowerCase();
                    const hanviet = (item.hanviet || '').toLowerCase();
                    const viet = (item.viet || '').toLowerCase();
                    const english = (item.english || '').toLowerCase();

                    return simplified.includes(query) ||
                        traditional.includes(query) ||
                        pinyin.includes(query) ||
                        jyutping.includes(query) ||
                        hanviet.includes(query) ||
                        viet.includes(query) ||
                        english.includes(query);
                });
            }
        }

        return data;
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

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        // Automatically select the first available level(s) for the new type
        if (type === 'hsk') {
            setSelectedLevels([1]);
        } else if (type === 'tocfl') {
            setSelectedLevels([1]);
        } else if (type === 'kanji') {
            setSelectedLevels([1]);
        } else {
            setSelectedLevels([]);
        }
        // Reset character filter when switching types
        setCharacterFilter('all');
        // Reset selected levels for sentences (they don't have levels)
        if (type === 'sentences') {
            setSelectedLevels([]);
        }
    };

    const toggleHSKDisabled = (wordId) => {
        const newDisabled = new Set(disabledHSK);
        if (newDisabled.has(wordId)) {
            newDisabled.delete(wordId);
        } else {
            newDisabled.add(wordId);
        }
        setDisabledHSK(newDisabled);
    };

    const toggleTOCFLDisabled = (wordId) => {
        const newDisabled = new Set(disabledTOCFL);
        if (newDisabled.has(wordId)) {
            newDisabled.delete(wordId);
        } else {
            newDisabled.add(wordId);
        }
        setDisabledTOCFL(newDisabled);
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

    const clearFilters = () => {
        setSearchQuery('');
        setCharacterFilter('all');
        setSelectedLevels([1]);
    };

    const filteredData = getFilteredData();

    const renderHSKItem = ({ item }) => {
        const wordId = `${item.level}-${item.id}`;
        const isDisabled = disabledHSK.has(wordId);
        return (
            <View style={[styles.itemCard, isDisabled && styles.itemCardDisabled]}>
                <Text selectable style={[styles.character, isDisabled && styles.characterDisabled]}>
                    {settings.mainDisplayMode === 'simplified'
                        ? item.simplifiedChinese
                        : item.traditionalChinese}
                </Text>
                {item.simplifiedChinese && item.traditionalChinese && item.simplifiedChinese !== item.traditionalChinese && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>{settings.mainDisplayMode === 'simplified' ? 'Traditional: ' : 'Simplified: '}</Text>
                        {settings.mainDisplayMode === 'simplified' ? item.traditionalChinese : item.simplifiedChinese}
                    </Text>
                )}
                {item.pinyin && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Pinyin: </Text>{item.pinyin}
                    </Text>
                )}
                {item.jyutping && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Jyutping: </Text>{item.jyutping}
                    </Text>
                )}
                {item.hanviet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Han Viet: </Text>{item.hanviet}
                    </Text>
                )}
                {item.vietnamese && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Vietnamese: </Text>{item.vietnamese}
                    </Text>
                )}
                {item.english && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>English: </Text>{item.english}
                    </Text>
                )}
                <Text selectable style={styles.levelTag}>HSK Level {item.level}</Text>
                <TouchableOpacity
                    style={[styles.disableButton, isDisabled && styles.enableButton]}
                    onPress={() => toggleHSKDisabled(wordId)}
                >
                    <Text style={styles.disableButtonText}>
                        {isDisabled ? 'Enable' : 'Disable'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderTOCFLItem = ({ item }) => {
        const isDisabled = disabledTOCFL.has(item.id);
        return (
            <View style={[styles.itemCard, isDisabled && styles.itemCardDisabled]}>
                <Text selectable style={[styles.character, isDisabled && styles.characterDisabled]}>
                    {settings.mainDisplayMode === 'simplified'
                        ? item.simplifiedChinese
                        : item.traditionalChinese}
                </Text>
                {item.simplifiedChinese && item.traditionalChinese && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>{settings.mainDisplayMode === 'simplified' ? 'Traditional: ' : 'Simplified: '}</Text>
                        {settings.mainDisplayMode === 'simplified' ? item.traditionalChinese : item.simplifiedChinese}
                    </Text>
                )}
                {item.pinyin && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Pinyin: </Text>{item.pinyin}
                    </Text>
                )}
                {item.jyutping && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Jyutping: </Text>{item.jyutping}
                    </Text>
                )}
                {item.hanviet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Han Viet: </Text>{item.hanviet}
                    </Text>
                )}
                {item.vietnamese && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Vietnamese: </Text>{item.vietnamese}
                    </Text>
                )}
                {item.english && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>English: </Text>{item.english}
                    </Text>
                )}
                <Text selectable style={styles.levelTag}>TOCFL Level 1</Text>
                <TouchableOpacity
                    style={[styles.disableButton, isDisabled && styles.enableButton]}
                    onPress={() => toggleTOCFLDisabled(item.id)}
                >
                    <Text style={styles.disableButtonText}>
                        {isDisabled ? 'Enable' : 'Disable'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderKanjiItem = ({ item }) => {
        const isDisabled = disabledKanji.has(item.kanji);
        return (
            <View style={[styles.itemCard, isDisabled && styles.itemCardDisabled]}>
                <Text selectable style={[styles.character, isDisabled && styles.characterDisabled]}>
                    {item.kanji}
                </Text>
                {item.onyomi && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>On'yomi: </Text>{item.onyomi}
                    </Text>
                )}
                {item.kunyomi && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Kun'yomi: </Text>{item.kunyomi}
                    </Text>
                )}
                {item.hanviet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Han Viet: </Text>{item.hanviet}
                    </Text>
                )}
                {item.viet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Vietnamese: </Text>{item.viet}
                    </Text>
                )}
                {item.english && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>English: </Text>{item.english}
                    </Text>
                )}
                <Text selectable style={styles.levelTag}>Grade {item.level}</Text>
                <TouchableOpacity
                    style={[styles.disableButton, isDisabled && styles.enableButton]}
                    onPress={() => toggleKanjiDisabled(item.kanji)}
                >
                    <Text style={styles.disableButtonText}>
                        {isDisabled ? 'Enable' : 'Disable'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
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

    const renderSentenceItem = ({ item, index }) => {
        const sentenceKey = `sentence-${index}`;
        const isDisabled = disabledSentences.has(sentenceKey);
        return (
            <View style={[styles.itemCard, isDisabled && styles.itemCardDisabled]}>
                <Text selectable style={[styles.character, isDisabled && styles.characterDisabled, styles.sentenceText]}>
                    {settings.mainDisplayMode === 'simplified'
                        ? item.simplified
                        : item.traditional}
                </Text>
                {item.simplified && item.traditional && item.simplified !== item.traditional && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>{settings.mainDisplayMode === 'simplified' ? 'Traditional: ' : 'Simplified: '}</Text>
                        {settings.mainDisplayMode === 'simplified' ? item.traditional : item.simplified}
                    </Text>
                )}
                {item.pinyin && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Pinyin: </Text>{item.pinyin}
                    </Text>
                )}
                {item.jyutping && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Jyutping: </Text>{item.jyutping}
                    </Text>
                )}
                {item.hanviet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Han Viet: </Text>{item.hanviet}
                    </Text>
                )}
                {item.viet && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>Vietnamese: </Text>{item.viet}
                    </Text>
                )}
                {item.english && (
                    <Text selectable style={styles.subText}>
                        <Text selectable style={styles.labelText}>English: </Text>{item.english}
                    </Text>
                )}
                <TouchableOpacity
                    style={[styles.disableButton, isDisabled && styles.enableButton]}
                    onPress={() => toggleSentenceDisabled(index)}
                >
                    <Text style={styles.disableButtonText}>
                        {isDisabled ? 'Enable' : 'Disable'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderItem = ({ item, index }) => {
        if (selectedType === 'hsk') {
            return renderHSKItem({ item });
        } else if (selectedType === 'tocfl') {
            return renderTOCFLItem({ item });
        } else if (selectedType === 'kanji') {
            return renderKanjiItem({ item });
        } else if (selectedType === 'sentences') {
            return renderSentenceItem({ item, index });
        }
        return null;
    };

    return (
        <ScrollView
            style={styles.container}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.contentWrapper}>
                <View style={styles.filterSection}>
                    <View style={styles.filterHeader}>
                        <Text style={styles.sectionTitle}>Filter by Type</Text>
                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => setShowFilters(!showFilters)}
                        >
                            <Text style={styles.toggleButtonText}>
                                {showFilters ? '▼' : '▶'} {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedType === 'hsk' && styles.filterButtonActive]}
                            onPress={() => handleTypeSelect('hsk')}
                        >
                            <Text style={[styles.filterButtonText, selectedType === 'hsk' && styles.filterButtonTextActive]}>
                                HSK
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedType === 'tocfl' && styles.filterButtonActive]}
                            onPress={() => handleTypeSelect('tocfl')}
                        >
                            <Text style={[styles.filterButtonText, selectedType === 'tocfl' && styles.filterButtonTextActive]}>
                                TOCFL
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedType === 'kanji' && styles.filterButtonActive]}
                            onPress={() => handleTypeSelect('kanji')}
                        >
                            <Text style={[styles.filterButtonText, selectedType === 'kanji' && styles.filterButtonTextActive]}>
                                Kanji
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, selectedType === 'sentences' && styles.filterButtonActive]}
                            onPress={() => handleTypeSelect('sentences')}
                        >
                            <Text style={[styles.filterButtonText, selectedType === 'sentences' && styles.filterButtonTextActive]}>
                                Sentences
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showFilters && (
                    <>
                        {selectedType && selectedType !== 'sentences' && (
                            <View style={styles.filterSection}>
                                <Text style={styles.sectionTitle}>
                                    {selectedType === 'kanji' ? 'Filter by Grade' : 'Filter by Level'}
                                </Text>
                                <View style={styles.filterRow}>
                                    {getAvailableLevels().map(level => (
                                        <TouchableOpacity
                                            key={level}
                                            style={[styles.levelButton, selectedLevels.includes(level) && styles.levelButtonActive]}
                                            onPress={() => toggleLevel(level)}
                                        >
                                            <Text style={[styles.levelButtonText, selectedLevels.includes(level) && styles.levelButtonTextActive]}>
                                                {level}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {(selectedType === 'hsk' || selectedType === 'tocfl') && (
                            <View style={styles.filterSection}>
                                <Text style={styles.sectionTitle}>Character Type</Text>
                                <View style={styles.filterRow}>
                                    <TouchableOpacity
                                        style={[styles.levelButton, characterFilter === 'all' && styles.levelButtonActive]}
                                        onPress={() => setCharacterFilter('all')}
                                    >
                                        <Text style={[styles.levelButtonText, characterFilter === 'all' && styles.levelButtonTextActive]}>
                                            All
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.levelButton, characterFilter === 'single' && styles.levelButtonActive]}
                                        onPress={() => setCharacterFilter('single')}
                                    >
                                        <Text style={[styles.levelButtonText, characterFilter === 'single' && styles.levelButtonTextActive]}>
                                            Single
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.levelButton, characterFilter === 'multi' && styles.levelButtonActive]}
                                        onPress={() => setCharacterFilter('multi')}
                                    >
                                        <Text style={[styles.levelButtonText, characterFilter === 'multi' && styles.levelButtonTextActive]}>
                                            Multi
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={styles.filterSection}>
                            <Text style={styles.sectionTitle}>Search</Text>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search characters, pinyin, translations..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#999"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.clearSearchButton}
                                        onPress={() => setSearchQuery('')}
                                    >
                                        <Text style={styles.clearSearchButtonText}>✕</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>


                    </>
                )}

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>
                        {filteredData.length > 0
                            ? `${filteredData.length} ${selectedType === 'kanji' ? 'Kanji' : selectedType === 'sentences' ? 'Sentences' : 'Words'}`
                            : selectedType === 'sentences' ? 'Select sentences type to view' : 'Select type and level to view characters'}
                    </Text>
                    {filteredData.length > 0 && (
                        <View style={styles.listContent}>
                            {filteredData.map((item, index) => {
                                let key;
                                if (selectedType === 'hsk') {
                                    key = `hsk-${item.level}-${item.id}`;
                                } else if (selectedType === 'tocfl') {
                                    key = `tocfl-${item.id}`;
                                } else if (selectedType === 'kanji') {
                                    key = `kanji-${item.level}-${item.kanji}`;
                                } else if (selectedType === 'sentences') {
                                    // For sentences, use the index in the original array
                                    const originalIndex = sentencesData.findIndex(
                                        s => s.simplified === item.simplified && s.traditional === item.traditional
                                    );
                                    key = `sentence-${originalIndex}`;
                                    return (
                                        <View key={key}>
                                            {renderItem({ item, index: originalIndex })}
                                        </View>
                                    );
                                } else {
                                    key = `item-${index}`;
                                }
                                return (
                                    <View key={key}>
                                        {renderItem({ item })}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentWrapper: {
        flex: 1,
    },
    filterSection: {
        backgroundColor: 'white',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#282c34',
        marginBottom: 10,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    toggleButtonText: {
        fontSize: 14,
        color: '#282c34',
        fontWeight: '600',
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
        marginRight: 10,
        marginBottom: 10,
    },
    filterButtonActive: {
        backgroundColor: '#282c34',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    levelButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 15,
        backgroundColor: '#e0e0e0',
        marginRight: 10,
        marginBottom: 10,
    },
    levelButtonActive: {
        backgroundColor: '#282c34',
    },
    levelButtonText: {
        fontSize: 14,
        color: '#000',
        fontWeight: '600',
    },
    levelButtonTextActive: {
        color: '#fff',
    },
    listSection: {
        flex: 1,
        padding: 15,
    },
    listContent: {
        paddingBottom: 20,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    character: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    labelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#282c34',
    },
    levelTag: {
        fontSize: 12,
        color: '#282c34',
        fontWeight: '600',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    itemCardDisabled: {
        opacity: 0.5,
        backgroundColor: '#f0f0f0',
    },
    characterDisabled: {
        color: '#999',
    },
    disableButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 10,
        alignItems: 'center',
    },
    enableButton: {
        backgroundColor: '#44ff44',
    },
    disableButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        paddingRight: 40,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    clearSearchButton: {
        position: 'absolute',
        right: 10,
        padding: 5,
        borderRadius: 15,
        backgroundColor: '#ccc',
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearSearchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    clearButton: {
        backgroundColor: '#ff6666',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    sentenceText: {
        fontSize: 24,
        lineHeight: 32,
    },
});

