import * as THREE from "three";
import Ammo from "ammojs-typed";

export class PhysicsObject extends THREE.Object3D {
  private btWorldTransform: Ammo.btTransform;
  private btOrigin: Ammo.btVector3;
  private btRotation: Ammo.btQuaternion;
  private btForce: Ammo.btVector3;
  constructor(ammo: typeof Ammo, private mass: number) {
    super();
    this.btWorldTransform = new ammo.btTransform();
    this.btOrigin = new ammo.btVector3();
    this.btRotation = new ammo.btQuaternion(0, 0, 0, 0);
    this.btForce = new ammo.btVector3();
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

  applyAcceleration(a: THREE.Vector3): void {
    console.assert(!!this.userData['physicsObject'],
      "No physics object!");
    const body = this.userData['physicsObject'] as Ammo.btRigidBody;
    // F = ma
    this.btForce.setValue(a.x, a.y, a.z);
    this.btForce.op_mul(this.mass);
    body.applyCentralForce(this.btForce);
  }

  static makeRigidBody(
    object: THREE.Object3D, ammo: typeof Ammo,
    shape: Ammo.btSphereShape | Ammo.btBvhTriangleMeshShape | Ammo.btBoxShape,
    mass: number): Ammo.btRigidBody {

    const btTx = new ammo.btTransform();
    const btQ = new ammo.btQuaternion(0, 0, 0, 0);
    const btV1 = new ammo.btVector3();

    btTx.setIdentity();
    btV1.setValue(
      object.position.x,
      object.position.y,
      object.position.z);
    btTx.setOrigin(btV1);
    btQ.setValue(
      object.quaternion.x,
      object.quaternion.y,
      object.quaternion.z,
      object.quaternion.w);
    btTx.setRotation(btQ);
    const motionState = new ammo.btDefaultMotionState(btTx);
    btV1.setValue(0, 0, 0);
    if (mass > 0) {
      shape.calculateLocalInertia(mass, btV1);
    } else {

    }
    const body = new ammo.btRigidBody(
      new ammo.btRigidBodyConstructionInfo(
        mass, motionState, shape, btV1));
    body.setActivationState(4);  // Disable deactivation
    body.activate(true);
    body.setFriction(0.3);
    body.setRestitution(0.1);

    return body;
  }
}