import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";

export class Column extends PhysicsObject {
  constructor(ammo: typeof Ammo,
    physicsWorld: Ammo.btDiscreteDynamicsWorld,
    radius: number, height: number) {
    super(ammo, /*mass=*/0);
    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(radius * 0.8, radius, height),
      new THREE.MeshStandardMaterial({ color: '#f98' })
    );
    this.add(mesh);
    const shape = new ammo.btCylinderShape(new ammo.btVector3(
      radius, height, radius));
    shape.setMargin(0.01);

    const body =
      PhysicsObject.makeRigidBody(this, ammo, shape, /*mass=*/0);
    physicsWorld.addRigidBody(body);
    this.userData['physicsObject'] = body;
  }
}