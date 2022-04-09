import * as THREE from "three";
import { Tick, Ticker } from "./ticker";

export class Motion extends THREE.Object3D implements Ticker {
  private prevX = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly p = new THREE.Vector3();
  readonly orientX = new THREE.Vector3();
  readonly orientY = new THREE.Vector3();
  readonly orientZ = new THREE.Vector3();
  readonly rayZ = new THREE.Ray();
  private distanceToCamera = 0;

  private v = new THREE.Vector3();
  constructor(private camera: THREE.Object3D) {
    super();
    { // X
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#f00' });
      const lineGeometry = new THREE.BufferGeometry()
        .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0.2, 0, 0)]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.add(line);
    }
    { // Y
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#0f0' });
      const lineGeometry = new THREE.BufferGeometry()
        .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0.2, 0)]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.add(line);
    }
  }

  tick(t: Tick) {
    this.updateMatrixWorld();
    this.p.set(1, 0, 0);
    this.p.applyMatrix3(this.normalMatrix);
    this.orientX.copy(this.p);
    this.p.set(0, 1, 0);
    this.p.applyMatrix3(this.normalMatrix);
    this.orientY.copy(this.p);
    this.p.set(0, 0, 1);
    this.p.applyMatrix3(this.normalMatrix);;
    this.orientZ.copy(this.p);
    this.rayZ.direction.copy(this.orientZ);

    this.getWorldPosition(this.p);
    this.p.sub(this.camera.position);
    this.p.y = 0;  // Only consider distance on the X-Z plane.
    this.distanceToCamera = this.p.length();

    this.getWorldPosition(this.p);
    this.rayZ.origin.copy(this.p);
    if (t.deltaS > 0) {
      this.v.copy(this.p);
      this.v.sub(this.prevX);
      this.v.multiplyScalar(1 / t.deltaS);
      this.velocity.lerp(this.v, 0.2);
    }
    this.prevX.copy(this.p);
  }

  getDistanceToCamera(): number {
    return this.distanceToCamera;
  }
}