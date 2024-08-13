import React, { useEffect, useRef } from 'react';
// import { DomainFinder } from "@/domain_finder";

class DomainFinder {
  uniqueWords: Set<string> = new Set();
  input: HTMLInputElement | null = null;
  wordList: HTMLUListElement | null = null;
  tldCountElement: HTMLDivElement | null = null;
  tlds: string[] = [];

  constructor() {
    this.initializeElements();
    this.addEventListeners();
    this.loadTLDs();
  }

  private initializeElements(): void {
    this.input = document.getElementById('domain-input') as HTMLInputElement;
    this.wordList = document.getElementById('unique-words') as HTMLUListElement;
    this.tldCountElement = document.getElementById('tld-count') as HTMLDivElement;
  }

  private addEventListeners(): void {
    const addButton = document.getElementById('add-word-btn');
    addButton?.addEventListener('click', () => this.addWord());
    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addWord();
      }
    });
  }

  private async loadTLDs(): Promise<void> {
    try {
      const response = await fetch('/tlds.txt');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      this.tlds = text.toLowerCase().split('\n').map(tld => tld.trim());
      this.updateTLDCount();
    } catch (error) {
      console.error('Error loading TLDs:', error);
    }
  }

  private updateTLDCount(): void {
    if (this.tldCountElement) {
      this.tldCountElement.textContent = `Loaded ${this.tlds.length} TLDs.`;
    }
  }

  private addWord(): void {
    if (!this.input || !this.wordList) return;

    const inputValue = this.input.value.trim().toLowerCase();
    const words = inputValue.split(/\s+/);

    words.forEach(word => {
      if (word && !this.uniqueWords.has(word) && this.wordList) {
        this.uniqueWords.add(word);
        const li = document.createElement('li');

        const wordSpan = document.createElement('span');
        wordSpan.textContent = word;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs';
        deleteButton.addEventListener('click', () => this.deleteWord(word, li));

        const matchingTLD = this.tlds.find(tld => word.endsWith(tld));
        let buyButton: HTMLButtonElement | null = null;
        if (matchingTLD) {
          buyButton = document.createElement('button');
          buyButton.textContent = 'Buy';
          buyButton.className = 'buy-btn ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs';
          buyButton.addEventListener('click', () => this.buyDomain(word, matchingTLD));

          wordSpan.textContent += ` (.${matchingTLD})`;
        }

        li.appendChild(wordSpan);
        li.appendChild(deleteButton);
        if (buyButton) {
          li.appendChild(buyButton);
        }
        this.wordList.appendChild(li);
      }
    });

    this.input.value = '';
  }

  private buyDomain(word: string, tld: string): void {
    // Remove the tld from the word:
    const wordWithoutTLD = word.replace(`${tld}`, '');
    const url = `https://www.namecheap.com/domains/registration/results/?domain=${wordWithoutTLD}.${tld}`;
    window.open(url, '_blank');
  }

  private deleteWord(word: string, listItem: HTMLLIElement): void {
    this.uniqueWords.delete(word);
    listItem.remove();
  }
}

const DomainFinderComponent = () => {
  const domainFinderRef = useRef<DomainFinder | null>(null);

  useEffect(() => {
    if (!domainFinderRef.current) {
      domainFinderRef.current = new DomainFinder();
    }
  }, []);

  return (
    <div className="domain-finder-container">
      <input
        type="text"
        id="domain-input"
        placeholder="Enter words for domain ideas..."
        className="w-full p-2 border border-gray-300 rounded"
      />
      <div id="tld-count" className="mt-2 text-sm text-gray-600"></div>
      <button
        id="add-word-btn"
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Word
      </button>
      <div id="word-list" className="mt-4">
        <h3 className="text-lg font-semibold">Words + TLDs:</h3>
        <ul id="unique-words" className="list-disc pl-5"></ul>
      </div>
    </div>
  );
};

export default DomainFinderComponent;