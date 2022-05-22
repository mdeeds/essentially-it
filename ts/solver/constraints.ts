import { DepthFormat } from "three";

export type Variable = number;

export class Domain {
  private possibilities: Uint8Array;
  private assignedValue: number;
  private remainingCount: number;

  private constructor() {
  }

  *remainingValues(): Iterable<number> {
    for (let i = 0; i < this.possibilities.length; ++i) {
      if (this.possibilities[i]) {
        yield i;
      }
    }
  }

  remove(v: number) {
    if (!this.possibilities[v]) {
      throw new Error("Tried to remove something twice!?");
    }
    --this.remainingCount;
    this.possibilities[v] = 0;
    if (this.remainingCount === 1) {
      for (let i = 0; i < this.possibilities.length; ++i) {
        if (this.possibilities[i] > 0) {
          this.assignedValue = i;
          break;
        }
      }
    }
  }

  remainingSize(): number {
    return this.remainingCount;
  }

  getAssignedValue(): number {
    if (this.remainingCount != 1) {
      throw new Error("Value is not known!");
    }
    return this.assignedValue;
  }

  static anything(size: number): Domain {
    if (size <= 1) {
      throw new Error("Domains must have at least two values.");
    }
    const result = new Domain();
    result.possibilities = new Uint8Array(size);
    result.remainingCount = size;
    result.assignedValue = undefined;
    for (let i = 0; i < result.possibilities.length; ++i) {
      result.possibilities[i] = 1;
    }
    return result;
  }

  static assigned(value: number): Domain {
    const result = new Domain();
    result.possibilities = null;
    result.remainingCount = 1;
    result.assignedValue = value;
    return result;
  }
}

export interface Constraint {
  readonly variables: Variable[];
  isSatisfied(p: PartialAssignment): boolean;
}

export class ConstraintOnArray {
  constructor(readonly variables: Variable[],
    private constraintFunction: ((values: number[]) => boolean)) {
  }

  isSatisfied(p: PartialAssignment) {
    const values = [];
    for (const v of this.variables) {
      values.push(p.getValue(v));
    }
    return this.constraintFunction(values);
  }
}

export class PartialAssignment {
  private parent: PartialAssignment = null;
  private overwriteIndex: Variable = null;
  private overwriteValue: Domain = null;
  constructor(readonly size: number) {
  }
  // Returns the value of X_i, or undefined if it is not assigned.
  getValue(i: number): number {
    let cursor: PartialAssignment = this;
    while (cursor !== null) {
      if (cursor.overwriteIndex == i) {
        if (cursor.overwriteValue.remainingSize() === 1) {
          return cursor.overwriteValue.getAssignedValue();
        } else {
          return undefined;
        }
      }
      cursor = cursor.parent;
    }
    return undefined;
  }

  getDomain(i: number): Domain {
    let cursor: PartialAssignment = this;
    while (cursor !== null) {
      if (cursor.overwriteIndex == i) {
        return cursor.overwriteValue;
      }
      cursor = cursor.parent;
    }
    return undefined;
  }

  overwrite(i: Variable, v: number): PartialAssignment {
    const result = new PartialAssignment(this.size);
    result.parent = this;
    result.overwriteIndex = i;
    result.overwriteValue = Domain.assigned(v);
    return result;
  }

  toArray(out: number[]) {
    if (out.length != this.size) {
      throw new Error("Wrong size!");
    }
    for (let i = 0; i < this.size; ++i) {
      out[i] = this.getValue(i);
    }
  }

  toString() {
    const a = [];
    a.length = this.size;
    this.toArray(a);
    return `${JSON.stringify(a)}`;
  }
}

export class BackProp {
  private constraints: Constraint[] = [];
  private solutions: PartialAssignment[] = [];

  constructor(private variables: Domain[]) { }

  addConstraint(c: Constraint) {
    this.constraints.push(c);
  }

  getDomain(i: Variable, pa: PartialAssignment) {
    const assignment = pa.getDomain(i);
    if (assignment === undefined) {
      return this.variables[i];
    } else {
      return assignment;
    }
  }

  private sweep(i: Variable, assignedSoFar: PartialAssignment) {
    if (i === this.variables.length) {
      console.log(`${assignedSoFar.toString()} SOLUTION!`);
      this.solutions.push(assignedSoFar);
      return;
    }
    for (const v of this.variables[i].remainingValues()) {
      const newAssignment = assignedSoFar.overwrite(i, v);
      let satisfied = true;
      for (const c of this.constraints) {
        let finishedThisConstraint = false;
        for (const dependant of c.variables) {
          if (this.getDomain(dependant, newAssignment).remainingSize() > 1) {
            // One of the dependent variables is unknown
            // so we can't evaluate this constraint.
            finishedThisConstraint = true;
            break;
          }
        }
        if (finishedThisConstraint) {
          continue;
        }
        // All dependent variables are assigned.
        const satisfaction = c.isSatisfied(newAssignment);
        satisfied &&= satisfaction;
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