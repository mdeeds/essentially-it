import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";
import { Tick, Ticker } from "../ticker";
import { S } from "../settings";
import { Motion } from "../motion";
import { RewindWorld } from "../portal/rewindWorld";

export class Player extends PhysicsObject implements Ticker {
  constructor(
    private ammo: typeof Ammo,
    private physicsWorld: RewindWorld,
    private camera: THREE.Object3D, private motions: Motion[]) {
    const playerMass = 100; /*kg*/
    super(ammo, playerMass, (radius: number) => {
      const shape = new ammo.btCylinderShape(new ammo.btVector3(
        0.25, 0.10, 0.25));
      shape.setMargin(0.01);
      return shape
    }, 0.25);
    const body = this.getBody();

    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.25, 0.25, 0.10),
      new THREE.MeshStandardMaterial({ color: '#33a' })
    );
    this.add(mesh);
    this.physicsWorld.addRigidBody(body);

    this.position.set(0, 1, 0);
    this.setPhysicsPosition();
  }

  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private v3 = new THREE.Vector3();
  tick(t: Tick) {
    this.camera.getWorldDirection(this.v1);
    this.v2.copy(this.motions[0].velocity);
    this.v3.copy(this.motions[1].velocity);
    const a2 = this.v2.dot(this.v1);
    const a3 = this.v3.dot(this.v1);
    let push = 0;
    if (a2 < 0 && a3 > 0) {
      push = Math.min(-a2, a3);
    } else if (a2 > 0 && a3 < 0) {
      push = Math.min(a2, -a3);
    }
    if (push > 0) {
      this.v1.setLength(push * this.getMass());
      this.applyForce(this.v1);
    }
  }
}