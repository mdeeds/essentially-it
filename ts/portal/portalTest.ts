import * as THREE from 'three';
import { Tick } from '../ticker';
import { Portal } from './portal';

function test1() {
  const scene = new THREE.Group();
  const left = new Portal(1, 1);
  scene.add(left);
  left.position.set(-1, 0, 0);
  left.rotateY(Math.PI / 2);
  left.tick(null);

  const right = new Portal(1, 1);
  scene.add(right);
  right.position.set(1, 0, 0);
  right.rotateY(-Math.PI / 2);
  right.tick(null);

  const ball = new THREE.Object3D();
  scene.add(ball);
  ball.position.set(-0.9, 0, 0);

  const m4 = new THREE.Matrix4();

  console.log(`x=${ball.position.x.toFixed(1)}; expect: -0.9`);
  left.updatePosition(ball, right, m4);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: -0.9`);
  ball.position.set(-1.1, 0, 0);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: -1.1`);
  left.updatePosition(ball, right, m4);
  ball.updateMatrix();
  ball.matrix.multiply(m4);
  ball.matrix.decompose(ball.position, ball.quaternion, ball.scale);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: 0.9`);
}

function test2() {
  const scene = new THREE.Group();
  const left = new Portal(1, 1);
  scene.add(left);
  left.position.set(-1, 0, 0);
  left.rotateY(Math.PI / 2);
  left.tick(null);

  const right = new Portal(1, 1);
  scene.add(right);
  right.position.set(0, 0, -1);
  right.tick(null);

  const ball = new THREE.Object3D();
  scene.add(ball);
  ball.position.set(-0.9, 0, 0);

  const m4 = new THREE.Matrix4();

  console.log(`x=${ball.position.x.toFixed(1)}; expect: -0.9`);
  left.updatePosition(ball, right, m4);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: -0.9`);
  ball.position.set(-1.1, 0, 0);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: -1.1`);
  left.updatePosition(ball, right, m4);
  ball.updateMatrix();
  ball.matrix.multiply(m4);
  ball.matrix.decompose(ball.position, ball.quaternion, ball.scale);
  console.log(`x=${ball.position.x.toFixed(1)}; expect: 0.0`);
  console.log(`z=${ball.position.z.toFixed(1)}; expect: -0.9`);
}

test1();
test2();