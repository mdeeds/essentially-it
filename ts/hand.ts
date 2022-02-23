import * as THREE from "three";
import { Object3D } from "three";
import { PaintCylinder } from "./paintCylinder";
import { ParticleSystem } from "./particleSystem";
import { TactileInterface } from "./tactileInterface";

export type Side = 'left' | 'right';

export class Hand {
  readonly gamepad: Gamepad;
  private grip: THREE.Group;
  private line: Object3D;
  private penDown: boolean;

  constructor(readonly side: Side, private scene: THREE.Object3D,
    renderer: THREE.WebGLRenderer, private tactile: TactileInterface,
    private particles: ParticleSystem) {
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
      .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -10, 0)]);
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.grip.add(this.line);

    this.scene.add(this.grip);
  }

  private ray = new THREE.Ray();
  private minusZ = new THREE.Vector3(0, -1, 0);

  private handleSelectStart(ev: any) {
    this.tactile.start(this.ray, this.side == 'left' ? 0 : 1);
    this.penDown = true;
  }

  private handleSelectEnd(ev: any) {
    this.tactile.end(this.side == 'left' ? 0 : 1);
    this.penDown = false;
  }

  private v = new THREE.Vector3();
  private p = new THREE.Vector3();
  private penUpColor = new THREE.Color('#0ff');
  private penDownColor = new THREE.Color('#ff0');
  tick() {
    this.grip.getWorldPosition(this.p);
    this.v.copy(this.minusZ);
    this.grip.localToWorld(this.v);
    this.v.sub(this.p);
    this.ray.set(this.p, this.v);

    this.v.copy(this.ray.direction);
    this.v.multiplyScalar(0.05);

    if (this.penDown) {
      this.particles.AddParticle(this.ray.origin, this.v, this.penDownColor);
      this.tactile.move(this.ray, this.side == 'left' ? 0 : 1);
    } else {
      this.particles.AddParticle(this.ray.origin, this.v, this.penUpColor);
    }
  }
}