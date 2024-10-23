import React, { useState } from 'react';

import { pipeline, cos_sim } from '@xenova/transformers';

const KnowledgeBase: React.FC = () => {
  const [inputText1, setInputText1] = useState('');
  const [inputText2, setInputText2] = useState('');
  const [outputText, setOutputText] = useState('');

  const handleInputChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText1(e.target.value);
  };

  const handleInputChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText2(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputText1 && inputText2) {
      try {
        const loadedPipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const embedding1 = await loadedPipe(inputText1, { pooling: 'cls' });
        const embedding2 = await loadedPipe(inputText2, { pooling: 'cls' });

        const similarity = cos_sim(Array.from(embedding1.data), Array.from(embedding2.data));
        setOutputText(`Cosine similarity: ${similarity.toFixed(4)}`);
      } catch (error) {
        console.error('Error during embedding computation:', error);
        setOutputText('An error occurred during analysis.');
      }
    } else {
      setOutputText('Please enter text in both input fields.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Knowledge Base Embeddings</h2>
      <input
        type="text"
        value={inputText1}
        onChange={handleInputChange1}
        className="border p-2 mb-2 w-full"
        placeholder="Enter first text"
      />
      <input
        type="text"
        value={inputText2}
        onChange={handleInputChange2}
        className="border p-2 mb-2 w-full"
        placeholder="Enter second text"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Compute Similarity
      </button>
      <p className="mt-4">{outputText}</p>
    </div>
  );
};

export default KnowledgeBase;
