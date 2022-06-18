import Ammo from "ammojs-typed";

interface Encodable {
  size(): number;
  encode(target: Float32Array, offset: number): void;
  decode(source: Float32Array, offset: number): void;
}

class EncodableRigidBody implements Encodable {
  private tmpWorldTransform: Ammo.btTransform;
  private tmpPosition: Ammo.btVector3;
  private tmpVelocity: Ammo.btVector3;
  private tmpQuaternion: Ammo.btQuaternion;
  private tmpAngularVelocity: Ammo.btVector3;

  constructor(readonly body: Ammo.btRigidBody, ammo: typeof Ammo) {
    this.tmpWorldTransform = new ammo.btTransform();
    this.tmpPosition = new ammo.btVector3();
    this.tmpVelocity = new ammo.btVector3();
    this.tmpQuaternion = new ammo.btQuaternion(0, 0, 0, 0);
    this.tmpAngularVelocity = new ammo.btVector3();
  }

  size() { return 13; }

  // TODO: Scale and mass.
  encode(target: Float32Array, offset: number) {
    const motionState = this.body.getMotionState();
    motionState.getWorldTransform(this.tmpWorldTransform);
    const position = this.tmpWorldTransform.getOrigin();
    const linearVelocity = this.body.getLinearVelocity();
    const quaternion = this.tmpWorldTransform.getRotation();
    const rotationalVelocity = this.body.getAngularVelocity();

    let i = 0;
    target[offset + i++] = position.x();
    target[offset + i++] = position.y();
    target[offset + i++] = position.z();
    target[offset + i++] = linearVelocity.x();
    target[offset + i++] = linearVelocity.y();
    target[offset + i++] = linearVelocity.z();
    target[offset + i++] = quaternion.x();
    target[offset + i++] = quaternion.y();
    target[offset + i++] = quaternion.z();
    target[offset + i++] = quaternion.w();
    target[offset + i++] = rotationalVelocity.x();
    target[offset + i++] = rotationalVelocity.y()
    target[offset + i++] = rotationalVelocity.z();
  }

  decode(source: Float32Array, offset: number) {
    let i = 0;
    this.tmpPosition.setValue(
      source[offset + i++], source[offset + i++], source[offset + i++]);
    this.tmpVelocity.setValue(
      source[offset + i++], source[offset + i++], source[offset + i++]);
    this.tmpQuaternion.setValue(
      source[offset + i++], source[offset + i++], source[offset + i++], source[offset + i++]);
    this.tmpAngularVelocity.setValue(
      source[offset + i++], source[offset + i++], source[offset + i++]);

    this.tmpWorldTransform.setOrigin(this.tmpPosition);
    this.body.setLinearVelocity(this.tmpVelocity);
    this.tmpWorldTransform.setRotation(this.tmpQuaternion);
    this.body.setAngularVelocity(this.tmpAngularVelocity);
    // this.body.setWorldTransform(this.tmpWorldTransform);
    const motionState = this.body.getMotionState();
    motionState.setWorldTransform(this.tmpWorldTransform);
  }
}

class RecycleBin {
  private recordSize = undefined;
  private bin: Float32Array[] = [];
  constructor() { }

  trash(a: Float32Array) {
    if (a.length != this.recordSize) {
      this.bin.splice(0);
      this.recordSize = a.length;
    }
    this.bin.push(a);
  }
  create(n: number): Float32Array {
    if (n != this.recordSize) {
      this.bin.splice(0);
      this.recordSize = n;
    }
    if (this.bin.length > 0) {
      return this.bin.pop();
    } else {
      return new Float32Array(n);
    }
  }
}

export class RewindWorld implements Encodable {
  private isRewinding = false;
  private allBodies: EncodableRigidBody[] = [];
  private currentTimeS = 0;
  private previousStates: Float32Array[] = [];
  private encodeSize = 1;
  private bin = new RecycleBin();

  constructor(private baseWorld: Ammo.btDiscreteDynamicsWorld,
    private ammo: typeof Ammo) {
  }

  public clear() {
    for (const b of this.allBodies) {
      this.baseWorld.removeRigidBody(b.body);
    }
    this.allBodies.splice(0);
  }

  public addRigidBody(b: Ammo.btRigidBody) {
    // TODO: If state is finalized, we can't add more
    const encodableBody = new EncodableRigidBody(b, this.ammo);
    this.allBodies.push(encodableBody);
    this.encodeSize += encodableBody.size();
    this.baseWorld.addRigidBody(b);
  }

  public stepSimulation(deltaS: number, substeps: number) {
    if (this.isRewinding && this.previousStates.length > 0) {
      const poppedState = this.previousStates.pop();
      this.decode(poppedState, 0);
      this.bin.trash(poppedState);
    } else {
      this.captureState();
      this.currentTimeS += deltaS;
      this.baseWorld.stepSimulation(deltaS, substeps);
    }
  }

  public setRewind(isRewinding: boolean) {
    this.isRewinding = isRewinding;
  }

  private captureState() {
    const state = this.bin.create(this.encodeSize);
    this.encode(state, 0);
    this.previousStates.push(state);
    if (this.previousStates.length > 90 * 5 * 60) {
      // Remove a random state from the past.  We always keep the last 10%
      // untouched.
      const trash = this.previousStates.splice(
        Math.trunc(Math.random() * this.previousStates.length * 0.9), 1);
      this.bin.trash(trash[0]);
    }
  }

  // Encodable
  public size() {
    return this.encodeSize;
  }
  encode(target: Float32Array, offset: number) {
    let i = 0;
    target[offset + i++] = this.currentTimeS;
    for (const b of this.allBodies) {
      b.encode(target, offset + i);
      i += b.size();
    }
  }

  decode(target: Float32Array, offset: number) {
    let i = 0;
    this.currentTimeS = target[offset + i++];
    for (const b of this.allBodies) {
      b.decode(target, offset + i);
      i += b.size();
    }
  }
}