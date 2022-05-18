
export class Domain {
  private possibilities = new Uint8Array(6);
  static anything(): Domain {
    const result = new Domain();
    for (let i = 0; i < result.possibilities.length; ++i) {
      result.possibilities[i] = 1;
    }
    return result;
  }
  static nothing(): Domain {
    const result = new Domain();
    for (let i = 0; i < result.possibilities.length; ++i) {
      result.possibilities[i] = 0;
    }
    return result;
  }
}


export class C {
  static count(a: number[]): number {
    let c = 0;
    for (const f of a) {
      if (f > 0) {
        ++c;
      }
    }
    return c;
  }

  static xor(a: number[], b: number[], out: number[]) {
    if (a.length != b.length || a.length != out.length) {
      throw new Error('Mismatched lengths');
    }
    for (let i = 0; i < a.length; ++i) {
      out[i] = (a[i] > 0) !== (b[i] > 0) ? 1.0 : 0.0;
    }
  }
}

export class PartialAssignment {
  private parent: PartialAssignment = null;
  private overwriteIndex: number = null;
  private overwriteValue: number = null;
  constructor(private size: number) {
  }
  // Returns the value of X_i, or null if it is not assigned.
  get(i: number): number {
    let cursor: PartialAssignment = this;
    while (cursor !== null) {
      if (cursor.overwriteIndex == i) {
        return cursor.overwriteValue;
      }
      cursor = cursor.parent;
    }
    return null;
  }

  overwrite(i: number, v: number): PartialAssignment {
    const result = new PartialAssignment(this.size);
    result.parent = this;
    result.overwriteIndex = i;
    result.overwriteValue = v;
    return result;
  }

  toArray(out: Uint8Array) {
    if (out.length != this.size) {
      throw new Error("Wrong size!");
    }
    for (let i = 0; i < this.size; ++i) {
      out[i] = this.get(i);
    }
  }
}

export type Constraint = (p: PartialAssignment) => boolean;

export class BackProp {
  private constraints: Constraint[] = [];
  private solutions: PartialAssignment[] = [];

  constructor(private variables: Domain[]) { }

  addConstraint(c: Constraint) {
    this.constraints.push(c);
  }

  private sweep(i: number, assignedSoFar: PartialAssignment) {
    if (i >= this.variables.length) {
      this.solutions.push(assignedSoFar);
      return;
    }
    for (let v = 0; v <= 5; ++v) {
      const newAssignment = assignedSoFar.overwrite(i, v);
      let satisfied = true;
      for (const c of this.constraints) {
        satisfied &&= c(newAssignment);
        if (!satisfied) break;
      }
      if (satisfied) {
        this.sweep(i + 1, newAssignment);
      }
    }
  }

  run() {
    const pa = new PartialAssignment(this.variables.length);
    this.sweep(0, pa);
    console.log(`Found ${this.solutions.length} solutions.`);
  }
}