import { BackProp, ConstraintOnArray, Domain, PartialAssignment } from "./constraints";

function test1() {
  const a = Domain.anything(3);
  const b = Domain.anything(3);
  const c = Domain.anything(3);

  const c1 = new ConstraintOnArray(
    [0, 1],
    ((values: number[]) => {
      return values[0] !== values[1];
    }));

  const c2 = new ConstraintOnArray(
    [0, 1, 2],
    ((values: number[]) => {
      return values[0] + values[1] >= values[2];
    }));;


  const bp = new BackProp([a, b, c]);
  bp.addConstraint(c1);
  bp.addConstraint(c2);

  bp.run();
}
console.time('test1');
test1();
console.timeEnd('test1');

function testQueens() {
  const numQueens = 8;
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
  bp.run();
}

console.time('testQueens');
testQueens();
console.timeEnd('testQueens');
