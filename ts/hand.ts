import * as THREE from "three";
import { Object3D } from "three";
import { Debug } from "./debug";
import { Motion } from "./motion";
import { ParticleSystem } from "./particleSystem";
import { TactileProvider } from "./tactileProvider";
import { Tick, Ticker } from "./ticker";

export type Side = 'left' | 'right';

export class Hand extends THREE.Object3D implements Ticker {
  readonly gamepad: Gamepad;
  private motion: Motion;
  private grip: THREE.Group;
  private line: Object3D;
  private penDown: boolean;

  constructor(readonly side: Side, private scene: THREE.Object3D,
    renderer: THREE.WebGLRenderer, private tactile: TactileProvider,
    private particleSystem: ParticleSystem, camera: THREE.Object3D) {
    super();
    this.motion = new Motion(camera);
    this.motion.position.set(0, -0.25, -0.15);
    const index = (side == 'right') ? 0 : 1;
    this.grip = renderer.xr.getControllerGrip(index);
    for (const [key, value] of Object.entries(this.grip.userData)) {
      Debug.log(`${side} Grip ${key}=${value}`);
    }
    for (const [key, value] of Object.entries(renderer.xr.getHand(index))) {
      Debug.log(`${side} Hand ${key}=${value}`);
    }
    this.grip.add(this.motion);
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

  public getMotion(): Motion {
    return this.motion;
  }

  private setUpMeshes() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: '#def' });
    const lineGeometry = new THREE.BufferGeometry()
      .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -10, 0)]);
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    this.grip.add(this.line);
    this.grip.add(this);
    this.scene.add(this.grip);
  }

  private ray = new THREE.Ray();
  private minusZ = new THREE.Vector3(0, -1, 0);

  private blue = new THREE.Color('#aa4');
  private red = new THREE.Color('#4aa');
  private pink = new THREE.Color('#4a8');

  private handleSelectStart(ev: any) {
    this.tactile.start(this.ray, this.side == 'left' ? 0 : 1);
    // this.particleSystem.AddParticle(this.ray.origin, this.ray.direction,
    //   this.red);
    this.penDown = true;
  }

  private handleSelectEnd(ev: any) {
    this.tactile.end(this.side == 'left' ? 0 : 1);
    this.penDown = false;
    // this.particleSystem.AddParticle(this.ray.origin, this.ray.direction,
    //   this.blue);
  }

  private v = new THREE.Vector3();
  private p = new THREE.Vector3();
  public tick(t: Tick) {
    this.p.set(0, 0, 0);
    this.v.set(Math.random() * 0.1 - 0.05, 0.1, Math.random() * 0.1 - 0.05);
    this.particleSystem.AddParticle(this.p, this.v, this.pink);
    this.grip.getWorldPosition(this.p);
    this.v.copy(this.minusZ);
    this.grip.localToWorld(this.v);
    this.v.sub(this.p);
    this.ray.set(this.p, this.v);
    if (this.penDown) {
      // this.particleSystem.AddParticle(this.ray.origin, this.ray.direction,
      //   this.pink);
      this.tactile.move(this.ray, this.side == 'left' ? 0 : 1);
    } else {
      // this.v.set(0, 0.1, 0);
      // this.particleSystem.AddParticle(this.ray.origin, this.v, this.blue);
    }
  }
}