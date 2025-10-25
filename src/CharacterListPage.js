import React, { useState, useMemo } from 'react';
import hskData from './hsk_level1.json';
import kanjiData from './kanjiData.json';
import './App.css';

function CharacterListPage({ onNavigate }) {
    const [selectedMode, setSelectedMode] = useState('chinese'); // 'chinese' or 'kanji'
    const [selectedLevels, setSelectedLevels] = useState([1]);
    const [characterFilter, setCharacterFilter] = useState('all'); // 'all', 'single', 'multi'
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id'); // 'id', 'character', 'pinyin', 'english'

    // Get data based on selected mode
    const getData = () => {
        if (selectedMode === 'chinese') {
            return hskData;
        } else {
            // Convert kanjiData object to flat array
            const flatKanjiData = [];
            for (let grade = 1; grade <= 6; grade++) {
                if (kanjiData[grade]) {
                    flatKanjiData.push(...kanjiData[grade]);
                }
            }
            return flatKanjiData;
        }
    };

    // Filter and sort data
    const filteredData = useMemo(() => {
        let data = getData();

        // Apply level filter (only for Chinese mode)
        if (selectedMode === 'chinese') {
            data = data.filter(item => selectedLevels.includes(1)); // Only HSK Level 1 for now
        }

        // Apply character filter (only for Chinese mode)
        if (selectedMode === 'chinese' && characterFilter !== 'all') {
            if (characterFilter === 'single') {
                data = data.filter(item => item.characterCount === 1);
            } else if (characterFilter === 'multi') {
                data = data.filter(item => item.characterCount > 1);
            }
        }

        // Apply search filter
        if (searchTerm) {
            data = data.filter(item => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    item.simplifiedChinese?.toLowerCase().includes(searchLower) ||
                    item.traditionalChinese?.toLowerCase().includes(searchLower) ||
                    item.pinyin?.toLowerCase().includes(searchLower) ||
                    item.english?.toLowerCase().includes(searchLower) ||
                    item.vietnamese?.toLowerCase().includes(searchLower) ||
                    item.jyutping?.toLowerCase().includes(searchLower) ||
                    item.kanji?.toLowerCase().includes(searchLower) ||
                    item.kunyomi?.toLowerCase().includes(searchLower) ||
                    item.onyomi?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Apply sorting
        data.sort((a, b) => {
            switch (sortBy) {
                case 'character':
                    return (a.simplifiedChinese || a.kanji || '').localeCompare(b.simplifiedChinese || b.kanji || '');
                case 'pinyin':
                    return (a.pinyin || '').localeCompare(b.pinyin || '');
                case 'english':
                    return (a.english || '').localeCompare(b.english || '');
                default:
                    return a.id - b.id;
            }
        });

        return data;
    }, [selectedMode, selectedLevels, characterFilter, searchTerm, sortBy]);

    const toggleLevel = (level) => {
        const newLevels = [...selectedLevels];
        if (newLevels.includes(level)) {
            newLevels.splice(newLevels.indexOf(level), 1);
        } else {
            newLevels.push(level);
        }
        setSelectedLevels(newLevels);
    };

    const getCharacterDisplay = (item) => {
        if (selectedMode === 'chinese') {
            return item.simplifiedChinese;
        } else {
            return item.kanji;
        }
    };

    const getReadingDisplay = (item) => {
        if (selectedMode === 'chinese') {
            return item.pinyin;
        } else {
            return `${item.onyomi || ''} ${item.kunyomi || ''}`.trim();
        }
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
                        className="nav-btn"
                        onClick={() => onNavigate && onNavigate('hsk')}
                    >
                        HSK Level 1
                    </button>
                    <button
                        className="nav-btn active"
                    >
                        Character List
                    </button>
                </div>
                <h1>Character List</h1>
                <p>Browse and search through all characters and their translations</p>
            </header>

            <main className="App-main">
                {/* Mode Selection */}
                <div className="mode-selection">
                    <h2>Select Mode:</h2>
                    <div className="mode-buttons">
                        <button
                            className={`mode-btn ${selectedMode === 'chinese' ? 'selected' : ''}`}
                            onClick={() => setSelectedMode('chinese')}
                        >
                            Chinese (HSK)
                        </button>
                        <button
                            className={`mode-btn ${selectedMode === 'kanji' ? 'selected' : ''}`}
                            onClick={() => setSelectedMode('kanji')}
                        >
                            Japanese (Kanji)
                        </button>
                    </div>
                </div>

                {/* Level Selection (only for Chinese mode) */}
                {selectedMode === 'chinese' && (
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
                )}

                {/* Character Filter (only for Chinese mode) */}
                {selectedMode === 'chinese' && (
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
                    </div>
                )}

                {/* Search and Sort Controls */}
                <div className="search-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder={`Search ${selectedMode === 'chinese' ? 'Chinese' : 'Kanji'} characters...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="sort-controls">
                        <label htmlFor="sort-select">Sort by:</label>
                        <select
                            id="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="id">ID</option>
                            <option value="character">Character</option>
                            <option value="pinyin">Reading</option>
                            <option value="english">English</option>
                        </select>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="results-summary">
                    <p>Showing {filteredData.length} {selectedMode === 'chinese' ? 'Chinese' : 'Kanji'} characters</p>
                </div>

                {/* Character List */}
                <div className="character-list">
                    {filteredData.map((item) => (
                        <div key={item.id} className="character-item">
                            <div className="character-main">
                                <div className="character-display">
                                    {getCharacterDisplay(item)}
                                </div>
                                <div className="character-info">
                                    <div className="character-reading">
                                        {getReadingDisplay(item)}
                                    </div>
                                    <div className="character-translations">
                                        <div className="translation-item">
                                            <span className="translation-label">English:</span>
                                            <span className="translation-text">{item.english}</span>
                                        </div>
                                        <div className="translation-item">
                                            <span className="translation-label">Vietnamese:</span>
                                            <span className="translation-text">{item.vietnamese}</span>
                                        </div>
                                        {selectedMode === 'chinese' && item.traditionalChinese && (
                                            <div className="translation-item">
                                                <span className="translation-label">Traditional:</span>
                                                <span className="translation-text">{item.traditionalChinese}</span>
                                            </div>
                                        )}
                                        {selectedMode === 'chinese' && item.jyutping && (
                                            <div className="translation-item">
                                                <span className="translation-label">Jyutping:</span>
                                                <span className="translation-text">{item.jyutping}</span>
                                            </div>
                                        )}
                                        {selectedMode === 'kanji' && item.meaning && (
                                            <div className="translation-item">
                                                <span className="translation-label">Meaning:</span>
                                                <span className="translation-text">{item.meaning}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredData.length === 0 && (
                    <div className="no-results">
                        <p>No characters found matching your criteria.</p>
                        <p>Try adjusting your search terms or filters.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CharacterListPage;
