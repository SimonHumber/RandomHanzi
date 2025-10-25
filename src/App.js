import React, { useState } from 'react';
import './App.css';
import kanjiData from './kanjiData.json';
import HSKPage from './HSKPage';

function App() {
    const [currentPage, setCurrentPage] = useState('kanji'); // 'kanji' or 'hsk'
    const [selectedGrades, setSelectedGrades] = useState([1]);
    const [currentKanji, setCurrentKanji] = useState(null);
    const [showVietnamese, setShowVietnamese] = useState(false);
    const [showVietnameseTranslation, setShowVietnameseTranslation] = useState(false);
    const [showEnglish, setShowEnglish] = useState(false);
    const [disabledKanji, setDisabledKanji] = useState(new Set());

    const generateRandomKanji = () => {
        const availableKanji = [];
        selectedGrades.forEach(grade => {
            if (kanjiData[grade]) {
                // Filter out disabled kanji
                const enabledKanji = kanjiData[grade].filter(kanji => !disabledKanji.has(kanji.kanji));
                availableKanji.push(...enabledKanji);
            }
        });

        if (availableKanji.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableKanji.length);
            setCurrentKanji(availableKanji[randomIndex]);
            setShowVietnamese(false);
            setShowVietnameseTranslation(false);
            setShowEnglish(false);
        }
    };

    const toggleGrade = (grade) => {
        setSelectedGrades(prev =>
            prev.includes(grade)
                ? prev.filter(g => g !== grade)
                : [...prev, grade]
        );
    };

    const toggleKanjiDisabled = (kanji) => {
        setDisabledKanji(prev => {
            const newSet = new Set(prev);
            if (newSet.has(kanji)) {
                newSet.delete(kanji);
            } else {
                newSet.add(kanji);
            }
            return newSet;
        });
    };

    const getAvailableKanjiCount = () => {
        let count = 0;
        selectedGrades.forEach(grade => {
            if (kanjiData[grade]) {
                const enabledKanji = kanjiData[grade].filter(kanji => !disabledKanji.has(kanji.kanji));
                count += enabledKanji.length;
            }
        });
        return count;
    };

    const disableAllKanji = () => {
        const allKanji = new Set();
        selectedGrades.forEach(grade => {
            if (kanjiData[grade]) {
                kanjiData[grade].forEach(kanji => allKanji.add(kanji.kanji));
            }
        });
        setDisabledKanji(allKanji);
    };

    const enableAllKanji = () => {
        setDisabledKanji(new Set());
    };

    // Show HSK page if currentPage is 'hsk'
    if (currentPage === 'hsk') {
        return <HSKPage onNavigate={setCurrentPage} />;
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="nav-buttons">
                    <button
                        className={`nav-btn ${currentPage === 'kanji' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('kanji')}
                    >
                        Kanji Generator
                    </button>
                    <button
                        className={`nav-btn ${currentPage === 'hsk' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('hsk')}
                    >
                        HSK Level 1
                    </button>
                </div>
                <h1>Kanji Viet Generator</h1>
                <p>Random Kanji Generator with Vietnamese readings and translations</p>
            </header>

            <main className="App-main">
                <div className="grade-selection">
                    <h2>Select Kanji Grades:</h2>
                    <div className="grade-buttons">
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                            <button
                                key={grade}
                                className={`grade-btn ${selectedGrades.includes(grade) ? 'selected' : ''}`}
                                onClick={() => toggleGrade(grade)}
                            >
                                Grade {grade}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="kanji-display">
                    <div className="kanji-controls">
                        <button
                            className="generate-btn"
                            onClick={generateRandomKanji}
                            disabled={selectedGrades.length === 0 || getAvailableKanjiCount() === 0}
                        >
                            Generate Random Kanji
                        </button>
                        <div className="kanji-stats">
                            <span className="available-count">
                                Available: {getAvailableKanjiCount()} kanji
                            </span>
                            <span className="disabled-count">
                                Disabled: {disabledKanji.size} kanji
                            </span>
                        </div>
                    </div>

                    {currentKanji && (
                        <div className="kanji-card">
                            <div className="kanji-character">
                                {currentKanji.kanji}
                            </div>

                            <div className="kanji-info">
                                <button
                                    className="reveal-btn"
                                    onClick={() => setShowVietnamese(!showVietnamese)}
                                >
                                    {showVietnamese ? 'Hide' : 'Show'} Vietnamese Reading
                                </button>
                                {showVietnamese && (
                                    <div className="vietnamese-reading">
                                        {currentKanji.vietnamese}
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
                                        {currentKanji.vietTranslation}
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
                                        {currentKanji.english}
                                    </div>
                                )}

                                <button
                                    className={`disable-btn ${disabledKanji.has(currentKanji.kanji) ? 'enabled' : 'disabled'}`}
                                    onClick={() => toggleKanjiDisabled(currentKanji.kanji)}
                                >
                                    {disabledKanji.has(currentKanji.kanji) ? 'Enable' : 'Disable'} This Kanji
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bulk-controls">
                        <button
                            className="bulk-btn enable-all"
                            onClick={enableAllKanji}
                            disabled={disabledKanji.size === 0}
                        >
                            Enable All
                        </button>
                        <button
                            className="bulk-btn disable-all"
                            onClick={disableAllKanji}
                            disabled={getAvailableKanjiCount() === 0}
                        >
                            Disable All
                        </button>
                    </div>

                    {disabledKanji.size > 0 && (
                        <div className="disabled-kanji-list">
                            <h3>Disabled Kanji ({disabledKanji.size})</h3>
                            <div className="disabled-kanji-grid">
                                {Array.from(disabledKanji).map(kanji => {
                                    // Find the kanji data to get Vietnamese reading
                                    let kanjiInfo = null;
                                    for (let grade = 1; grade <= 6; grade++) {
                                        if (kanjiData[grade]) {
                                            const found = kanjiData[grade].find(k => k.kanji === kanji);
                                            if (found) {
                                                kanjiInfo = found;
                                                break;
                                            }
                                        }
                                    }

                                    return (
                                        <div key={kanji} className="disabled-kanji-item">
                                            <span className="disabled-kanji-char">{kanji}</span>
                                            {kanjiInfo && (
                                                <span className="disabled-kanji-reading">{kanjiInfo.vietnamese}</span>
                                            )}
                                            <button
                                                className="enable-kanji-btn"
                                                onClick={() => toggleKanjiDisabled(kanji)}
                                            >
                                                Enable
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
