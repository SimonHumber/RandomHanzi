import React from 'react';
import './App.css';

function Navbar({ currentPage, onNavigate }) {
    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-brand">
                    <h2>Kanji Viet</h2>
                </div>
                <div className="nav-buttons">
                    <button
                        className={`nav-btn ${currentPage === 'kanji' ? 'active' : ''}`}
                        onClick={() => onNavigate('kanji')}
                    >
                        Kanji Generator
                    </button>
                    <button
                        className={`nav-btn ${currentPage === 'hsk' ? 'active' : ''}`}
                        onClick={() => onNavigate('hsk')}
                    >
                        HSK Level 1
                    </button>
                    <button
                        className={`nav-btn ${currentPage === 'tocfl' ? 'active' : ''}`}
                        onClick={() => onNavigate('tocfl')}
                    >
                        TOCFL Level 1
                    </button>
                    <button
                        className={`nav-btn ${currentPage === 'list' ? 'active' : ''}`}
                        onClick={() => onNavigate('list')}
                    >
                        Character List
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

