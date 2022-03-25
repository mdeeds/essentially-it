import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

import { Hand } from "./hand";
import { Laboratory } from "./laboratory";
import { TactileProvider } from "./tactileProvider";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private keysDown = new Set<string>();
  private hands: Hand[] = [];

  private laboratory: Laboratory;
  private tactileProvider = new TactileProvider();

  constructor(private audioCtx: AudioContext) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      /*fov=*/75, /*aspec=*/1024 / 512, /*near=*/0.1,
      /*far=*/100);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -2);
    this.scene.add(this.camera);

    this.setUpRenderer();

    this.setUpAnimation();
    this.hands.push(
      new Hand('left', this.scene, this.renderer, this.tactileProvider))
    this.hands.push(
      new Hand('right', this.scene, this.renderer, this.tactileProvider))
    this.setUpKeyHandler();
    this.setUpTouchHandlers();
    this.run();
  }

  private async run() {
    const labObject = new THREE.Group();
    const laboratory = new Laboratory(this.audioCtx, labObject, this.tactileProvider);
    this.scene.add(labObject);
    // TODO: This should go into a loop somehow.
    await this.laboratory.run();
  }

  private getRay(ev: Touch | PointerEvent): THREE.Ray {
    const x = (ev.clientX / 1024) * 2 - 1;
    const y = 1 - (ev.clientY / 512) * 2;
    const ray = this.rayFromCamera(x, y);
    return ray;
  }

  private getTouchIndex(id: number, idToIndex: Map<number, number>): number {
    if (idToIndex.has(id)) {
      return idToIndex.get(id);
    }
    const index = idToIndex.size % 2;
    idToIndex.set(id, index);
    return index;
  }

  private setUpTouchHandlers() {
    const canvas = document.querySelector('canvas');

    const lastIndex = 0;
    const idToIndex = new Map<number, number>();

    canvas.addEventListener('touchstart',
      (ev: TouchEvent) => {
        for (let i = 0; i < ev.touches.length; ++i) {
          const index = this.getTouchIndex(ev.touches[i].identifier,
            idToIndex);
          const ray = this.getRay(ev.touches[i]);
          this.tactileProvider.start(ray, index);
        }
        ev.preventDefault();
      });
    canvas.addEventListener('touchmove',
      (ev: TouchEvent) => {
        for (let i = 0; i < ev.touches.length; ++i) {
          const index = this.getTouchIndex(ev.touches[i].identifier,
            idToIndex);
          const ray = this.getRay(ev.touches[i]);
          this.tactileProvider.move(ray, index);
        }
        ev.preventDefault();
      });
    const handleEnd = (ev: TouchEvent) => {
      for (const index of idToIndex.values()) {
        this.tactileProvider.end(index);
      }
      idToIndex.clear();
      ev.preventDefault();
    };
    canvas.addEventListener('touchend', handleEnd);
    canvas.addEventListener('touchcancel', handleEnd);
  }

  private rayFromCamera(x: number, y: number): THREE.Ray {
    const ray = new THREE.Ray();
    ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
    ray.direction.set(x, y, 0.5).unproject(this.camera)
      .sub(ray.origin).normalize();
    return ray;
  }


  private clock = new THREE.Clock(/*autostart=*/true);
  private animationLoop() {
    let deltaS = this.clock.getDelta();
    deltaS = Math.min(0.1, deltaS);
    this.renderer.render(this.scene, this.camera);
    this.handleKeys();
  }

  private setUpAnimation() {
    this.renderer.setAnimationLoop(
      (function (self: Game) {
        return function () { self.animationLoop(); }
      })(this));
  }

  private setUpRenderer() {
    this.renderer.setSize(1024, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;
  }

  private p = new THREE.Vector3();
  private f = new THREE.Vector3();
  private r = new THREE.Vector3();
  private handleKeys() {
    if (this.keysDown.size == 0) {
      return;
    }
    this.p.set(0, 0, 0);
    this.p.applyMatrix4(this.camera.matrix);
    this.f.set(0, 0, 0.01);
    this.f.applyMatrix4(this.camera.matrix);
    this.f.sub(this.p);
    this.r.set(0.01, 0, 0);
    this.r.applyMatrix4(this.camera.matrix);
    this.r.sub(this.p);
    if (this.keysDown.has('ArrowLeft')) {
      this.camera.rotateY(0.03);
    }
    if (this.keysDown.has('ArrowRight')) {
      this.camera.rotateY(-0.03);
    }
    if (this.keysDown.has('ArrowUp')) {
      this.camera.rotateX(0.03);
    }
    if (this.keysDown.has('ArrowDown')) {
      this.camera.rotateX(-0.03);
    }
    if (this.keysDown.has('KeyW')) {
      this.camera.position.sub(this.f);
    }
    if (this.keysDown.has('KeyS')) {
      this.camera.position.add(this.f);
    }
    if (this.keysDown.has('KeyA')) {
      this.camera.position.sub(this.r);
    }
    if (this.keysDown.has('KeyD')) {
      this.camera.position.add(this.r);
    }
  }

  private setUpKeyHandler() {
    document.body.addEventListener('keydown', (ev: KeyboardEvent) => {
      this.keysDown.add(ev.code);
    });
    document.body.addEventListener('keyup', (ev: KeyboardEvent) => {
      this.keysDown.delete(ev.code);
    });
  }
}