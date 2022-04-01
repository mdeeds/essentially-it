import * as THREE from "three";

export class Motion extends THREE.Object3D {
  private prevX = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly p = new THREE.Vector3();
  readonly orientX = new THREE.Vector3();
  readonly orientY = new THREE.Vector3();
  readonly orientZ = new THREE.Vector3();

  private v = new THREE.Vector3();
  constructor() {
    super();
    this.onBeforeRender = (
      renderer: THREE.WebGLRenderer, scene: THREE.Scene,
      camera: THREE.Camera, geometry: THREE.BufferGeometry,
      material: THREE.Material, group: THREE.Group) => {
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
      this.v.copy(this.p);
      this.v.sub(this.prevX);
      this.velocity.lerp(this.v, 0.2);
      this.prevX.copy(this.p);
    }
  }
}