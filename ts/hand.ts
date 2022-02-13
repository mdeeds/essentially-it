import * as THREE from "three";
import { Object3D } from "three";
import { PaintCylinder } from "./paintCylinder";

export type Side = 'left' | 'right';

export class Hand {
  readonly gamepad: Gamepad;
  private grip: THREE.Group;
  private line: Object3D;
  private penDown: boolean;

  constructor(readonly side: Side, private scene: THREE.Object3D,
    renderer: THREE.WebGLRenderer,
    private paint: PaintCylinder) {
    const index = (side == 'left') ? 0 : 1;
    this.grip = renderer.xr.getControllerGrip(index);
    // this.grip = new THREE.Group();
    this.grip.position.set((index - 0.5) * 0.1, 0.1, -0.1);
    console.log(`Grip name: ${this.grip.name}`);
    const pads = window.navigator.getGamepads();
    if (pads.length > index) {
      this.gamepad = pads[index];
    }
    this.setUpMeshes();
    this.grip.addEventListener(
      'selectstart', (ev) => this.handleSelectStart(ev));
    this.grip.addEventListener(
      'selectend', (ev) => this.handleSelectEnd(ev));
  }

  private setUpMeshes() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#def' });
    const lineGeometry = new THREE.BufferGeometry()
      .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -10)]);
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.grip.add(this.line);

    this.scene.add(this.grip);
  }

  private ray = new THREE.Ray();
  private minusZ = new THREE.Vector3(0, 0, -1);

  private handleSelectStart(ev: any) {
    this.paint.paintDown(this.ray);
    this.penDown = true;
  }

  private handleSelectEnd(ev: any) {
    this.paint.paintUp(this.ray);
    this.penDown = false;
  }

  tick() {
    this.ray.set(this.grip.position, this.minusZ);
    if (this.penDown) {
      this.paint.paintMove(this.ray);
    }
  }
}