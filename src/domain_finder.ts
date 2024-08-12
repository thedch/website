export class DomainFinder {
    private uniqueWords: Set<string> = new Set();
    private input: HTMLInputElement | null = null;
    private wordList: HTMLUListElement | null = null;
    private tldCountElement: HTMLDivElement | null = null;
    private tlds: string[] = [];

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
          // li.textContent = word;

          const wordSpan = document.createElement('span');
          wordSpan.textContent = word;

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.className = 'delete-btn ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs';
          deleteButton.addEventListener('click', () => this.deleteWord(word, li));

          const matchingTLD = this.tlds.find(tld => word.endsWith(tld));
          if (matchingTLD) {
            wordSpan.textContent += ` (.${matchingTLD})`;
          }

          li.appendChild(wordSpan);
          li.appendChild(deleteButton);
          this.wordList.appendChild(li);
        }
      });

      this.input.value = '';
    }

    private deleteWord(word: string, listItem: HTMLLIElement): void {
      this.uniqueWords.delete(word);
      listItem.remove();
    }
  }