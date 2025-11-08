import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

// Import audio files
const si1 = require('../assets/audio/si1.mp3');
const si2 = require('../assets/audio/si2.mp3');
const si3 = require('../assets/audio/si3.mp3');
const si4 = require('../assets/audio/si4.mp3');
const si5 = require('../assets/audio/si5.mp3');
const si6 = require('../assets/audio/si6.mp3');

const audioFiles = { si1, si2, si3, si4, si5, si6 };

export default function TonesScreen() {
    const [selectedLanguage, setSelectedLanguage] = useState('mandarin'); // 'mandarin', 'cantonese', 'vietnamese'
    const [playingTone, setPlayingTone] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const soundRef = useRef(null);
    const isProcessingRef = useRef(false);

    // Cleanup sound when component unmounts or language changes
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => {});
            }
            isProcessingRef.current = false;
        };
    }, [selectedLanguage]);

    const playAudio = async (toneNumber) => {
        // Prevent multiple simultaneous calls
        if (isProcessingRef.current || isProcessing) {
            return;
        }

        try {
            isProcessingRef.current = true;
            setIsProcessing(true);

            // If clicking the same tone that's playing, stop it
            if (playingTone === toneNumber && soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
                setPlayingTone(null);
                isProcessingRef.current = false;
                setIsProcessing(false);
                return;
            }

            // Stop any currently playing audio
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
                soundRef.current = null;
            }

            setPlayingTone(toneNumber);
            
            const audioFile = audioFiles[`si${toneNumber}`];
            if (!audioFile) {
                isProcessingRef.current = false;
                setIsProcessing(false);
                return;
            }

            // Configure audio mode
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
            });

            // Load and play the sound
            const { sound } = await Audio.Sound.createAsync(audioFile, {
                shouldPlay: true,
            });

            soundRef.current = sound;
            isProcessingRef.current = false;
            setIsProcessing(false);

            // Listen for playback status updates
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.didJustFinish) {
                    setPlayingTone(null);
                    sound.unloadAsync().catch(() => {});
                    soundRef.current = null;
                }
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            setPlayingTone(null);
            isProcessingRef.current = false;
            setIsProcessing(false);
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => {});
                soundRef.current = null;
            }
        }
    };

    const renderMandarinTones = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mandarin Chinese Tones (Pinyin)</Text>
            <Text style={styles.sectionDescription}>
                Mandarin Chinese has 4 main tones plus a neutral tone
            </Text>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>1st Tone</Text>
                <Text style={styles.toneMark}>ˉ (mā)</Text>
                <Text style={styles.toneDescription}>
                    High, flat, and level. Maintain a steady high pitch throughout.
                </Text>
                <Text style={styles.toneExample}>Example: mā (mother) - 妈</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>2nd Tone</Text>
                <Text style={styles.toneMark}>ˊ (má)</Text>
                <Text style={styles.toneDescription}>
                    Rising tone. Start at mid-level and rise to high pitch.
                </Text>
                <Text style={styles.toneExample}>Example: má (hemp) - 麻</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>3rd Tone</Text>
                <Text style={styles.toneMark}>ˇ (mǎ)</Text>
                <Text style={styles.toneDescription}>
                    Falling-rising tone. Start mid, drop to low, then rise to mid-high.
                </Text>
                <Text style={styles.toneExample}>Example: mǎ (horse) - 马</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>4th Tone</Text>
                <Text style={styles.toneMark}>ˋ (mà)</Text>
                <Text style={styles.toneDescription}>
                    Falling tone. Start high and drop sharply to low.
                </Text>
                <Text style={styles.toneExample}>Example: mà (scold) - 骂</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Neutral Tone</Text>
                <Text style={styles.toneMark}>• (ma)</Text>
                <Text style={styles.toneDescription}>
                    Light and short tone. No tone mark, unstressed syllable.
                </Text>
                <Text style={styles.toneExample}>Example: ma (question particle) - 吗</Text>
            </View>
        </View>
    );

    const renderCantoneseTones = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cantonese Tones (Jyutping)</Text>
            <Text style={styles.sectionDescription}>
                Cantonese has 6 tones (some dialects have more)
            </Text>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 1 (High Level)</Text>
                        <Text style={styles.toneMark}>1 (si1)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 1 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 1)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(1)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 1)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 1 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    High, flat, level tone. Similar to Mandarin 1st tone.
                </Text>
                <Text style={styles.toneExample}>Example: si1 (poem) - 詩</Text>
            </View>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 2 (High Rising)</Text>
                        <Text style={styles.toneMark}>2 (si2)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 2 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 2)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(2)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 2)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 2 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    High rising tone. Starts mid-high and rises to high.
                </Text>
                <Text style={styles.toneExample}>Example: si2 (history) - 史</Text>
            </View>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 3 (Mid Level)</Text>
                        <Text style={styles.toneMark}>3 (si3)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 3 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 3)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(3)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 3)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 3 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    Mid-level tone. Maintains a steady mid pitch.
                </Text>
                <Text style={styles.toneExample}>Example: si3 (try) - 試</Text>
            </View>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 4 (Low Falling)</Text>
                        <Text style={styles.toneMark}>4 (si4)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 4 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 4)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(4)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 4)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 4 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    Low falling tone. Starts mid-low and falls to low.
                </Text>
                <Text style={styles.toneExample}>Example: si4 (time) - 時</Text>
            </View>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 5 (Low Rising)</Text>
                        <Text style={styles.toneMark}>5 (si5)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 5 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 5)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(5)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 5)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 5 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    Low rising tone. Starts low and rises to mid-low.
                </Text>
                <Text style={styles.toneExample}>Example: si5 (market) - 市</Text>
            </View>

            <View style={styles.toneCard}>
                <View style={styles.toneHeader}>
                    <View style={styles.toneHeaderText}>
                        <Text style={styles.toneNumber}>Tone 6 (Low Level)</Text>
                        <Text style={styles.toneMark}>6 (si6)</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.playButton, 
                            playingTone === 6 && styles.playButtonActive,
                            (isProcessing || (playingTone !== null && playingTone !== 6)) && styles.playButtonDisabled
                        ]}
                        onPress={() => playAudio(6)}
                        disabled={isProcessing || (playingTone !== null && playingTone !== 6)}
                    >
                        <Text style={styles.playButtonText}>
                            {playingTone === 6 ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.toneDescription}>
                    Low, flat, level tone. Maintains a steady low pitch.
                </Text>
                <Text style={styles.toneExample}>Example: si6 (matter) - 事</Text>
            </View>
        </View>
    );

    const renderVietnameseTones = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vietnamese Tones</Text>
            <Text style={styles.sectionDescription}>
                Vietnamese has 6 tones (Northern dialect)
            </Text>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Level Tone (Ngang)</Text>
                <Text style={styles.toneMark}>a (no mark)</Text>
                <Text style={styles.toneDescription}>
                    Mid-level, flat tone. Similar to unaccented English syllables.
                </Text>
                <Text style={styles.toneExample}>Example: ma (ghost) - ma</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>High Rising (Sắc)</Text>
                <Text style={styles.toneMark}>á (acute)</Text>
                <Text style={styles.toneDescription}>
                    High rising tone. Starts mid and rises to high.
                </Text>
                <Text style={styles.toneExample}>Example: má (mother) - má</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Low Falling (Huyền)</Text>
                <Text style={styles.toneMark}>à (grave)</Text>
                <Text style={styles.toneDescription}>
                    Low falling tone. Starts mid-low and falls to low.
                </Text>
                <Text style={styles.toneExample}>Example: mà (but) - mà</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Falling-Rising (Hỏi)</Text>
                <Text style={styles.toneMark}>ả (hook)</Text>
                <Text style={styles.toneDescription}>
                    Falling-rising tone. Starts mid, dips low, then rises.
                </Text>
                <Text style={styles.toneExample}>Example: mả (tomb) - mả</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>High Broken (Ngã)</Text>
                <Text style={styles.toneMark}>ã (tilde)</Text>
                <Text style={styles.toneDescription}>
                    High broken tone. Starts high, dips slightly, then rises back.{'\n'}
                    {'\n'}
                    <Text style={styles.toneNote}>
                        <Text style={styles.toneNoteTitle}>Note (Southern dialect):</Text> In Southern Vietnamese, the Ngã tone sounds like the Hỏi tone (falling-rising). Both tones merge in the Southern dialect.
                    </Text>
                </Text>
                <Text style={styles.toneExample}>Example: mã (horse) - mã</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Low Constricted (Nặng)</Text>
                <Text style={styles.toneMark}>ạ (dot below)</Text>
                <Text style={styles.toneDescription}>
                    Low constricted tone. Starts low and stays low with constriction.
                </Text>
                <Text style={styles.toneExample}>Example: mạ (rice seedling) - mạ</Text>
            </View>
        </View>
    );

    return (
        <ScrollView 
            style={styles.container}
            maximumZoomScale={3.0}
            minimumZoomScale={1.0}
            pinchZoomEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.languageSelector}>
                <TouchableOpacity
                    style={[styles.languageButton, selectedLanguage === 'mandarin' && styles.languageButtonActive]}
                    onPress={() => setSelectedLanguage('mandarin')}
                >
                    <Text style={[styles.languageButtonText, selectedLanguage === 'mandarin' && styles.languageButtonTextActive]}>
                        Mandarin
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.languageButton, selectedLanguage === 'cantonese' && styles.languageButtonActive]}
                    onPress={() => setSelectedLanguage('cantonese')}
                >
                    <Text style={[styles.languageButtonText, selectedLanguage === 'cantonese' && styles.languageButtonTextActive]}>
                        Cantonese
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.languageButton, selectedLanguage === 'vietnamese' && styles.languageButtonActive]}
                    onPress={() => setSelectedLanguage('vietnamese')}
                >
                    <Text style={[styles.languageButtonText, selectedLanguage === 'vietnamese' && styles.languageButtonTextActive]}>
                        Vietnamese
                    </Text>
                </TouchableOpacity>
            </View>

            {selectedLanguage === 'mandarin' && renderMandarinTones()}
            {selectedLanguage === 'cantonese' && renderCantoneseTones()}
            {selectedLanguage === 'vietnamese' && renderVietnameseTones()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    languageSelector: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    languageButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
    },
    languageButtonActive: {
        backgroundColor: '#282c34',
    },
    languageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    languageButtonTextActive: {
        color: '#fff',
    },
    section: {
        backgroundColor: 'white',
        marginTop: 20,
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#000',
        marginBottom: 15,
    },
    toneCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#61dafb',
    },
    toneNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    toneMark: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 8,
    },
    toneDescription: {
        fontSize: 14,
        color: '#000',
        marginBottom: 8,
        lineHeight: 20,
    },
    toneExample: {
        fontSize: 14,
        color: '#000',
        fontStyle: 'italic',
        marginTop: 5,
    },
    toneNote: {
        fontSize: 13,
        color: '#000',
        marginTop: 8,
        lineHeight: 18,
    },
    toneNoteTitle: {
        fontWeight: 'bold',
        color: '#000',
    },
    toneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    toneHeaderText: {
        flex: 1,
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#61dafb',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    playButtonActive: {
        backgroundColor: '#282c34',
    },
    playButtonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.5,
    },
    playButtonText: {
        fontSize: 20,
        color: '#fff',
    },
});
