import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { PhysicsObject } from "../gym/physicsObject";
import { RewindWorld } from './rewindWorld';
import { SphereBufferGeometry } from 'three';

export type KeyColor = 'black' | 'red' | 'blue' | 'orange';

export class Ball extends PhysicsObject {
  static readonly keyBallMass = 0.2; /*kg*/
  static readonly ballRadius = 0.2;
  constructor(ammo: typeof Ammo,
    initialPosition: THREE.Vector3, readonly keyColor: KeyColor,
    private physicsWorld: RewindWorld, mass: number) {
    const isCube = Math.random() < 0.5;
    const sphereFactory = (radius: number) =>
      new ammo.btSphereShape(radius);
    const cubeFactory = (radius: number) =>
      new ammo.btBoxShape(new ammo.btVector3(radius, radius, radius));


    super(ammo, mass,
      isCube ? cubeFactory : sphereFactory,
      Ball.ballRadius);
    const body = this.getBody();

    if (isCube) {
      const obj = new THREE.Mesh(
        new THREE.BoxBufferGeometry(
          2 * Ball.ballRadius, 2 * Ball.ballRadius, 2 * Ball.ballRadius),
        new THREE.MeshPhongMaterial({ color: new THREE.Color(keyColor) }));
      this.add(obj);
    } else {
      const obj = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(Ball.ballRadius, 3),
        new THREE.MeshPhongMaterial({ color: new THREE.Color(keyColor) }));
      this.add(obj);
    }

    this.position.copy(initialPosition);
    super.setPhysicsPosition();
    this.physicsWorld.addRigidBody(body);
  }
}