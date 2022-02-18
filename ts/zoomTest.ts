import { Zoom } from "./zoom";
import * as THREE from "three";

{
  const l1 = new THREE.Vector2(0, 0);
  const r1 = new THREE.Vector2(1, 0);
  const p1 = Zoom.makePerpendicular(l1, r1);
  console.log('Expect: 0, 1')
  console.log(p1);
}

function logMatrix3(m: THREE.Matrix3) {
  console.log(`[ ${m.elements[0]}, ${m.elements[1]} ${m.elements[2]} ]`);
  console.log(`[ ${m.elements[3]}, ${m.elements[4]} ${m.elements[5]} ]`);
  console.log(`[ ${m.elements[6]}, ${m.elements[7]} ${m.elements[8]} ]`);
}

{
  const l1 = new THREE.Vector2(0, 5);
  const r1 = new THREE.Vector2(1, 6);
  const l2 = new THREE.Vector2(1, 7);
  const r2 = new THREE.Vector2(2, 8);

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect translate (1, 2)');
  logMatrix3(transform);
}

function testOne(c1: THREE.Vector2, c2: THREE.Vector2, transform: THREE.Matrix3) {
  const before = new THREE.Vector3(c1.x, c1.y, 1);
  before.applyMatrix3(transform);
  console.log(before);
  console.log(c2)
  console.assert(Math.abs(before.x - c2.x) < 0.01);
  console.assert(Math.abs(before.y - c2.y) < 0.01);
}

function testInOut(l1: THREE.Vector2, r1: THREE.Vector2, l2: THREE.Vector2, r2: THREE.Vector2) {
  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  testOne(l1, l2, transform);
  testOne(r1, r2, transform);
}

{
  const l1 = new THREE.Vector2(1, 1);
  const r1 = new THREE.Vector2(2, 2);
  const l2 = new THREE.Vector2(0, 0);
  const r2 = new THREE.Vector2(3, 3);

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect zoom 3x, translate (-1, -1)');
  logMatrix3(transform);
  testInOut(l1, r1, l2, r2);
}

{
  for (let i = 0; i < 10; ++i) {
    const l1 = new THREE.Vector2(Math.random(), Math.random());
    const r1 = new THREE.Vector2(Math.random(), Math.random());
    const l2 = new THREE.Vector2(Math.random(), Math.random());
    const r2 = new THREE.Vector2(Math.random(), Math.random());

    const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
    testInOut(l1, r1, l2, r2);
  }
}
