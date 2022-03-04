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

  static fromHours(hours: number[]): Stroke {
    const result = new Stroke();
    for (const h of hours) {
      const theta = h * Math.PI * 2 / 12;
      result.add(new THREE.Vector2(Math.sin(theta), Math.cos(theta)));
    }
    return result;
  }

  clear() {
    this.d.splice(0);
  }

  getHoursAtPosition(index: number): string {
    const p = this.d[index];
    const theta = Math.atan2(p.x, p.y);
    let hour = theta / (Math.PI * 2) * 12;
    hour = (hour + 12) % 12;
    return hour.toFixed(1);
  }

  logAsHours() {
    const hoursStrings: string[] = [];
    for (let index = 0; index < this.d.length; ++index) {
      hoursStrings.push(this.getHoursAtPosition(index));
    }

    console.log(
      `testStroke(Stroke.fromHours([${hoursStrings.join(',')}]), "?");`);
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
    const score = 1 - this.stroke.d[referenceIndex].dot(stroke.d[queryIndex]);
    // console.log(`Score @[${referenceIndex}, ${queryIndex}] = ${score}`);
    return score;
  }

  private getIndex(referenceIndex: number, queryIndex: number): number {
    return queryIndex * this.stroke.d.length + referenceIndex;
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
        // console.log(`Ideal @[${referenceIndex}, ${queryIndex}] = ${lastScore}`);
        idealScores[index] = lastScore;
      }
    }

    // console.log(`Match matrix [${this.glyph}]`);
    // for (let queryIndex = 0; queryIndex < stroke.d.length; ++queryIndex) {
    //   let line = ` [${queryIndex}] ${stroke.getHoursAtPosition(queryIndex)} : `;
    //   for (let referenceIndex = 0; referenceIndex < this.stroke.d.length; ++referenceIndex) {
    //     line = line + ` ${idealScores[this.getIndex(referenceIndex, queryIndex)].toFixed(2)}`;
    //   }
    //   console.log(line);
    // }
    // console.log(`Final: ${lastScore}`);

    return lastScore;
  }
}

export class Graphiti {
  private patterns: Graphito[] = [];
  constructor() {
    this.patterns.push(new Graphito(Stroke.fromClock("15"), "a"));
    this.patterns.push(new Graphito(Stroke.fromClock("604848"), "b"));
    this.patterns.push(new Graphito(Stroke.fromClock("ba98765432"), "c"));
    // this.patterns.push(new Graphito(Stroke.fromClock("6024689"), "d"));  // Palm
    this.patterns.push(new Graphito(Stroke.fromClock("03456789"), "d"));  // Matt
    this.patterns.push(new Graphito(Stroke.fromClock("963963"), "e"));
    this.patterns.push(new Graphito(Stroke.fromClock("96"), "f"));
    this.patterns.push(new Graphito(Stroke.fromClock("963093"), "g"));
    this.patterns.push(new Graphito(Stroke.fromClock("6660123456"), "h"));
    this.patterns.push(new Graphito(Stroke.fromClock("6"), "i"));
    this.patterns.push(new Graphito(Stroke.fromClock("69"), "j"));
    this.patterns.push(new Graphito(Stroke.fromClock("804"), "k"));
    this.patterns.push(new Graphito(Stroke.fromClock("63"), "l"));
    this.patterns.push(new Graphito(Stroke.fromClock("1515"), "m"));
    this.patterns.push(new Graphito(Stroke.fromClock("050"), "n"));
    this.patterns.push(new Graphito(Stroke.fromClock("9876543210ba"), "o"));
    this.patterns.push(new Graphito(Stroke.fromClock("60369"), "p"));
    this.patterns.push(new Graphito(Stroke.fromClock("9876543210ba3"), "q"));
    this.patterns.push(new Graphito(Stroke.fromClock("603685"), "r"));
    this.patterns.push(new Graphito(Stroke.fromClock("96469"), "s"));
    this.patterns.push(new Graphito(Stroke.fromClock("3366"), "t"));
    this.patterns.push(new Graphito(Stroke.fromClock("6543210"), "u"));
    this.patterns.push(new Graphito(Stroke.fromClock("513"), "v"));  // Palm
    this.patterns.push(new Graphito(Stroke.fromClock("7b"), "v"));  // Matt
    this.patterns.push(new Graphito(Stroke.fromClock("5151"), "w"));
    this.patterns.push(new Graphito(Stroke.fromClock("408"), "x"));
    this.patterns.push(new Graphito(Stroke.fromClock("630602"), "y"));
    this.patterns.push(new Graphito(Stroke.fromClock("373"), "z"));
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