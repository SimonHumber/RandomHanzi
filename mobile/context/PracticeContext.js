import React, { createContext, useState, useContext } from 'react';

// Create the context
const PracticeContext = createContext();

// Provider component
export const PracticeProvider = ({ children }) => {
  const [currentHSKWord, setCurrentHSKWord] = useState(null);
  const [currentTOCFLWord, setCurrentTOCFLWord] = useState(null);
  const [currentKanji, setCurrentKanji] = useState(null);
  const [currentSentence, setCurrentSentence] = useState(null);

  return (
    <PracticeContext.Provider
      value={{
        currentHSKWord,
        setCurrentHSKWord,
        currentTOCFLWord,
        setCurrentTOCFLWord,
        currentKanji,
        setCurrentKanji,
        currentSentence,
        setCurrentSentence,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
};

// Custom hook to use the practice context
export const usePractice = () => {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
};

