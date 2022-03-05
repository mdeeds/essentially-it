import * as THREE from "three";

export class Stroke {
  private static kIdealSize = 16;
  readonly d: THREE.Vector2[] = [];
  private static clockHours = new Map<string, THREE.Vector2>();
  private static hours = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b'];

  static {
    for (let h = 0; h < Stroke.hours.length; ++h) {
      const theta = h * Math.PI * 2 / 12;
      this.clockHours.set(Stroke.hours[h],
        new THREE.Vector2(Math.sin(theta), Math.cos(theta)));
    }
  }
  constructor() { }

  add(xy: THREE.Vector2) {
    const p = new THREE.Vector2();
    p.copy(xy);
    // p.normalize();
    this.d.push(p);
  }

  static fromClock(clockStroke: string): Stroke {
    const result = new Stroke();
    for (const c of clockStroke) {
      result.add(Stroke.clockHours.get(c));
    }
    return result;
  }

  static fromHour(h: number): THREE.Vector2 {
    const theta = h * Math.PI * 2 / 12;
    return new THREE.Vector2(Math.sin(theta), Math.cos(theta));
  }

  static fromHours(hours: number[]): Stroke {
    const result = new Stroke();
    for (const h of hours) {
      result.add(Stroke.fromHour(h));
    }
    return result;
  }

  clear() {
    this.d.splice(0);
  }

  getHoursAtPosition(index: number): number {
    const p = this.d[index];
    const theta = Math.atan2(p.x, p.y);
    let hour = theta / (Math.PI * 2) * 12;
    hour = (hour + 12) % 12;
    return hour;
  }

  private pixelLength() {
    let len = 0;
    for (const s of this.d) {
      len += s.length();
    }
    return len;
  }

  reduce(): Stroke {
    const result = new Stroke();
    const stride = this.pixelLength() / Stroke.kIdealSize;
    let offset = stride / 2;
    let position = 0;
    let sum = new THREE.Vector2();
    for (let index = 0; index < this.d.length; ++index) {
      position += this.d[index].length();
      sum.add(this.d[index]);
      if (position >= offset) {
        result.add(sum);
        offset += stride;
        sum = new THREE.Vector2();
      }
    }
    return result;
  }

  logAsHours() {
    const hoursStrings: string[] = [];
    for (let index = 0; index < this.d.length; ++index) {
      hoursStrings.push(this.getHoursAtPosition(index).toFixed(1));
    }
    console.log(
      `testStroke(Stroke.fromHours([${hoursStrings.join(',')}]), "?");`);
  }

  logAsClock() {
    let result = "";
    for (let index = 0; index < this.d.length; ++index) {
      const h = Math.round(this.getHoursAtPosition(index)) % 12;
      result = result + Stroke.hours[h];
    }
    console.log(result);
  }
}

class Graphito {
  // The vectors should be normalized.
  constructor(private stroke: Stroke,
    readonly glyph: string) {

  }

  private v = new THREE.Vector2();
  // Returns the quality of match of reference vs. query.  Larger numbers
  // indicate better match.
  private score(referenceIndex: number, queryIndex: number,
    stroke: Stroke) {
    const score = this.stroke.d[referenceIndex].dot(stroke.d[queryIndex]);
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
      return -Infinity;
    } else {
      return memo[this.getIndex(referenceIndex, queryIndex)];
    }
  }

  // TODO: For DTW to work well, we need to normalize based on reference
  // stroke length or use an "error" function for the score.
  // Returns the "distance" between the stroke provided and
  // the stroke which represents this glyph.
  dtwMatch(stroke: Stroke): number {
    // Dynamic programming to compute DTW matching.
    const idealScores: number[] = [];
    let lastScore = null;
    const perp = new THREE.Vector2(stroke.d.length, -this.stroke.d.length);
    perp.normalize();
    const position = new THREE.Vector2();
    const slop = Math.min(stroke.d.length, this.stroke.d.length);
    for (let referenceIndex = 0;
      referenceIndex < this.stroke.d.length; ++referenceIndex) {
      for (let queryIndex = 0; queryIndex < stroke.d.length; ++queryIndex) {
        position.set(referenceIndex, queryIndex);
        const distanceFromCenter = Math.abs(position.dot(perp));
        const multiplier = 1 - (distanceFromCenter / slop);
        const newScore = this.score(referenceIndex, queryIndex, stroke)
          * multiplier;
        const previousScore = Math.max(
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
    //   let line = ` [${queryIndex}] ${stroke.getHoursAtPosition(queryIndex).toFixed(1)} : `;
    //   for (let referenceIndex = 0; referenceIndex < this.stroke.d.length; ++referenceIndex) {
    //     line = line + ` ${idealScores[this.getIndex(referenceIndex, queryIndex)].toFixed(2)}`;
    //   }
    //   console.log(line);
    // }

    lastScore = lastScore / Math.max(stroke.d.length, this.stroke.d.length);
    // console.log(`Final: ${lastScore}`);

    return lastScore;
  }

  // Returns the "distance" between the stroke provided and
  // the stroke which represents this glyph.
  lineMatch(stroke: Stroke): number {
    if (stroke.d.length <= 1) {
      return 0;
    }
    let totalScore = 0;
    for (let queryIndex = 0; queryIndex < stroke.d.length; ++queryIndex) {
      const referenceIndex = Math.round(queryIndex *
        (this.stroke.d.length - 1) / (stroke.d.length - 1));
      totalScore += this.score(referenceIndex, queryIndex, stroke);
    }
    return totalScore / Math.max(this.stroke.d.length, stroke.d.length);
  }
}


export class Graphiti {
  private patterns: Graphito[] = [];
  constructor() {
    this.patterns.push(new Graphito(Stroke.fromClock("1111111155555555"), "a"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666000124578479"), "b"));
    this.patterns.push(new Graphito(Stroke.fromClock("9999888776544333"), "c"));
    // this.patterns.push(new Graphito(Stroke.fromClock("6024689"), "d"));  // Palm
    this.patterns.push(new Graphito(Stroke.fromClock("0000012345567788"), "d"));  // Matt
    this.patterns.push(new Graphito(Stroke.fromClock("a998875398764333"), "e"));
    this.patterns.push(new Graphito(Stroke.fromClock("9999996666666666"), "f"));
    this.patterns.push(new Graphito(Stroke.fromClock("9988776543320b33"), "g"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666666621234566"), "h"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666666666666666"), "i"));
    this.patterns.push(new Graphito(Stroke.fromClock("66666666667899ab"), "j"));
    this.patterns.push(new Graphito(Stroke.fromClock("7778899ab1345555"), "k"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666666666633333"), "l"));
    this.patterns.push(new Graphito(Stroke.fromClock("0000025551116666"), "m"));
    this.patterns.push(new Graphito(Stroke.fromClock("0000055555500000"), "n"));
    this.patterns.push(new Graphito(Stroke.fromClock("98766654321000ba"), "o"));
    this.patterns.push(new Graphito(Stroke.fromClock("0000001122335888"), "p"));
    this.patterns.push(new Graphito(Stroke.fromClock("988776432110ba33"), "q"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666700123578554"), "r"));
    this.patterns.push(new Graphito(Stroke.fromClock("a999876545678899"), "s"));
    this.patterns.push(new Graphito(Stroke.fromClock("3333336666666666"), "t"));
    this.patterns.push(new Graphito(Stroke.fromClock("6666655443211100"), "u"));
    // this.patterns.push(new Graphito(Stroke.fromClock("55113"), "v"));  // Palm
    this.patterns.push(new Graphito(Stroke.fromClock("77777777bbbbbbbb"), "v"));  // Matt
    this.patterns.push(new Graphito(Stroke.fromClock("5555511155511100"), "w"));
    this.patterns.push(new Graphito(Stroke.fromClock("55544321a8888888"), "x"));
    this.patterns.push(new Graphito(Stroke.fromClock("65321566779a2333"), "y"));
    this.patterns.push(new Graphito(Stroke.fromClock("3333377777733333"), "z"));
  }

  recognize(stroke: Stroke): string {
    let bestScore = 0;
    let bestMatch = "";
    for (const p of this.patterns) {
      const matchScore = p.dtwMatch(stroke);
      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestMatch = p.glyph;
      }
    }
    return bestMatch;
  }
}