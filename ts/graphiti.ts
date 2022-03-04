import * as THREE from "three";

export class Stroke {
  readonly d: THREE.Vector2[] = [];
  private static clockHours = new Map<string, THREE.Vector2>();
  static {
    const hours = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b'];
    for (let h = 0; h < hours.length; ++h) {
      const theta = h * Math.PI * 2 / 12;
      this.clockHours.set(hours[h],
        new THREE.Vector2(Math.sin(theta), Math.cos(theta)));
    }
  }
  constructor() { }

  add(xy: THREE.Vector2) {
    const p = new THREE.Vector2();
    p.copy(xy);
    p.normalize();
    this.d.push(p);
  }

  static fromClock(clockStroke: string): Stroke {
    const result = new Stroke();
    for (const c of clockStroke) {
      result.add(Stroke.clockHours.get(c));
    }
    return result;
  }
}

class Graphito {
  // The vectors should be normalized.
  constructor(private stroke: Stroke,
    readonly glyph: string) {

  }

  private v = new THREE.Vector2();
  // Returns the quality of match of reference vs. query.  Larger numbers
  // indicate higher error. The vectors in the stroke should be normalized.
  private score(referenceIndex: number, queryIndex: number,
    stroke: Stroke) {
    return 1 - this.stroke.d[referenceIndex].dot(stroke.d[queryIndex]);
  }

  private getIndex(referenceIndex: number, queryIndex: number): number {
    return referenceIndex * this.stroke.d.length + queryIndex;
  }

  private getMemoScore(referenceIndex: number, queryIndex: number, memo: number[]) {
    if (referenceIndex < 0 && queryIndex < 0) {
      return 0;
    } else if (referenceIndex < 0 || queryIndex < 0) {
      return Infinity;
    } else {
      return memo[this.getIndex(referenceIndex, queryIndex)];
    }
  }

  // Returns the "distance" between the stroke provided and
  // the stroke which represents this glyph.
  match(stroke: Stroke): number {
    // Dynamic programming to compute DTW matching.
    const idealScores: number[] = [];
    let lastScore = null;
    for (let referenceIndex = 0;
      referenceIndex < this.stroke.d.length; ++referenceIndex) {
      for (let queryIndex = 0; queryIndex < stroke.d.length; ++queryIndex) {
        const newScore = this.score(referenceIndex, queryIndex, stroke);
        const previousScore = Math.min(
          this.getMemoScore(referenceIndex - 1, queryIndex, idealScores),
          this.getMemoScore(referenceIndex, queryIndex - 1, idealScores),
          this.getMemoScore(referenceIndex - 1, queryIndex - 1, idealScores));
        const index = this.getIndex(referenceIndex, queryIndex);
        lastScore = newScore + previousScore;
        idealScores[index] = lastScore;
      }
    }
    return lastScore;
  }
}

export class Graphiti {
  private patterns: Graphito[] = [];
  constructor() {
    this.patterns.push(new Graphito(Stroke.fromClock("15"), "a"));
    this.patterns.push(new Graphito(Stroke.fromClock("604848"), "b"));
    this.patterns.push(new Graphito(Stroke.fromClock("a8642"), "c"));
    this.patterns.push(new Graphito(Stroke.fromClock("36"), "t"));
  }

  recognize(stroke: Stroke): string {
    let bestScore = Infinity;
    let bestMatch = "";
    for (const p of this.patterns) {
      const matchScore = p.match(stroke);
      if (matchScore < bestScore) {
        bestScore = matchScore;
        bestMatch = p.glyph;
      }
    }
    return bestMatch;
  }
}