import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";
import { RewindWorld } from "../portal/rewindWorld";

export class Column extends PhysicsObject {
  constructor(ammo: typeof Ammo,
    physicsWorld: RewindWorld,
    radius: number, height: number) {
    super(ammo, /*mass=*/0, (r: number) => {
      const shape = new ammo.btCylinderShape(new ammo.btVector3(
        radius, height, radius));
      shape.setMargin(0.01);
      return shape;
    }, radius);
    const body = this.getBody();

    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 0.8, radius, height),
      new THREE.MeshStandardMaterial({ color: '#f98' })
    );
    this.add(mesh);

    physicsWorld.addRigidBody(body);
  }
}