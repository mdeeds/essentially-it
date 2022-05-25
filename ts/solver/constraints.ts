import { DepthFormat } from "three";

export type Variable = number;

export class Domain {
  private possibilities: Uint8Array;
  private assignedValue: number;
  private remainingCount: number;

  private constructor() {
  }

  *remainingValues(): Iterable<number> {
    if (this.remainingCount === 1) {
      yield this.assignedValue;
    } else {
      for (let i = 0; i < this.possibilities.length; ++i) {
        if (this.possibilities[i]) {
          yield i;
        }
      }
    }
  }

  remove(v: number): Domain {
    if (!this.possibilities[v]) {
      throw new Error("Tried to remove something twice!?");
    }
    const result = new Domain();
    result.possibilities = new Uint8Array(this.possibilities);
    result.possibilities[v] = 0;
    result.remainingCount = this.remainingCount - 1;
    if (result.remainingCount === 1) {
      for (let i = 0; i < result.possibilities.length; ++i) {
        if (result.possibilities[i] > 0) {
          result.assignedValue = i;
          break;
        }
      }
    }
    return result;
  }

  size(): number {
    return this.possibilities.length;
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

  getDomain(i: number, size: number): Domain {
    let cursor: PartialAssignment = this;
    while (cursor !== null) {
      if (cursor.overwriteIndex == i) {
        return cursor.overwriteValue;
      }
      cursor = cursor.parent;
    }
    return Domain.anything(size);
  }

  overwrite(i: Variable, v: number): PartialAssignment {
    const result = new PartialAssignment(this.size);
    result.parent = this;
    result.overwriteIndex = i;
    result.overwriteValue = Domain.assigned(v);
    return result;
  }

  remove(i: Variable, v: number, size: number): PartialAssignment {
    // console.log(`Remove ${v} from X_${i}`);
    const result = new PartialAssignment(this.size);
    result.parent = this;
    result.overwriteIndex = i;
    result.overwriteValue = this.getDomain(i, size).remove(v);
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

  private variableToConstraint = new Map<Variable, Constraint[]>();

  constructor(private variables: Domain[], private maxSolutions: number) {
    for (let v = 0; v < variables.length; ++v) {
      this.variableToConstraint.set(v, []);
    }
  }

  addConstraint(c: Constraint) {
    this.constraints.push(c);
    for (const v of c.variables) {
      this.variableToConstraint.get(v).push(c);
    }
  }

  getDomain(i: Variable, pa: PartialAssignment, size: number) {
    const assignment = pa.getDomain(i, size);
    if (assignment === undefined) {
      return this.variables[i];
    } else {
      return assignment;
    }
  }

  // TODO: require a list of newly set variables.  I.e. the ones
  // that have been set since last successful check.

  // Returns true if none of the constraints fail.
  private checkConstraints(pa: PartialAssignment): boolean {
    let satisfied = true;
    for (const c of this.constraints) {
      let finishedThisConstraint = false;
      for (const dependant of c.variables) {
        if (this.getDomain(dependant, pa,
          this.variables[dependant].size()).remainingSize() > 1) {
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
      const satisfaction = c.isSatisfied(pa);
      satisfied &&= satisfaction;
      if (!satisfied) break;
    }
    return satisfied;
  }

  private backtrack(i: Variable, assignedSoFar: PartialAssignment) {
    if (this.solutions.length >= this.maxSolutions) {
      return;
    }
    if (i === this.variables.length) {
      this.solutions.push(assignedSoFar);
      // console.log(`SOLUTION: ${assignedSoFar.toString()}`);
      return;
    }
    const possibilities: number[] = [];
    for (const v of this.variables[i].remainingValues()) {
      possibilities.push(v);
    }
    possibilities.sort((a, b) => Math.random() - 0.5);
    for (const v of possibilities) {
      const newAssignment = assignedSoFar.overwrite(i, v);
      if (this.checkConstraints(newAssignment)) {
        this.backtrack(i + 1, newAssignment);
      }
    }
  }

  private forwardStep(pa: PartialAssignment): PartialAssignment {
    for (let otherVariable = 0;
      otherVariable < this.variables.length;
      ++otherVariable) {
      const otherDomain = this.getDomain(
        otherVariable, pa,
        this.variables[otherVariable].size());
      for (const otherValue of otherDomain.remainingValues()) {
        const tmpAssignment = pa.overwrite(
          otherVariable, otherValue);
        // console.log(`FS: ${tmpAssignment.toString()}`);
        if (!this.checkConstraints(tmpAssignment)) {
          pa = pa.remove(
            otherVariable, otherValue, this.variables[otherVariable].size());
        }
      }
    }
    return pa;
  }

  private btfs(i: Variable, assignedSoFar: PartialAssignment) {
    if (this.solutions.length >= this.maxSolutions) {
      return;
    }
    // console.log(`BT: ${assignedSoFar.toString()}`);
    if (i === this.variables.length) {
      this.solutions.push(assignedSoFar);
      // console.log(`SOLUTION: ${assignedSoFar.toString()}`);
      return;
    }
    for (const v of this.variables[i].remainingValues()) {
      let newAssignment = assignedSoFar.overwrite(i, v);
      // console.log(`BT trying: ${newAssignment.toString()}`);

      newAssignment = this.forwardStep(newAssignment);

      if (this.checkConstraints(newAssignment)) {
        this.backtrack(i + 1, newAssignment);
      }
    }
  }

  private btfsvs(i: Variable, assignedSoFar: PartialAssignment) {
    if (this.solutions.length >= this.maxSolutions) {
      return;
    }
    // console.log(`BT: ${assignedSoFar.toString()}`);
    for (const v of this.variables[i].remainingValues()) {
      let newAssignment = assignedSoFar.overwrite(i, v);
      // console.log(`BT trying: ${newAssignment.toString()}`);

      newAssignment = this.forwardStep(newAssignment);

      if (this.checkConstraints(newAssignment)) {
        let bestSize = 0;
        let besti = undefined;
        for (let nexti = 0; nexti < this.variables.length; ++nexti) {
          const dom = this.getDomain(
            nexti, newAssignment, this.variables[nexti].size());
          if (dom.remainingSize() > 1 && dom.remainingSize() > bestSize) {
            bestSize = dom.remainingSize();
            besti = nexti;
          }
        }
        if (besti === undefined) {
          this.solutions.push(assignedSoFar);
          // console.log(`SOLUTION: ${assignedSoFar.toString()}`);
          return;
        }
        this.backtrack(besti, newAssignment);
      }
    }
  }

  runBacktrack() {
    this.solutions.length = 0;
    const pa = new PartialAssignment(this.variables.length);
    this.backtrack(0, pa);
    console.log(`Found ${this.solutions.length} solutions.`);
  }
  runBTFS() {
    this.solutions.length = 0;
    const pa = new PartialAssignment(this.variables.length);
    this.btfs(0, pa);
    console.log(`Found ${this.solutions.length} solutions.`);
  }
  runBTFSVS() {
    this.solutions.length = 0;
    const pa = new PartialAssignment(this.variables.length);
    this.btfsvs(0, pa);
    console.log(`Found ${this.solutions.length} solutions.`);
  }
}
