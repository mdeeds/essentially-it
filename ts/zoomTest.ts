import { Zoom } from "./zoom";
import * as THREE from "three";

{
  const l1 = [0, 0];
  const r1 = [1, 0];
  const p1 = Zoom.makePerpendicular(l1, r1);
  console.log('Expect: 0, 1')
  console.log(p1);
}

{
  const l1 = [0, 1];
  const r1 = [0, 0];
  const p1 = Zoom.makePerpendicular(l1, r1);
  console.log('Expect: 1, 1')
  console.log(p1);
}

{
  const l1 = [1, 1];
  const r1 = [2, 2];
  const p1 = Zoom.makePerpendicular(l1, r1);
  console.log('Expect: 0, 2')
  console.log(p1);
}


function logMatrix3(m: THREE.Matrix3) {
  console.log(`[ ${m.elements[0]}, ${m.elements[1]} ${m.elements[2]} ]`);
  console.log(`[ ${m.elements[3]}, ${m.elements[4]} ${m.elements[5]} ]`);
  console.log(`[ ${m.elements[6]}, ${m.elements[7]} ${m.elements[8]} ]`);
}

{
  const l1 = [0, 0];
  const r1 = [1, 0];
  const l2 = [0, 0];
  const r2 = [1, 0];

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);

  console.log('Expect identity');
  logMatrix3(transform);
}

{
  const l1 = [0, 0];
  const r1 = [1, 0];
  const l2 = [0, 0];
  const r2 = [2, 0];

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect zoom 2x');
  logMatrix3(transform);
}

{
  const l1 = [0, 5];
  const r1 = [1, 6];
  const l2 = [1, 7];
  const r2 = [2, 8];

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect translate (1, 2)');
  logMatrix3(transform);
}

function testOne(c1: number[], c2: number[], transform: THREE.Matrix3) {
  const before = new THREE.Vector3(c1[0], c1[1], 1);
  before.applyMatrix3(transform);
  console.log(before);
  console.log(c2)
  console.assert(Math.abs(before.x - c2[0]) < 0.01);
  console.assert(Math.abs(before.y - c2[1]) < 0.01);
}

function testInOut(l1: number[], r1: number[], l2: number[], r2: number[]) {
  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  testOne(l1, l2, transform);
  testOne(r1, r2, transform);
}

{
  const l1 = [1, 1];
  const r1 = [2, 2];
  const l2 = [0, 0];
  const r2 = [3, 3];

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect zoom 3x, translate (-1, -1)');
  logMatrix3(transform);
  testInOut(l1, r1, l2, r2);
}

{
  for (let i = 0; i < 10; ++i) {
    const l1 = [Math.random(), Math.random()];
    const r1 = [Math.random(), Math.random()];
    const l2 = [Math.random(), Math.random()];
    const r2 = [Math.random(), Math.random()];

    const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
    testInOut(l1, r1, l2, r2);
  }
}
