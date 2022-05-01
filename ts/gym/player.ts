import * as THREE from "three";
import Ammo from "ammojs-typed";
import { PhysicsObject } from "./physicsObject";

export class Player extends PhysicsObject {
  constructor(
    private ammo: typeof Ammo,
    private physicsWorld: Ammo.btDiscreteDynamicsWorld) {
    super(ammo);
    console.assert(!!physicsWorld, "Physics not initialized!");

    const mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.25, 0.25, 0.10),
      new THREE.MeshStandardMaterial({ color: '#33a' })
    );
    this.add(mesh);
    const shape = new this.ammo.btCylinderShape(new this.ammo.btVector3(
      0.25, 0.25, 0.10));
    shape.setMargin(0.01);

    const body =
      Player.makeRigidBody(this, this.ammo, shape, 100/*kg*/);
    this.physicsWorld.addRigidBody(body);
    this.userData['physicsObject'] = body;
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