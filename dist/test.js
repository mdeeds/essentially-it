/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 4563:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BackProp = exports.PartialAssignment = exports.ConstraintOnArray = exports.Domain = void 0;
class Domain {
    possibilities;
    assignedValue;
    remainingCount;
    constructor() {
    }
    *remainingValues() {
        if (this.remainingCount === 1) {
            yield this.assignedValue;
        }
        else {
            for (let i = 0; i < this.possibilities.length; ++i) {
                if (this.possibilities[i]) {
                    yield i;
                }
            }
        }
    }
    remove(v) {
        if (!this.possibilities) {
            throw new Error(`Already assigned.`);
        }
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
    size() {
        return this.possibilities.length;
    }
    remainingSize() {
        return this.remainingCount;
    }
    getAssignedValue() {
        if (this.remainingCount != 1) {
            throw new Error("Value is not known!");
        }
        return this.assignedValue;
    }
    static anything(size) {
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
    static assigned(value) {
        const result = new Domain();
        result.possibilities = null;
        result.remainingCount = 1;
        result.assignedValue = value;
        return result;
    }
}
exports.Domain = Domain;
class ConstraintOnArray {
    variables;
    constraintFunction;
    constructor(variables, constraintFunction) {
        this.variables = variables;
        this.constraintFunction = constraintFunction;
    }
    isSatisfied(p) {
        const values = [];
        for (const v of this.variables) {
            values.push(p.getValue(v));
        }
        return this.constraintFunction(values);
    }
}
exports.ConstraintOnArray = ConstraintOnArray;
class PartialAssignment {
    size;
    parent = null;
    overwriteIndex = null;
    overwriteValue = null;
    unassignedCount;
    constructor(size) {
        this.size = size;
        this.unassignedCount = size;
    }
    // Returns the value of X_i, or undefined if it is not assigned.
    getValue(i) {
        let cursor = this;
        while (cursor !== null) {
            if (cursor.overwriteIndex == i) {
                if (cursor.overwriteValue.remainingSize() === 1) {
                    return cursor.overwriteValue.getAssignedValue();
                }
                else {
                    return undefined;
                }
            }
            cursor = cursor.parent;
        }
        return undefined;
    }
    getDomain(i, size) {
        let cursor = this;
        while (cursor !== null) {
            if (cursor.overwriteIndex == i) {
                return cursor.overwriteValue;
            }
            cursor = cursor.parent;
        }
        return Domain.anything(size);
    }
    overwrite(i, v) {
        //TODO: For performance, consider removing this check.
        const previousValue = this.getDomain(i, 2);
        if (previousValue.remainingSize() === 1) {
            throw new Error(`Trying to reassign X_${i}=${v}`);
        }
        const result = new PartialAssignment(this.size);
        result.parent = this;
        result.unassignedCount = this.unassignedCount - 1;
        result.overwriteIndex = i;
        result.overwriteValue = Domain.assigned(v);
        return result;
    }
    remove(i, v, size) {
        // console.log(`Remove ${v} from X_${i}`);
        const result = new PartialAssignment(this.size);
        result.parent = this;
        result.unassignedCount = this.unassignedCount;
        result.overwriteIndex = i;
        result.overwriteValue = this.getDomain(i, size).remove(v);
        if (result.overwriteValue.remainingSize() === 1) {
            --result.unassignedCount;
        }
        return result;
    }
    getUnassignedCount() {
        return this.unassignedCount;
    }
    toArray(out) {
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
exports.PartialAssignment = PartialAssignment;
class BackProp {
    variables;
    maxSolutions;
    constraints = [];
    solutions = [];
    variableToConstraint = new Map();
    constructor(variables, maxSolutions) {
        this.variables = variables;
        this.maxSolutions = maxSolutions;
        for (let v = 0; v < variables.length; ++v) {
            this.variableToConstraint.set(v, []);
        }
    }
    addConstraint(c) {
        this.constraints.push(c);
        for (const v of c.variables) {
            this.variableToConstraint.get(v).push(c);
        }
    }
    addConstraints(cs) {
        for (const c of cs) {
            this.addConstraint(c);
        }
    }
    getDomain(i, pa, size) {
        const assignment = pa.getDomain(i, size);
        if (assignment === undefined) {
            return this.variables[i];
        }
        else {
            return assignment;
        }
    }
    // TODO: require a list of newly set variables.  I.e. the ones
    // that have been set since last successful check.
    // Returns true if none of the constraints fail.
    checkConstraints(pa) {
        let satisfied = true;
        for (const c of this.constraints) {
            let finishedThisConstraint = false;
            for (const dependant of c.variables) {
                if (this.getDomain(dependant, pa, this.variables[dependant].size()).remainingSize() > 1) {
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
            if (!satisfied)
                break;
        }
        return satisfied;
    }
    backtrack(i, assignedSoFar) {
        if (this.solutions.length >= this.maxSolutions) {
            return;
        }
        if (i === this.variables.length) {
            this.solutions.push(assignedSoFar);
            // console.log(`SOLUTION: ${assignedSoFar.toString()}`);
            return;
        }
        const possibilities = [];
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
    forwardStep(pa) {
        // console.log(`FS: ${pa.toString()}`);
        if (!this.checkConstraints(pa)) {
            throw new Error("Invalid state!");
        }
        for (let otherVariable = 0; otherVariable < this.variables.length; ++otherVariable) {
            const otherDomain = this.getDomain(otherVariable, pa, this.variables[otherVariable].size());
            if (otherDomain.remainingSize() === 1) {
                // Only one value - nothing to remove.
                continue;
            }
            for (const otherValue of otherDomain.remainingValues()) {
                const tmpAssignment = pa.overwrite(otherVariable, otherValue);
                if (!this.checkConstraints(tmpAssignment)) {
                    const otherSize = this.variables[otherVariable].size();
                    pa = pa.remove(otherVariable, otherValue, otherSize);
                    const remainingSize = pa.getDomain(otherVariable, otherSize).remainingSize();
                    if (remainingSize === 0) {
                        // No possible values for this variable.  Return null.
                        // console.log(`Impossible: ${pa.toString()}`);
                        return null;
                    }
                    else if (remainingSize === 1) {
                        // Reduced to a single variable.  Check constraints and fail
                        // if its not satisfied.
                        if (!this.checkConstraints(pa)) {
                            return null;
                        }
                        else {
                            // No more assignments to try.
                            break;
                        }
                    }
                }
            }
        }
        // It seems like we need to check the constraints here.
        return pa;
    }
    btfs(i, assignedSoFar) {
        if (assignedSoFar.getUnassignedCount() < 0) {
            throw new Error(`Invalid state: ${assignedSoFar.toString()}, ` +
                `Remaining: ${assignedSoFar.getUnassignedCount()}`);
        }
        if (this.solutions.length >= this.maxSolutions) {
            return;
        }
        // console.log(`BTFS: ${assignedSoFar.toString()}`);
        if (assignedSoFar.getUnassignedCount() === 0) {
            const a = [];
            a.length = assignedSoFar.size;
            assignedSoFar.toArray(a);
            for (let i = 0; i < a.length; ++i) {
                if (a[i] === undefined) {
                    console.log('AAAAA!');
                }
            }
            this.solutions.push(assignedSoFar);
            // console.log(`SOLUTION: ${assignedSoFar.toString()}`);
            return;
        }
        if (!this.variables[i]) {
            console.log(`State: ${assignedSoFar.toString()}`);
            console.log(`Remaining: ${assignedSoFar.getUnassignedCount()}`);
            throw new Error(`Unknown variable: ${i}`);
        }
        if (this.getDomain(i, assignedSoFar, this.variables[i].size()).remainingSize() === 1) {
            // We have already solved this variable.  Just move on.
            this.btfs(i + 1, assignedSoFar);
            return;
        }
        for (const v of this.variables[i].remainingValues()) {
            let newAssignment = assignedSoFar.overwrite(i, v);
            if (!this.checkConstraints(newAssignment)) {
                continue;
            }
            // console.log(`BT trying: ${newAssignment.toString()}`);
            const prev = newAssignment;
            newAssignment = this.forwardStep(newAssignment);
            if (!newAssignment) {
                // There is no way to satisfy the constraints.
                continue;
            }
            // If the forward step did nothing, don't check constraints again.
            if (prev === newAssignment || this.checkConstraints(newAssignment)) {
                this.btfs(i + 1, newAssignment);
            }
        }
    }
    mostConstrainedVariable(newAssignment) {
        let bestSize = 0;
        let besti = undefined;
        for (let nexti = 0; nexti < this.variables.length; ++nexti) {
            const dom = this.getDomain(nexti, newAssignment, this.variables[nexti].size());
            if (dom.remainingSize() > 1 && dom.remainingSize() > bestSize) {
                bestSize = dom.remainingSize();
                besti = nexti;
            }
        }
        return besti;
    }
    btfsvs(i, assignedSoFar) {
        if (this.solutions.length >= this.maxSolutions) {
            return;
        }
        if (this.variables[i].remainingSize() <= 1) {
            throw new Error("Tried to set something twice????");
        }
        console.log(`BTFSVS: ${assignedSoFar.toString()}`);
        if (!this.variables[i]) {
            throw new Error(`Unknown variable: ${i}`);
        }
        for (const v of this.variables[i].remainingValues()) {
            let newAssignment = assignedSoFar.overwrite(i, v);
            // console.log(`BT trying: ${newAssignment.toString()}`);
            newAssignment = this.forwardStep(newAssignment);
            if (this.checkConstraints(newAssignment)) {
                if (newAssignment.getUnassignedCount() === 0) {
                    this.solutions.push(newAssignment);
                }
                const besti = this.mostConstrainedVariable(newAssignment);
                if (besti !== undefined) {
                    this.btfsvs(besti, newAssignment);
                }
            }
        }
    }
    printSolutions() {
        console.log('SOLUTIONS:');
        for (const s of this.solutions) {
            console.log(s.toString());
        }
        console.log('----------');
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
exports.BackProp = BackProp;
//# sourceMappingURL=constraints.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const constraints_1 = __webpack_require__(4563);
function test1() {
    const a = constraints_1.Domain.anything(3);
    const b = constraints_1.Domain.anything(3);
    const c = constraints_1.Domain.anything(3);
    const bp = new constraints_1.BackProp([a, b, c], 1e12);
    for (let i = 0; i < 3; ++i) {
        for (let j = i + 1; j < 3; ++j) {
            const c1 = new constraints_1.ConstraintOnArray([i, j], ((values) => {
                return values[0] < values[1];
            }));
            bp.addConstraint(c1);
        }
    }
    bp.runBTFS();
}
console.time('test1');
test1();
console.timeEnd('test1');
function testQueens(numQueens) {
    let evalCount = 0;
    const variables = [];
    for (let i = 0; i < numQueens; ++i) {
        const v = constraints_1.Domain.anything(numQueens);
        variables.push(v);
    }
    const bp = new constraints_1.BackProp(variables, 32);
    for (let i = 0; i < numQueens; ++i) {
        for (let j = i + 1; j < numQueens; ++j) {
            bp.addConstraint(new constraints_1.ConstraintOnArray([i, j], (values) => {
                ++evalCount;
                if (values[0] === values[1]) {
                    // Same row case.
                    return false;
                }
                if (Math.abs(values[0] - values[1]) === j - i) {
                    // diagonal case.
                    return false;
                }
                return true;
            }));
        }
    }
    evalCount = 0;
    console.time(`testQueens(${numQueens}) Backtrack`);
    bp.runBacktrack();
    console.timeEnd(`testQueens(${numQueens}) Backtrack`);
    console.log(`Backtrack evaluations: ${evalCount}`);
    evalCount = 0;
    console.time(`testQueens(${numQueens}) BTFS`);
    bp.runBTFS();
    console.timeEnd(`testQueens(${numQueens}) BTFS`);
    console.log(`BTFS evaluations: ${evalCount}`);
    // evalCount = 0;
    // console.time(`testQueens(${numQueens}) BTFSVS`);
    // bp.runBTFSVS();
    // console.timeEnd(`testQueens(${numQueens}) BTFSVS`);
    // console.log(`Evaluations: ${evalCount}`);
}
testQueens(5);
testQueens(6);
testQueens(7);
testQueens(8);
//# sourceMappingURL=constraintsTest.js.map
})();

/******/ })()
;
//# sourceMappingURL=test.js.map