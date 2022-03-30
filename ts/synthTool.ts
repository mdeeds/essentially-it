import { timeStamp } from "console";
import * as THREE from "three";
import { Panel } from "./conduit/panel";

import { Tool } from "./tool";

export class SynthTool implements Tool {
  private panelObject: THREE.Object3D;
  private iconObject: THREE.Object3D = null;

  constructor(scene: THREE.Object3D) {
    this.panelObject = new Panel([null, null, null, null], 2);
    // this.panelObject = new THREE.Mesh(
    //   new THREE.OctahedronBufferGeometry(1, 4),
    //   new THREE.MeshStandardMaterial({ color: '#9a3' }));
    this.panelObject.visible = false;
    scene.add(this.panelObject);

    const cone = new THREE.Mesh(
      new THREE.ConeBufferGeometry(0.5, 1.0, 32, 1),
      new THREE.MeshStandardMaterial({ color: '#9a3' })
    );
    cone.scale.set(0.1, 0.1, 0.1);
    this.iconObject = cone;
  }

  private p = new THREE.Vector3();
  private updatePosition(ray: THREE.Ray) {
    this.p.copy(ray.direction);
    this.p.setLength(2.0);
    this.p.add(ray.origin);
    this.panelObject.position.copy(this.p);
    const theta = Math.atan2(
      ray.direction.x, ray.direction.z);
    this.panelObject.rotation.y = theta + Math.PI;
    this.panelObject.updateMatrix();
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    this.updatePosition(ray);
    this.panelObject.visible = true;
  }
  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    this.updatePosition(ray);
  }

  // Returns true if the work should be committed.
  end(): boolean {
    return false;
  }

  getIconObject(): THREE.Object3D {
    return this.iconObject;
  }
}