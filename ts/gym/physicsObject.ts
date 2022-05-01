import * as THREE from "three";
import Ammo from "ammojs-typed";

export class PhysicsObject extends THREE.Object3D {
  private btWorldTransform: Ammo.btTransform;
  private btOrigin: Ammo.btVector3;
  private btRotation: Ammo.btQuaternion;
  constructor(ammo: typeof Ammo) {
    super();
    this.btWorldTransform = new ammo.btTransform();
    this.btOrigin = new ammo.btVector3();
    this.btRotation = new ammo.btQuaternion(0, 0, 0, 0);
  }

  setPhysicsPosition(): void {
    console.assert(!!this.userData['physicsObject'],
      "No physics object!");
    const body = this.userData['physicsObject'] as Ammo.btRigidBody;
    const motionState = body.getMotionState();
    motionState.getWorldTransform(this.btWorldTransform);
    this.btOrigin.setValue(this.position.x, this.position.y, this.position.z);
    this.btWorldTransform.setOrigin(this.btOrigin);
    this.btRotation.setValue(this.quaternion.x, this.quaternion.y,
      this.quaternion.z, this.quaternion.w);
    this.btWorldTransform.setRotation(this.btRotation);
    motionState.setWorldTransform(this.btWorldTransform);
  }

  updatePositionFromPhysics(): void {
    console.assert(!!this.userData['physicsObject'],
      "No physics object!");
    const body = this.userData['physicsObject'] as Ammo.btRigidBody;
    const motionState = body.getMotionState();
    motionState.getWorldTransform(this.btWorldTransform);
    const btOrigin = this.btWorldTransform.getOrigin();
    this.position.set(btOrigin.x(), btOrigin.y(), btOrigin.z());
    const btQuaternion = this.btWorldTransform.getRotation();
    this.quaternion.set(btQuaternion.x(), btQuaternion.y(),
      btQuaternion.z(), btQuaternion.w());
  }
}