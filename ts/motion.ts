import * as THREE from "three";
import { Tick, Ticker } from "./ticker";

export class Motion extends THREE.Object3D implements Ticker {
  private prevX = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly p = new THREE.Vector3();
  readonly orientX = new THREE.Vector3();
  readonly orientY = new THREE.Vector3();
  readonly orientZ = new THREE.Vector3();
  private distanceToCamera = 0;

  private v = new THREE.Vector3();
  constructor(private camera: THREE.Object3D) {
    super();
  }

  tick(t: Tick) {
    this.updateMatrixWorld();
    this.p.set(1, 0, 0);
    this.p.applyMatrix4(this.matrixWorld);
    this.orientX.copy(this.p);
    this.p.set(0, 1, 0);
    this.p.applyMatrix4(this.matrixWorld);
    this.orientY.copy(this.p);
    this.p.set(0, 0, 1);
    this.p.applyMatrix4(this.matrixWorld);
    this.orientZ.copy(this.p);

    this.getWorldPosition(this.p);
    this.p.sub(this.camera.position);
    this.distanceToCamera = this.p.length();

    this.getWorldPosition(this.p);
    this.v.copy(this.p);
    this.v.sub(this.prevX);
    this.velocity.lerp(this.v, 0.2);
    this.prevX.copy(this.p);
  }

  getDistanceToCamera(): number {
    return this.distanceToCamera;
  }
}