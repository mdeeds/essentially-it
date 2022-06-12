import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";

export class Column extends PhysicsObject {
  constructor(ammo: typeof Ammo,
    physicsWorld: Ammo.btDiscreteDynamicsWorld,
    radius: number, height: number) {
    const shape = new ammo.btCylinderShape(new ammo.btVector3(
      radius, height, radius));
    shape.setMargin(0.01);
    const body =
      PhysicsObject.makeRigidBody(ammo, shape, /*mass=*/0);
    super(ammo, /*mass=*/0, body);

    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 0.8, radius, height),
      new THREE.MeshStandardMaterial({ color: '#f98' })
    );
    this.add(mesh);

    physicsWorld.addRigidBody(body);
  }
}