import React, { useState } from 'react';
import hskData from './hsk_level1.json';
import './App.css';

function HSKPage({ onNavigate }) {
    const [selectedLevels, setSelectedLevels] = useState([1]);
    const [currentWord, setCurrentWord] = useState(null);
    const [showVietnamese, setShowVietnamese] = useState(false);
    const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [showTraditional, setShowTraditional] = useState(false);
    const [showJyutping, setShowJyutping] = useState(false);
    const [disabledWords, setDisabledWords] = useState(new Set());

    const generateRandomWord = () => {
        const availableWords = hskData.filter(word =>
            selectedLevels.includes(1) && !disabledWords.has(word.id)
        );
        if (availableWords.length === 0) {
            alert('No more words available! Enable some words to continue.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * availableWords.length);
        const selectedWord = availableWords[randomIndex];
        setCurrentWord(selectedWord);
        setShowVietnamese(false);
        setShowVietnameseTranslation(false);
        setShowEnglish(false);
        setShowTraditional(false);
        setShowJyutping(false);
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
        return hskData.filter(word =>
            selectedLevels.includes(1) && !disabledWords.has(word.id)
        ).length;
    };

    const disableAllWords = () => {
        const allWordIds = new Set(hskData.map(word => word.id));
        setDisabledWords(allWordIds);
    };

    const enableAllWords = () => {
        setDisabledWords(new Set());
    };

    return (
        <div className="App">
            <header className="App-header">
                <div className="nav-buttons">
                    <button
                        className="nav-btn"
                        onClick={() => onNavigate && onNavigate('kanji')}
                    >
                        Kanji Generator
                    </button>
                    <button
                        className="nav-btn active"
                    >
                        HSK Level 1
                    </button>
                </div>
                <h1>HSK Level 1 Vocabulary Generator</h1>
                <p>Practice Chinese vocabulary with Vietnamese translations</p>
            </header>

            <main className="App-main">
                <div className="grade-selection">
                    <h2>Select HSK Levels:</h2>
                    <div className="grade-buttons">
                        <button
                            className={`grade-btn ${selectedLevels.includes(1) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(1)}
                        >
                            Level 1
                        </button>
                        <button
                            className={`grade-btn ${selectedLevels.includes(2) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(2)}
                            disabled
                        >
                            Level 2
                        </button>
                        <button
                            className={`grade-btn ${selectedLevels.includes(3) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(3)}
                            disabled
                        >
                            Level 3
                        </button>
                        <button
                            className={`grade-btn ${selectedLevels.includes(4) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(4)}
                            disabled
                        >
                            Level 4
                        </button>
                        <button
                            className={`grade-btn ${selectedLevels.includes(5) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(5)}
                            disabled
                        >
                            Level 5
                        </button>
                        <button
                            className={`grade-btn ${selectedLevels.includes(6) ? 'selected' : ''}`}
                            onClick={() => toggleLevel(6)}
                            disabled
                        >
                            Level 6
                        </button>
                    </div>
                </div>

                <div className="kanji-display">
                    <div className="kanji-controls">
                        <button className="generate-btn" onClick={generateRandomWord}>
                            Generate Random Word
                        </button>
                        <div className="kanji-stats">
                            <span className="available-count">Available: {getAvailableWordsCount()}</span>
                            <span className="disabled-count">Disabled: {disabledWords.size}</span>
                        </div>
                    </div>
                </div>

                {currentWord && (
                    <div className="kanji-card">
                        <div className="kanji-character">
                            {currentWord.traditionalChinese}
                        </div>

                        <div className="kanji-info">
                            <button
                                className="reveal-btn"
                                onClick={() => setShowTraditional(!showTraditional)}
                            >
                                {showTraditional ? 'Hide' : 'Show'} Simplified
                            </button>
                            {showTraditional && (
                                <div className="traditional-chinese">
                                    {currentWord.simplifiedChinese}
                                </div>
                            )}

                            <button
                                className="reveal-btn"
                                onClick={() => setShowJyutping(!showJyutping)}
                            >
                                {showJyutping ? 'Hide' : 'Show'} Jyutping
                            </button>
                            {showJyutping && (
                                <div className="jyutping">
                                    {currentWord.jyutping}
                                </div>
                            )}

                            <button
                                className="reveal-btn"
                                onClick={() => setShowVietnameseTranslation(!showVietnameseTranslation)}
                            >
                                {showVietnameseTranslation ? 'Hide' : 'Show'} Vietnamese Translation
                            </button>
                            {showVietnameseTranslation && (
                                <div className="vietnamese-translation">
                                    {currentWord.vietnamese}
                                </div>
                            )}

                            <button
                                className="reveal-btn"
                                onClick={() => setShowEnglish(!showEnglish)}
                            >
                                {showEnglish ? 'Hide' : 'Show'} English Translation
                            </button>
                            {showEnglish && (
                                <div className="english-translation">
                                    {currentWord.english}
                                </div>
                            )}

                            <button
                                className={`disable-btn ${disabledWords.has(currentWord.id) ? 'enabled' : 'disabled'}`}
                                onClick={() => toggleWordDisabled(currentWord.id)}
                            >
                                {disabledWords.has(currentWord.id) ? 'Enable' : 'Disable'} This Word
                            </button>
                        </div>
                    </div>
                )}

                <div className="bulk-controls">
                    <button
                        className="bulk-btn enable-all"
                        onClick={enableAllWords}
                        disabled={disabledWords.size === 0}
                    >
                        Enable All
                    </button>
                    <button
                        className="bulk-btn disable-all"
                        onClick={disableAllWords}
                        disabled={getAvailableWordsCount() === 0}
                    >
                        Disable All
                    </button>
                </div>

                {disabledWords.size > 0 && (
                    <div className="disabled-kanji-list">
                        <h3>Disabled Words ({disabledWords.size})</h3>
                        <div className="disabled-kanji-grid">
                            {Array.from(disabledWords).map(wordId => {
                                const word = hskData.find(w => w.id === wordId);
                                if (!word) return null;

                                return (
                                    <div key={wordId} className="disabled-kanji-item">
                                        <span className="disabled-kanji-char">{word.simplifiedChinese}</span>
                                        <span className="disabled-kanji-reading">{word.jyutping}</span>
                                        <button
                                            className="enable-kanji-btn"
                                            onClick={() => toggleWordDisabled(wordId)}
                                        >
                                            Enable
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default HSKPage;
