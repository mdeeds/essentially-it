import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

import { Hand } from "./hand";
import { Home } from "./home/home";
import { Laboratory } from "./laboratory";
import { ParticleSystem } from "./particleSystem";
import { S } from "./settings";
import { TactileProvider } from "./tactileProvider";
import { World } from "./world";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private keysDown = new Set<string>();
  private hands: Hand[] = [];

  private tactileProvider = new TactileProvider();

  constructor(private audioCtx: AudioContext) {
    this.scene = new THREE.Scene();
    this.scene.name = 'The Scene';

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      /*fov=*/75, /*aspec=*/1024 / 512, /*near=*/0.1,
      /*far=*/1100);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -2);
    this.camera.name = 'The Camera';
    this.scene.add(this.camera);

    this.setUpRenderer();

    this.setUpAnimation();

    const particleSystem = new ParticleSystem();
    this.scene.add(particleSystem);

    this.hands.push(
      new Hand('left', this.scene, this.renderer,
        this.tactileProvider, particleSystem))
    this.hands.push(
      new Hand('right', this.scene, this.renderer,
        this.tactileProvider, particleSystem))
    this.setUpKeyHandler();
    this.setUpTouchHandlers();
    this.logScene(this.scene, 'Early: ');
    this.run(S.float('sh') ? 'home' : 'lab');
  }

  private lab: Laboratory = null;
  private home: Home = null;

  private logScene(o: THREE.Object3D, padding: string) {
    const p = new THREE.Vector3();
    o.getWorldPosition(p);
    console.log(`${padding}${o.name} @ ` +
      `${o.position.x.toFixed(3)},${o.position.y.toFixed(3)},${o.position.z.toFixed(3)} ` +
      `s:${o.scale.length()}`);
    // `w:${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`);
    for (const c of o.children) {
      this.logScene(c, padding + ' ');
    }
  }

  private async run(location: string) {
    let nextWorld: World = null;
    console.log(this.camera.position);
    const p = new THREE.Vector3();
    this.camera.getWorldPosition(p);
    console.log(p);

    switch (location) {
      case 'lab':
        if (this.lab === null) {
          this.lab = new Laboratory(
            this.audioCtx, this.tactileProvider,
            [this.hands[0].motion, this.hands[1].motion]);
          this.lab.position.set(0, 0, 0);
        }
        nextWorld = this.lab;
        break;
      case 'home': default:
        if (this.home === null) {
          this.home = new Home();
        }
        nextWorld = this.home;
        break;
    }
    this.scene.add(nextWorld);
    this.logScene(this.scene, 'Initial: ');
    await this.expand(nextWorld);
    this.logScene(this.scene, 'Expanded: ');

    console.log('Position of world:');
    console.log(nextWorld.position);
    nextWorld.getWorldPosition(p);
    console.log(p);

    const nextWorldName = await nextWorld.run();
    console.log('Shrink start')
    await this.shrink(nextWorld);
    console.log('Shrink end')
    this.logScene(this.scene, 'Shrunken: ');
    this.scene.remove(nextWorld);
    setTimeout(() => { this.run(nextWorldName) });
  }

  private async expand(o: THREE.Object3D) {
    await this.animateScale(o, 0.01, 1.0, 1.03);
  }

  private async shrink(o: THREE.Object3D) {
    await this.animateScale(o, 1, 0.01, 0.97);
  }

  private async animateScale(
    o: THREE.Object3D, initialScale: number, finalScale: number,
    multiplier: number): Promise<void> {
    let scale = initialScale;
    let frameDone: () => void;

    const nextFrame = async (): Promise<void> => {
      return new Promise<void>((resolve) => {
        frameDone = resolve;
      });
    }

    this.scene.onBeforeRender = ((
      renderer: THREE.WebGLRenderer, scene: THREE.Scene,
      camera: THREE.Camera, renderTarget: any) => {
      o.scale.set(scale, scale, scale);
      o.position.set(0, 0, 0);
      o.updateMatrix();
      o.updateMatrixWorld();
      frameDone();
    });

    console.log('booleans');
    console.log((scale > finalScale));
    console.log((multiplier > 1));
    console.log((scale > finalScale) != (multiplier > 1));

    while ((scale > finalScale) != (multiplier > 1)) {
      await nextFrame();
      scale = scale * multiplier;
    }
    scale = finalScale;
    await nextFrame();

    this.scene.onBeforeRender = function () { };
    return new Promise<void>((resolve) => { resolve(); });
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