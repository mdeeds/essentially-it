import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { PhysicsObject } from "../gym/physicsObject";

export class Ball extends PhysicsObject {
  static readonly ballMass = 1.0; /*kg*/
  static readonly ballRadius = 0.2;
  constructor(ammo: typeof Ammo,
    initialPosition: THREE.Vector3, color: THREE.Color,
    private physicsWorld: Ammo.btDiscreteDynamicsWorld) {
    const body = Ball.makeBody(ammo);
    super(ammo, Ball.ballMass, body);

    const obj = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(Ball.ballRadius, 3),
      new THREE.MeshPhongMaterial({ color: color }));
    this.add(obj);
    this.position.copy(initialPosition);
    super.setPhysicsPosition();
    this.physicsWorld.addRigidBody(body);
  }

  private static makeBody(ammo: typeof Ammo) {
    const sphereMass = 1.0;
    const shape = new ammo.btSphereShape(Ball.ballRadius);
    shape.setMargin(0.01);
    const body =
      PhysicsObject.makeRigidBody(ammo, shape, sphereMass);
    return body
  }
}