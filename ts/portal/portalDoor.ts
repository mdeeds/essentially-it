import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { PhysicsObject } from "../gym/physicsObject";
import { RewindWorld } from "./rewindWorld";
import { ShapeFactory } from './shapeHelpers';


class PortalDoorShapeFactory implements ShapeFactory {
  constructor(private ammo: typeof Ammo) {
  }
  getBtShape(radius: number): Ammo.btCollisionShape {

    const compound = new this.ammo.btCompoundShape(true);

    const baseSize = new this.ammo.btVector3(radius, radius * 0.05, radius);
    const base = new this.ammo.btBoxShape(baseSize);

    const noRotation = new this.ammo.btQuaternion(0, 0, 0, 1);
    const basePosition = new this.ammo.btVector3(0, -radius, 0);
    const baseTx = new this.ammo.btTransform(noRotation, basePosition);

    compound.addChildShape(baseTx, base);




    const shape = new this.ammo.btSphereShape(radius);
    shape.setMargin(0.01);
    return shape;
  }
  getThreeShape(radius: number, color: THREE.Color): THREE.Object3D {
    const obj = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(radius, 3),
      new THREE.MeshPhongMaterial({ color: new THREE.Color(color) }));
    return obj;
  }


}

export class PortalDoor extends PhysicsObject {
  constructor(ammo: typeof Ammo, private physicsWorld: RewindWorld) {
    super(ammo, 10/*kg*/, (r: number) => null, 0.5);
  }


}