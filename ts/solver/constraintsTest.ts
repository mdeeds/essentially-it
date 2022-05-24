import { BackProp, ConstraintOnArray, Domain, PartialAssignment } from "./constraints";

function test1() {
  const a = Domain.anything(3);
  const b = Domain.anything(3);
  const c = Domain.anything(3);

  const bp = new BackProp([a, b, c]);

  for (let i = 0; i < 3; ++i) {
    for (let j = i + 1; j < 3; ++j) {
      const c1 = new ConstraintOnArray(
        [i, j],
        ((values: number[]) => {
          return values[0] < values[1];
        }));
      bp.addConstraint(c1);
    }
  }

  bp.runBTFS();
}
// console.time('test1');
// test1();
// console.timeEnd('test1');

function testQueens(numQueens: number) {
  let evalCount = 0;
  const variables: Domain[] = [];
  for (let i = 0; i < numQueens; ++i) {
    const v = Domain.anything(numQueens);
    variables.push(v);
  }

  const bp = new BackProp(variables);
  for (let i = 0; i < numQueens; ++i) {
    for (let j = i + 1; j < numQueens; ++j) {
      bp.addConstraint(new ConstraintOnArray([i, j],
        (values: number[]) => {
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
        }
      ));
    }
  }
  evalCount = 0;
  console.time(`testQueens(${numQueens}) BTFS`);
  bp.runBTFS();
  console.timeEnd(`testQueens(${numQueens}) BTFS`);
  console.log(`Evaluations: ${evalCount}`);

  evalCount = 0;
  console.time(`testQueens(${numQueens}) Backtrack`);
  bp.runBacktrack();
  console.timeEnd(`testQueens(${numQueens}) Backtrack`);
  console.log(`Evaluations: ${evalCount}`);

  evalCount = 0;
  console.time(`testQueens(${numQueens}) BTFSVS`);
  bp.runBTFSVS();
  console.timeEnd(`testQueens(${numQueens}) BTFSVS`);
  console.log(`Evaluations: ${evalCount}`);
}

for (let n = 5; n <= 8; ++n) {
  testQueens(n);
}
// testQueens(8);
