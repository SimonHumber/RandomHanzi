import React, { useState } from 'react';
import tocflData from './tocfl_level1.json';
import './App.css';

function TOCFLPage({ onNavigate }) {
    const [selectedLevels, setSelectedLevels] = useState([1]);
    const [currentWord, setCurrentWord] = useState(null);
    const [showVietnamese, setShowVietnamese] = useState(false);
    const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [showTraditional, setShowTraditional] = useState(false);
    const [showJyutping, setShowJyutping] = useState(false);
    const [showHanViet, setShowHanViet] = useState(false);
    const [disabledWords, setDisabledWords] = useState(new Set());
    const [characterFilter, setCharacterFilter] = useState('all'); // 'all', 'single', 'multi'

    const generateRandomWord = () => {
        let filteredWords = tocflData.filter(word =>
            selectedLevels.includes(1) && !disabledWords.has(word.id)
        );

        // Apply character filter
        if (characterFilter === 'single') {
            filteredWords = filteredWords.filter(word => word.characterCount === 1);
        } else if (characterFilter === 'multi') {
            filteredWords = filteredWords.filter(word => word.characterCount > 1);
        }

        if (filteredWords.length === 0) {
            alert('No more words available! Enable some words or change the character filter to continue.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredWords.length);
        const selectedWord = filteredWords[randomIndex];
        setCurrentWord(selectedWord);
        setShowVietnamese(false);
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
        let filteredWords = tocflData.filter(word =>
            selectedLevels.includes(1) && !disabledWords.has(word.id)
        );

        // Apply character filter
        if (characterFilter === 'single') {
            filteredWords = filteredWords.filter(word => word.characterCount === 1);
        } else if (characterFilter === 'multi') {
            filteredWords = filteredWords.filter(word => word.characterCount > 1);
        }

        return filteredWords.length;
    };

    const disableAllWords = () => {
        const allWordIds = new Set(tocflData.map(word => word.id));
        setDisabledWords(allWordIds);
    };

    const enableAllWords = () => {
        setDisabledWords(new Set());
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>TOCFL Level 1 Vocabulary Generator</h1>
                <p>Practice Chinese vocabulary with Vietnamese translations</p>
            </header>

            <main className="App-main">
                <div className="grade-selection">
                    <h2>Select TOCFL Levels:</h2>
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

                <div className="character-filter">
                    <h2>Character Filter:</h2>
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${characterFilter === 'all' ? 'selected' : ''}`}
                            onClick={() => setCharacterFilter('all')}
                        >
                            All Words
                        </button>
                        <button
                            className={`filter-btn ${characterFilter === 'single' ? 'selected' : ''}`}
                            onClick={() => setCharacterFilter('single')}
                        >
                            Single Characters Only
                        </button>
                        <button
                            className={`filter-btn ${characterFilter === 'multi' ? 'selected' : ''}`}
                            onClick={() => setCharacterFilter('multi')}
                        >
                            Multi-Character Words
                        </button>
                    </div>
                    <div className="filter-stats">
                        <span className="filter-info">
                            Showing: {characterFilter === 'all' ? 'All entries' :
                                characterFilter === 'single' ? 'Single characters only' :
                                    'Multi-character words only'}
                        </span>
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
                                className="reveal-btn"
                                onClick={() => setShowHanViet(!showHanViet)}
                            >
                                {showHanViet ? 'Hide' : 'Show'} Han Viet Reading
                            </button>
                            {showHanViet && (
                                <div className="hanviet-reading">
                                    {currentWord.hanviet}
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
                                const word = tocflData.find(w => w.id === wordId);
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

export default TOCFLPage;
