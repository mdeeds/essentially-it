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
  constructor(ammo: typeof Ammo, readonly mass: number,
    private body: Ammo.btRigidBody) {
    super();
    this.btWorldTransform = new ammo.btTransform();
    this.btOrigin = new ammo.btVector3();
    this.btRotation = new ammo.btQuaternion(0, 0, 0, 0);
    this.btForce = new ammo.btVector3();
    this.btVelocity = new ammo.btVector3();
  }

  getVelocity(v: THREE.Vector3) {
    const ammoV = this.body.getLinearVelocity();
    v.set(ammoV.x(), ammoV.y(), ammoV.z());
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

  private t = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private euler = new THREE.Euler();
  applyMatrixToPhysics(m4: THREE.Matrix4): void {
    m4.decompose(this.position, this.q, this.scale);
    const angularVelocity = this.body.getAngularVelocity();
    this.euler.set(angularVelocity.x(), angularVelocity.y(), angularVelocity.z())
    this.q2.setFromEuler(this.euler);
    this.q2.multiply(this.q);
    this.euler.setFromQuaternion(this.q2);
    angularVelocity.setValue(this.euler.x, this.euler.y, this.euler.z);
    this.body.setAngularVelocity(angularVelocity);

    const linearVelocity = this.body.getLinearVelocity();
    this.t.set(linearVelocity.x(), linearVelocity.y(), linearVelocity.z());
    this.t.applyQuaternion(this.q);
    linearVelocity.setValue(this.t.x, this.t.y, this.t.z);
    this.body.setLinearVelocity(linearVelocity);

    this.updateMatrix();
    this.matrix.multiply(m4);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
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

  applyForce(a: THREE.Vector3): void {
    // F = ma
    this.btForce.setValue(a.x, a.y, a.z);
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
    body.setRestitution(0.8);  // 1.0 = totally elastic
    btV1.setValue(0, 0, 0);
    // body.setLinearVelocity(btV1);
    // body.setAngularVelocity(btV1);

    return body;
  }
}