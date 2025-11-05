import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function TonesScreen() {
    const [selectedLanguage, setSelectedLanguage] = useState('mandarin'); // 'mandarin', 'cantonese', 'vietnamese'

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
                <Text style={styles.toneNumber}>Tone 1 (High Level)</Text>
                <Text style={styles.toneMark}>1 (si1)</Text>
                <Text style={styles.toneDescription}>
                    High, flat, level tone. Similar to Mandarin 1st tone.
                </Text>
                <Text style={styles.toneExample}>Example: si1 (poem) - 詩</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Tone 2 (High Rising)</Text>
                <Text style={styles.toneMark}>2 (si2)</Text>
                <Text style={styles.toneDescription}>
                    High rising tone. Starts mid-high and rises to high.
                </Text>
                <Text style={styles.toneExample}>Example: si2 (history) - 史</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Tone 3 (Mid Level)</Text>
                <Text style={styles.toneMark}>3 (si3)</Text>
                <Text style={styles.toneDescription}>
                    Mid-level tone. Maintains a steady mid pitch.
                </Text>
                <Text style={styles.toneExample}>Example: si3 (try) - 試</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Tone 4 (Low Falling)</Text>
                <Text style={styles.toneMark}>4 (si4)</Text>
                <Text style={styles.toneDescription}>
                    Low falling tone. Starts mid-low and falls to low.
                </Text>
                <Text style={styles.toneExample}>Example: si4 (time) - 時</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Tone 5 (Low Rising)</Text>
                <Text style={styles.toneMark}>5 (si5)</Text>
                <Text style={styles.toneDescription}>
                    Low rising tone. Starts low and rises to mid-low.
                </Text>
                <Text style={styles.toneExample}>Example: si5 (market) - 市</Text>
            </View>

            <View style={styles.toneCard}>
                <Text style={styles.toneNumber}>Tone 6 (Low Level)</Text>
                <Text style={styles.toneMark}>6 (si6)</Text>
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
        <ScrollView style={styles.container}>
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
});
