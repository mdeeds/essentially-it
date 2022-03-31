import * as THREE from "three";

export class Motion extends THREE.Object3D {
  private prevX = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly p = new THREE.Vector3();
  private v = new THREE.Vector3();
  constructor() {
    super();
    this.onBeforeRender = (
      renderer: THREE.WebGLRenderer, scene: THREE.Scene,
      camera: THREE.Camera, geometry: THREE.BufferGeometry,
      material: THREE.Material, group: THREE.Group) => {
      this.getWorldPosition(this.p);
      this.v.copy(this.p);
      this.v.sub(this.prevX);
      this.velocity.lerp(this.v, 0.2);
      this.prevX.copy(this.p);
    }
  }
}