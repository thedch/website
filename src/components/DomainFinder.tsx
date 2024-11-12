import React, { useState, useEffect, useCallback } from 'react';

const useTLDs = () => {
  const [tlds, setTLDs] = useState<string[]>([]);

  useEffect(() => {
    const loadTLDs = async () => {
      try {
        const response = await fetch('/tlds.txt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setTLDs(text.toLowerCase().split('\n').map(tld => tld.trim()));
      } catch (error) {
        console.error('Error loading TLDs:', error);
      }
    };

    loadTLDs();
  }, []);

  return tlds;
};

const DomainFinderComponent: React.FC = () => {
  const [uniqueWords, setUniqueWords] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const tlds = useTLDs();

  const [counterKey, setCounterKey] = useState('');
  const [counterValue, setCounterValue] = useState('');
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addWord = useCallback(() => {
    const words = inputValue.trim().toLowerCase().split(/\s+/);
    setUniqueWords(prevWords => {
      const newWords = new Set(prevWords);
      words.forEach(word => {
        if (word) newWords.add(word);
      });
      return newWords;
    });
    setInputValue('');
  }, [inputValue]);

  const deleteWord = useCallback((wordToDelete: string) => {
    setUniqueWords(prevWords => {
      const newWords = new Set(prevWords);
      newWords.delete(wordToDelete);
      return newWords;
    });
  }, []);

  const buyDomain = useCallback((word: string, tld: string) => {
    const wordWithoutTLD = word.replace(`${tld}`, '');
    const url = `https://www.namecheap.com/domains/registration/results/?domain=${wordWithoutTLD}.${tld}`;
    window.open(url, '_blank');
  }, []);

  const getCounter = useCallback(async () => {
    try {
      const response = await fetch(`/kv?key=${encodeURIComponent(counterKey)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSavedValue(data.value);
      setError(null);
    } catch (error) {
      console.error('Error fetching counter value:', error);
      setError('Failed to fetch counter value');
    }
  }, [counterKey]);

  const setCounter = useCallback(async () => {
    try {
      const response = await fetch('/kv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: counterKey, value: counterValue }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await getCounter();
      setError(null);
    } catch (error) {
      console.error('Error setting counter value:', error);
      setError('Failed to set counter value');
    }
  }, [counterKey, counterValue, getCounter]);

  return (
    <div className="domain-finder-container">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && addWord()}
        placeholder="Enter words for domain ideas..."
        className="w-full p-2 border border-gray-300 rounded"
      />
      <div className="mt-2 text-sm text-gray-600">
        Loaded {tlds.length} TLDs.
      </div>
      <button
        onClick={addWord}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Word
      </button>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Words + TLDs:</h3>
        <ul className="list-disc pl-5">
          {Array.from(uniqueWords).map(word => {
            const matchingTLD = tlds.find(tld => word.endsWith(tld));
            return (
              <li key={word} className="mb-2 flex items-center justify-between">
                <span className="mr-auto flex items-center">
                  <span className="w-2 h-2 bg-black rounded-full mr-2 inline-block"></span>
                  {word}{matchingTLD && ` (.${matchingTLD})`}
                </span>
                <div className="flex ml-4">
                  {matchingTLD ? (
                    <button
                      onClick={() => buyDomain(word, matchingTLD)}
                      className="buy-btn ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                    >
                      Buy
                    </button>
                  ) : (
                    <button
                      disabled
                      className="buy-btn ml-2 px-2 py-1 bg-gray-300 text-gray-500 rounded text-xs cursor-not-allowed"
                    >
                      No TLD found
                    </button>
                  )}
                  <button
                    onClick={() => deleteWord(word)}
                    className="delete-btn ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Dynamic Counter</h3>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={counterKey}
            onChange={(e) => setCounterKey(e.target.value)}
            placeholder="Enter counter key"
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            value={counterValue}
            onChange={(e) => setCounterValue(e.target.value)}
            placeholder="Enter counter value"
            className="flex-grow p-2 border border-gray-300 rounded"
          />
          <button
            onClick={setCounter}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set
          </button>
          <button
            onClick={getCounter}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Get
          </button>
        </div>
        {savedValue !== null && (
          <div className="mt-2 text-sm text-gray-600">
            Saved value for key "{counterKey}": {savedValue}
          </div>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainFinderComponent;
