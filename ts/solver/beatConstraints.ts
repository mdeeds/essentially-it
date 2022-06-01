import { BackProp, Constraint, ConstraintOnArray, Domain } from "./constraints";


export class VariableSlice {
  constructor(readonly allVariables: Domain[],
    readonly start: number, readonly count: number) { }

  get(i: number): Domain {
    if (i >= this.count) {
      throw new Error("Index out of range.");
    }
    return this.allVariables[this.start + i];
  }

  getIndex(i: number) {
    return i + this.start;
  }

  static append(existing: Domain[], size: number, count: number) {
    const start = existing.length;
    for (let i = 0; i < count; ++i) {
      existing.push(Domain.anything(size));
    }
    return new VariableSlice(existing, start, count);
  }
}

class MinMaxRange {
  private min: number[] = [];
  private max: number[] = [];
  constructor(size: number) {
    this.min.length = size;
    this.max.length = size;
  }

  public set(i: number, min: number, max: number) {
    this.min[i] = min;
    this.max[i] = max;
  }

  public off(i: number) {
    this.min[i] = 0;
    this.max[i] = 0;
  }

  public *makeConstraints(slice: VariableSlice): Iterable<Constraint> {
    for (let i = 0; i < this.min.length; ++i) {
      if (this.min[i] !== undefined && this.max[i] != undefined) {
        if (this.min[i] == this.max[i]) {
          yield new ConstraintOnArray([slice.getIndex(i)],
            function (must: number) {
              return function (values: number[]) {
                return values[0] === must;
              }
            }(this.min[i]));
        } else {
          yield new ConstraintOnArray([slice.getIndex(i)],
            function (min: number, max: number) {
              return function (values: number[]) {
                return values[0] >= min && values[0] <= max;
              }
            }(this.min[i], this.max[i]));
        }
      }
    }
  }
}

export class BeatConstraints {
  private allVariables: Domain[] = [];
  private bp: BackProp;
  constructor() {
    const bdVariables = this.makeBassDrumVariables();
    // const sdVariables = this.makeSnareDrumVariables();

    this.bp = new BackProp(this.allVariables, 1e12);

    this.bp.addConstraints(this.makeBassDrumConstraints(bdVariables));
  }

  run() {
    this.bp.runBTFS();
    this.bp.printSolutions();
  }

  // Four bar Trap:

  // Closed High Hat (HH)
  // Every eighth note, except for ~four stutters
  // Stutters occur on *.1 or *.4 beats.

  // Open Hat
  // 1.3, 3.2

  // Bass Drum
  // 1.1, 2.2, 3.1, 4.2, 4.3
  // Emphasis on 1.1, 3.1

  // Snare
  // V1: *.3
  // Plus 1/8 before the off-beat Bass Drum


  // Clap
  // *.3

  // Melody 1
  // Bass: Sustained note 4 bars
  // Bell: Quarter notes firma
  // Bell2: *.234 melody


  // Melody 2
  // Some implied, fixed bass
  // 124.12 are identical, 4.34 are higher

  // Bass drum:
  // 0: off, 1: hit, 2: emphasized hit
  private makeBassDrumVariables(): VariableSlice {
    return VariableSlice.append(this.allVariables, 3, 4 * 8);
  }

  private *makeBassDrumConstraints(bd: VariableSlice): Iterable<Constraint> {
    //           1111111111222222222233
    // 01234567890123456789012345678901
    // |       |       |       |       |  // Measures
    // 1 2 3 4 1 2 3 4 1 2 3 4 1 2 3 4 1  // Beats 

    const offBeats: number[] = [];
    const backBeats: number[] = [];

    const mmr = new MinMaxRange(bd.count);
    for (let i = 0; i < 32; ++i) {
      switch (i % 8) {
        case 1: case 3: case 5: case 7:
          // No 'and' beats
          mmr.off(i);
          break;
        case 2: case 6:
          // 'off' beats are okay.
          offBeats.push(bd.getIndex(i));
          mmr.set(i, 0, 1);
          break;
        case 4:
          // 'back' beats are okay.
          backBeats.push(bd.getIndex(i));
          mmr.set(i, 0, 1);
          mmr.set(i, 0, 1);
          break;
      }
    }

    mmr.set(0, 2, 2);  // 1.1
    mmr.off(8);        // 2.1
    mmr.set(16, 2, 2); // 3.1
    mmr.off(24);       // 4.1

    mmr.set(28, 1, 1);  // 4.3

    yield* mmr.makeConstraints(bd);

    yield new ConstraintOnArray([...offBeats, ...backBeats],
      (values: number[]) => {
        let total = 0;
        for (const v of values) {
          total += v;
        }
        return total < 5;
      });
    yield new ConstraintOnArray(offBeats,
      (values: number[]) => {
        let leftTotal = 0;
        let rightTotal = 0;
        const halfWidth = values.length / 2;
        for (let i = 0; i < halfWidth; ++i) {
          leftTotal += values[i];
          rightTotal += values[i + halfWidth];
        }
        return rightTotal > leftTotal;
      });
  }

  // Snare drum:
  // 0: off, 1: hit, 2: emphasized hit (e.g. with clap)
  private makeSnareDrumVariables(): VariableSlice {
    return VariableSlice.append(this.allVariables, 3, 4 * 8);
  }



}