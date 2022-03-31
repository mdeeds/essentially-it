import * as THREE from "three";
import { InstancedObject } from "./instancedObject";
import { AttenuatedParam } from "./params";

// X should range from 0 to 1.
export type ValueSetter = (x: number) => void;

export class KnobTarget {

  public constructor(private set: ValueSetter) {
  }

  public static fromAudioParam(param: AudioParam, audioCtx: AudioContext, lagS: number) {
    return new KnobTarget((x) => {
      param.linearRampToValueAtTime(x, audioCtx.currentTime + lagS);
    })
  }

  public static fromAttenuator(att: AttenuatedParam) {
    return new KnobTarget((x) => {
      att.setAttenuation(x);
    })
  }

  public static fromObjectRotation(object: THREE.Object3D) {
    return new KnobTarget((x) => {
      const hour = 10 * (x - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      object.rotation.z = theta;
    });
  }

  public static fromInstancedObject(object: InstancedObject,
    i: number) {
    return new KnobTarget((x) => {
      const hour = 10 * (x - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      const m = new THREE.Matrix4();
      object.getMatrixAt(i, m);
      const n = new THREE.Matrix4();
      n.copyPosition(m);
      m.makeRotationZ(theta);
      console.log(`Theta: ${theta}; x: ${x}`);
      n.multiply(m);
      const rotation = new THREE.Matrix4();
      rotation.makeRotationX(Math.PI / 2);
      n.multiply(rotation);
      object.setMatrixAt(i, n);
    });
  }

  public static fromMatrixRotation(m: THREE.Matrix4) {
    return new KnobTarget((x) => {
      const hour = 10 * (x - 0.5);  // 0 = up
      const theta = Math.PI * 2 / 12 * hour;
      const p = new THREE.Vector3(
        m.elements[12], m.elements[13], m.elements[14]);
      p.multiplyScalar(1 / m.elements[15]);
      m.makeRotationY(theta);
      m.setPosition(p);
    });
  }

  setValue(value: number) {
    this.set(value);
  }
}

export class Knob {
  private targets: KnobTarget[] = [];
  constructor(
    readonly low: number, readonly high: number, private value: number) {
    this.value = Math.max(low, Math.min(high, value));
  }

  change(relativeDelta: number) {
    const absoluteDelta = relativeDelta * (this.high - this.low);
    this.value += absoluteDelta;
    this.value = Math.max(this.low, Math.min(this.high, this.value));
    for (const t of this.targets) {
      t.setValue(this.value);
    }
  }

  addTarget(target: KnobTarget) {
    this.targets.push(target);
    target.setValue(this.value);
  }

  // getValue(): number {
  //   return this.value;
  // }
}