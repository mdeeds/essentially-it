import { workerData } from "worker_threads";
import { Words } from "./words";

class WordAndScore {
  constructor(readonly word: string, readonly score: number[]) { }
}

export class HardWordle {
  private textBox: HTMLTextAreaElement;

  private ws: WordAndScore[] = [];

  constructor() {
    this.textBox = document.createElement('textarea');
    document.body.appendChild(this.textBox);

    const button = document.createElement('div');
    button.innerText = 'go';
    document.body.appendChild(button);
    button.addEventListener('click', () => {
      this.testWord();
    })
  }

  boxWord(word: string, score: number[]) {
    const div = document.createElement('div');

    for (let i = 0; i < 5; ++i) {
      const c = word[i];
      const span = document.createElement('span');
      span.style.width = '20px';
      span.style.height = '20px';
      span.style.border = '1px solid black';
      span.style.padding = '2px';
      span.style.margin = '2px';
      switch (score[i]) {
        case 0: span.style.background = '#aaa'; break;
        case 1: span.style.background = '#ee4'; break;
        case 2: span.style.background = '#4f4'; break;
      }

      span.innerText = c;
      div.style.margin = '10px';
      div.appendChild(span);
    }
    document.body.appendChild(div);
  }

  testWord() {
    const query = this.textBox.value;
    console.log(`query ${query}`);

    let bestScore: number[] = [];
    let bestRemaining: string[] = null;

    let filteredWords = Words.list;
    for (const ws of this.ws) {
      filteredWords = this.matchingWords(ws.word, ws.score, filteredWords);
    }

    for (const answer of filteredWords) {
      const score = this.scoreWords(query, answer);
      const remaining = this.matchingWords(query, score, filteredWords);
      if (bestRemaining === null || bestRemaining.length < remaining.length) {
        bestRemaining = remaining;
        bestScore = score;
      }
    }
    this.ws.push(new WordAndScore(query, bestScore));

    this.boxWord(this.textBox.value, bestScore);
    this.textBox.value = bestRemaining.join(' ');
  }

  scoreWords(query: string, answer: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < 5; ++i) {
      if (query[i] == answer[i]) {
        result[i] = 2;
      } else if (answer.indexOf(query[i]) >= 0) {
        result[i] = 1;
      } else {
        result[i] = 0;
      }
    }
    return result;
  }

  matchingWords(query: string, score: number[], remainingWords: string[]): string[] {
    let result: string[] = [];
    for (const answer of remainingWords) {
      let match = true;
      for (let i = 0; i < 5; ++i) {
        switch (score[i]) {
          case 2:
            if (query[i] != answer[i]) {
              match = false;
            }
            break;
          case 1:
            if (answer.indexOf(query[i]) < 0) {
              match = false;
            }
            if (query[i] == answer[i]) {
              match = false;
            }
            break;
          case 0:
            if (answer.indexOf(query[i]) >= 0) {
              match = false;
            }
        }
      }
      if (match) {
        result.push(answer);
      }
    }
    return result;
  }

}