import * as THREE from "three";
import { InstancedObject } from "./instancedObject";
import { AttenuatedParam } from "./params";

// X should range from 0 to 1.
export type ValueSetter = (p: number, x: number) => void;

export class KnobTarget {
  public constructor(private set: ValueSetter) {
  }

  public static fromAudioParam(param: AudioParam, audioCtx: AudioContext, lagS: number) {
    return new KnobTarget((p, x) => {
      param.linearRampToValueAtTime(x, audioCtx.currentTime + lagS);
    })
  }

  public static fromAttenuator(att: AttenuatedParam) {
    return new KnobTarget((p, x) => {
      att.setAttenuation(x);
    })
  }

  public static fromObjectRotation(object: THREE.Object3D) {
    return new KnobTarget((p, x) => {
      const hour = 10 * (p - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      object.rotation.z = theta;
    });
  }

  public static fromInstancedObject(object: InstancedObject,
    i: number) {
    return new KnobTarget((p, x) => {
      const hour = 10 * (p - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      const m = new THREE.Matrix4();
      object.getMatrixAt(i, m);
      const n = new THREE.Matrix4();
      n.copyPosition(m);
      m.makeRotationZ(theta);
      n.multiply(m);
      const rotation = new THREE.Matrix4();
      rotation.makeRotationX(Math.PI / 2);
      n.multiply(rotation);
      object.setMatrixAt(i, n);
    });
  }

  public static fromMatrixRotation(m: THREE.Matrix4) {
    return new KnobTarget((p, x) => {
      const hour = 10 * (p - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      const pp = new THREE.Vector3(
        m.elements[12], m.elements[13], m.elements[14]);
      pp.multiplyScalar(1 / m.elements[15]);
      m.makeRotationY(theta);
      m.setPosition(pp);
    });
  }

  setValue(p: number, x: number) {
    this.set(p, x);
  }
}

export class Knob {
  private targets: KnobTarget[] = [];
  constructor(
    readonly name: string,
    readonly low: number, readonly high: number, private value: number) {
    this.value = (value - low) / (high - low);
    this.value = Math.min(1, Math.max(0, this.value));
  }

  change(relativeDelta: number) {
    this.value += relativeDelta;
    this.value = Math.max(0, Math.min(1, this.value));
    for (const t of this.targets) {
      t.setValue(this.value,
        this.value * (this.high - this.low) + this.low);
    }
  }

  addTarget(target: KnobTarget) {
    this.targets.push(target);
    target.setValue(this.value,
      this.value * (this.high - this.low) + this.low);
  }

  // getValue(): number {
  //   return this.value;
  // }
}