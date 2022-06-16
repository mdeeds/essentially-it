import * as THREE from "three";
import Ammo from "ammojs-typed";

import { Tick, Ticker } from "../ticker";
import { Debug } from "../debug";

export class PhysicsObject extends THREE.Object3D implements Ticker {
  private btWorldTransform: Ammo.btTransform;
  private btOrigin: Ammo.btVector3;
  private btRotation: Ammo.btQuaternion;
  private btForce: Ammo.btVector3;
  private btVelocity: Ammo.btVector3;
  constructor(ammo: typeof Ammo, private mass: number,
    private body: Ammo.btRigidBody) {
    super();
    this.btWorldTransform = new ammo.btTransform();
    this.btOrigin = new ammo.btVector3();
    this.btRotation = new ammo.btQuaternion(0, 0, 0, 0);
    this.btForce = new ammo.btVector3();
    this.btVelocity = new ammo.btVector3();
  }

  setPhysicsPosition(): void {
    // console.log(`Setting physics position: ${this.position.y}`);
    // console.log(this.body);
    const motionState = this.body.getMotionState();
    motionState.getWorldTransform(this.btWorldTransform);
    this.btOrigin.setValue(this.position.x, this.position.y, this.position.z);
    this.btWorldTransform.setOrigin(this.btOrigin);
    this.btRotation.setValue(this.quaternion.x, this.quaternion.y,
      this.quaternion.z, this.quaternion.w);
    this.btWorldTransform.setRotation(this.btRotation);
    motionState.setWorldTransform(this.btWorldTransform);
    this.body.setMotionState(motionState);
  }

  updatePositionFromPhysics(): void {
    // console.log(this.body);
    const motionState = this.body.getMotionState();
    motionState.getWorldTransform(this.btWorldTransform);
    // console.log(this.btWorldTransform);
    const btOrigin = this.btWorldTransform.getOrigin();
    // console.log(btOrigin);
    // console.log(`Before physics position: ${this.position.y}`);
    this.position.set(btOrigin.x(), btOrigin.y(), btOrigin.z());
    // console.log(`After physics position: ${this.position.y}`);
    const btQuaternion = this.btWorldTransform.getRotation();
    this.quaternion.set(btQuaternion.x(), btQuaternion.y(),
      btQuaternion.z(), btQuaternion.w());
    if (isNaN(this.position.y)) {
      throw new Error('Math failed.');
    }
  }

  tick(t: Tick) {
    this.updatePositionFromPhysics();
  }

  applyAcceleration(a: THREE.Vector3): void {
    // F = ma
    this.btForce.setValue(a.x, a.y, a.z);
    this.btForce.op_mul(this.mass);
    this.body.applyCentralForce(this.btForce);
  }

  setVelocity(v: THREE.Vector3): void {
    this.btVelocity.setValue(v.x, v.y, v.z);
    this.body.setLinearVelocity(this.btVelocity);
  }

  static makeRigidBody(
    ammo: typeof Ammo,
    shape: Ammo.btSphereShape | Ammo.btBvhTriangleMeshShape | Ammo.btBoxShape,
    mass: number): Ammo.btRigidBody {

    const motionState = new ammo.btDefaultMotionState();
    const btV1 = new ammo.btVector3();
    btV1.setValue(0, 0, 0);
    if (mass > 0) {
      shape.calculateLocalInertia(mass, btV1);
    } else {

    }
    const body = new ammo.btRigidBody(
      new ammo.btRigidBodyConstructionInfo(
        mass, motionState, shape, btV1));
    body.setActivationState(4);  // DISABLE_DEACTIVATION
    body.activate(true);
    body.setFriction(0.3);
    body.setRestitution(0.1);
    btV1.setValue(0, 0, 0);
    // body.setLinearVelocity(btV1);
    // body.setAngularVelocity(btV1);

    return body;
  }
}