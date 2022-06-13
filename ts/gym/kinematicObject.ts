import * as THREE from "three";
import Ammo from "ammojs-typed";

import { Tick, Ticker } from "../ticker";

export class KinematicObject extends THREE.Object3D implements Ticker {
  private btWorldTransform: Ammo.btTransform;
  private btOrigin: Ammo.btVector3;
  private btRotation: Ammo.btQuaternion;
  private btForce: Ammo.btVector3;
  private btVelocity: Ammo.btVector3;
  constructor(ammo: typeof Ammo, private mass: number,
    private body: Ammo.btRigidBody, private universeFrame: THREE.Object3D) {
    super();
    this.btWorldTransform = new ammo.btTransform();
    this.btOrigin = new ammo.btVector3();
    this.btRotation = new ammo.btQuaternion(0, 0, 0, 0);
    this.btForce = new ammo.btVector3();
    this.btVelocity = new ammo.btVector3();
  }

  private p = new THREE.Vector3();
  setPhysicsPosition(): void {
    this.getWorldPosition(this.p);
    this.universeFrame.worldToLocal(this.p);
    // console.log(`Setting physics position: ${this.position.y}`);
    // console.log(this.body);
    const motionState = this.body.getMotionState();
    motionState.getWorldTransform(this.btWorldTransform);
    this.btOrigin.setValue(this.p.x, this.p.y, this.p.z);
    this.btWorldTransform.setOrigin(this.btOrigin);
    this.btRotation.setValue(this.quaternion.x, this.quaternion.y,
      this.quaternion.z, this.quaternion.w);
    this.btWorldTransform.setRotation(this.btRotation);
    motionState.setWorldTransform(this.btWorldTransform);
    this.body.setMotionState(motionState);
    this.body.setCollisionFlags(2); // CF_KINEMATIC_OBJECT
    if (!this.body.isKinematicObject()) {
      throw new Error("Not Kinematic!?");
    }
  }

  tick(t: Tick) {
    this.setPhysicsPosition();
  }
}