import * as THREE from "three";

export class Derivitives {
  readonly latestAcceleration = new THREE.Vector3();
  readonly latestVelocity = new THREE.Vector3();
  readonly latestPosition = new THREE.Vector3();
  constructor() { }


  private newVelocity = new THREE.Vector3();
  private updateCount = 0;
  update(pos: THREE.Vector3, deltaS: number) {
    this.newVelocity.copy(pos);
    this.newVelocity.sub(this.latestPosition);
    this.newVelocity.multiplyScalar(1.0 / deltaS);

    this.latestAcceleration.copy(this.newVelocity);
    this.latestAcceleration.sub(this.latestVelocity);
    this.latestAcceleration.multiplyScalar(1.0 / deltaS);

    this.latestVelocity.copy(this.newVelocity);
    this.latestPosition.copy(pos);
    ++this.updateCount;
  }

  isValid(): boolean {
    return this.updateCount >= 3;
  }
}