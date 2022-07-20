import * as THREE from "three";
import { Tick, Ticker } from "../ticker";

export class ThirdPersonCamera extends THREE.Group implements Ticker {
  private idealLookAt = new THREE.Vector3();
  private idealLocation = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();

  constructor(private target: THREE.Object3D) {
    super();
    this.currentLookAt.copy(target.position);
  }
  private setIdeal(relative: THREE.Vector3, out: THREE.Vector3) {
    out.copy(relative);
    out.applyQuaternion(this.target.quaternion);
    out.add(this.target.position);
  }

  private followOffset = new THREE.Vector3(0, 0.4, 0.6);
  private lookOffset = new THREE.Vector3(0, 0, 1.5);
  tick(t: Tick) {
    this.setIdeal(this.idealLookAt, this.lookOffset);
    this.setIdeal(this.idealLocation, this.followOffset);

    const p = 1 - Math.pow(0.001, t.deltaS);
    this.position.lerp(this.idealLookAt, p);
    this.currentLookAt.lerp(this.idealLookAt, p);
    this.lookAt(this.currentLookAt);
  }
}