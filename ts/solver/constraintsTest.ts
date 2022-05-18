import { BackProp, Domain, PartialAssignment } from "./constraints";

function test() {
  const a = Domain.anything();
  const b = Domain.anything();
  const c = Domain.anything();

  const c1 = ((p: PartialAssignment) => {
    const aa = p.get(0);
    const bb = p.get(1);
    if (aa === null || bb === null) {
      return true;
    }
    return aa !== bb;
  });

  const c2 = ((p: PartialAssignment) => {
    const aa = p.get(0);
    const bb = p.get(1);
    const cc = p.get(2);
    if (aa === null || bb === null || cc === null) {
      return true;
    }
    return aa + bb >= cc;
  });


  const bp = new BackProp([a, b, c]);
  bp.addConstraint(c1);
  bp.addConstraint(c2);

  bp.run();
}

console.time('test1');
test();
console.timeEnd('test1');