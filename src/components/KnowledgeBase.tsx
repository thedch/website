import React, { useState, useEffect, useCallback } from 'react';

import { pipeline, Pipeline } from '@xenova/transformers';

const KnowledgeBase: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
//   const [pipe, setPipe] = useState<any | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputText) {
      try {
        console.log('Input text is ', inputText);
        const loadedPipe = await pipeline('sentiment-analysis');
        const result = await loadedPipe(inputText);
        console.log(result);
        setOutputText(`${inputText} -> ${result[0].label} (${result[0].score.toFixed(4)})`);
      } catch (error) {
        console.error('Error during sentiment analysis:', error);
        setOutputText('An error occurred during analysis.');
      }
    } else {
      setOutputText('No model loaded or input text empty.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Knowledge Base Embeddings</h2>
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        className="border p-2 mb-2 w-full"
        placeholder="Enter text for sentiment analysis"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Analyze
      </button>
      <p className="mt-4">{outputText}</p>
    </div>
  );
};

export default KnowledgeBase;
