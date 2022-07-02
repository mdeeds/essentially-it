import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { PhysicsObject } from "../gym/physicsObject";
import { RewindWorld } from './rewindWorld';
import { SphereBufferGeometry } from 'three';

export type KeyColor = 'black' | 'red' | 'blue' | 'orange';

interface ShapeFactory {
  getBTShape(radius: number): Ammo.btCollisionShape;
  getThreeShape(radius: number, color: THREE.Color): THREE.Object3D;
}

export class SphereFactory implements ShapeFactory {
  constructor(private ammo: typeof Ammo) { }
  getBTShape(radius: number): Ammo.btCollisionShape {
    const shape = new this.ammo.btSphereShape(radius);
    shape.setMargin(0.01);
    return shape;
  }
  getThreeShape(radius: number, color: THREE.Color): THREE.Object3D {
    const obj = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(Ball.ballRadius, 3),
      new THREE.MeshPhongMaterial({ color: new THREE.Color(color) }));
    return obj;
  }
}

export class CubeFactory implements ShapeFactory {
  constructor(private ammo: typeof Ammo) { }
  getBTShape(radius: number): Ammo.btCollisionShape {
    const shape = new this.ammo.btBoxShape(
      new this.ammo.btVector3(radius, radius, radius))
    shape.setMargin(0.01);
    return shape;
  }

  getThreeShape(radius: number, color: THREE.Color): THREE.Object3D {
    const obj = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        2 * radius, 2 * radius, 2 * radius),
      new THREE.MeshPhongMaterial({ color: new THREE.Color(color) }));
    return obj;
  }
}

export class Ball extends PhysicsObject {
  static readonly keyBallMass = 0.2; /*kg*/
  static readonly ballRadius = 0.2;
  constructor(ammo: typeof Ammo,
    initialPosition: THREE.Vector3, readonly keyColor: KeyColor,
    private physicsWorld: RewindWorld, mass: number,
    factory: ShapeFactory) {
    super(ammo, mass,
      (r: number) => factory.getBTShape(r),
      Ball.ballRadius);
    const body = this.getBody();
    body.setRestitution(0.5);  // Not very bouncy
    const obj = factory.getThreeShape(
      Ball.ballRadius, new THREE.Color(keyColor));
    this.add(obj);

    this.position.copy(initialPosition);
    super.setPhysicsPosition();
    this.physicsWorld.addRigidBody(body);
  }
}