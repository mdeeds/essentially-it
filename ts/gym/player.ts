import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";
import { Tick, Ticker } from "../ticker";
import { S } from "../settings";

export class Player extends PhysicsObject implements Ticker {
  private static mass = 100; // kg
  constructor(
    private ammo: typeof Ammo,
    private physicsWorld: Ammo.btDiscreteDynamicsWorld,
    private camera: THREE.Object3D) {
    super(ammo, Player.mass);
    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.25, 0.25, 0.10),
      new THREE.MeshStandardMaterial({ color: '#33a' })
    );
    this.add(mesh);
    const shape = new this.ammo.btCylinderShape(new this.ammo.btVector3(
      0.25, 0.10, 0.25));
    shape.setMargin(0.01);

    const body =
      Player.makeRigidBody(this, this.ammo, shape, Player.mass);
    this.physicsWorld.addRigidBody(body);
    this.userData['physicsObject'] = body;
    this.previousY = camera.position.y;

    this.position.set(0, 1, 0);
    this.setPhysicsPosition();
  }

  private cameraNormalMatrix = new THREE.Matrix3();
  private previousY = 0;
  private previousV = 0;
  private velocity = new THREE.Vector3();
  private targetVelocity = new THREE.Vector3();
  private velocityDelta = new THREE.Vector3();
  private acceleration = new THREE.Vector3();
  private maxAcceleration = S.float('ma');  // m/s/s
  private accelerationAngle = S.float('aa');  // radians from up
  tick(t: Tick) {
    const deltaY = this.camera.position.y - this.previousY;
    const velocityY = deltaY / t.deltaS;
    const accelerationY = (velocityY - this.previousV) / t.deltaS;

    // if (deltaY > 0) {
    if (deltaY > 0 && accelerationY > 0) {
      this.cameraNormalMatrix.getNormalMatrix(this.camera.matrixWorld);
      this.targetVelocity.set(
        0, 0, -1);
      this.targetVelocity.applyMatrix3(this.cameraNormalMatrix);
      // Point targetVelocity in the XZ plane
      this.targetVelocity.y = 0;
      this.targetVelocity.setLength(1);
      // Scale down XZ portion by desired angle of incline
      this.targetVelocity.z *= Math.sin(this.accelerationAngle);
      this.targetVelocity.x *= Math.sin(this.accelerationAngle);
      // Set Y potion to remaining part of angle.
      this.targetVelocity.y = Math.cos(this.accelerationAngle);

      this.targetVelocity.setLength(3 * deltaY / t.deltaS);

      this.velocityDelta.copy(this.targetVelocity);
      this.velocityDelta.sub(this.velocity);
      this.acceleration.copy(this.velocityDelta);
      this.acceleration.multiplyScalar(1 / t.deltaS);
      // Super-human factor 10x (shf)
      const acceleration = Math.min(accelerationY * S.float('shf'),
        this.maxAcceleration);
      this.acceleration.setLength(acceleration);
      if (this.acceleration.length() > this.maxAcceleration) {
        this.acceleration.setLength(this.maxAcceleration);
      }
      if (accelerationY > S.float('yae')) {
        // Real-world vertical acceleration is positive, and player is moving
        // up.  The player must have their feet planted on the ground.
        this.acceleration.y += 9.8;
      }
      this.applyAcceleration(this.acceleration);
    }
    this.previousY = this.camera.position.y;
    this.previousV = velocityY;
  }

  private static makeRigidBody(
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
    shape.calculateLocalInertia(mass, btV1);
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