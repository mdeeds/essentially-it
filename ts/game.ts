import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ConduitStage } from "./conduit/stage";

import { Hand } from "./hand";
import { Home } from "./home/home";
import { Laboratory } from "./laboratory";
import { Motion } from "./motion";
import { ParticleSystem } from "./particleSystem";
import { S } from "./settings";
import { TactileProvider } from "./tactileProvider";
import { Tick, Ticker } from "./ticker";
import { World } from "./world";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private keysDown = new Set<string>();
  private hands: Hand[] = [];
  private headMotion: Motion;

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
    this.headMotion = new Motion(this.camera);
    this.camera.add(this.headMotion);
    this.scene.add(this.camera);

    this.setUpRenderer();

    this.setUpAnimation();

    const particleSystem = new ParticleSystem();
    this.scene.add(particleSystem);

    this.hands.push(
      new Hand('left', this.scene, this.renderer,
        this.tactileProvider, particleSystem, this.camera))
    this.hands.push(
      new Hand('right', this.scene, this.renderer,
        this.tactileProvider, particleSystem, this.camera))
    this.setUpKeyHandler();
    this.setUpTouchHandlers();
    switch (S.float('sh')) {
      default:
      case 0: this.run('lab'); break;
      case 1: this.run('home'); break;
      case 2: this.run('conduit'); break;
    }
  }

  private lab: Laboratory = null;
  private conduit: ConduitStage = null;
  private home: Home = null;

  private async run(location: string) {
    let nextWorld: World = null;
    switch (location) {
      case 'lab':
        if (this.lab === null) {
          this.lab = new Laboratory(
            this.audioCtx, this.tactileProvider,
            [this.hands[0].getMotion(), this.hands[1].getMotion()]);
          this.lab.position.set(0, 0, 0);
        }
        nextWorld = this.lab;
        break;
      case 'conduit':
        if (this.conduit === null) {
          this.conduit = new ConduitStage(
            this.audioCtx,
            [this.hands[0].getMotion(), this.hands[1].getMotion()]);
          this.conduit.position.set(0, 0, 0);
        }
        nextWorld = this.conduit;
        break;
      case 'home': default:
        if (this.home === null) {
          this.home = new Home();
        }
        nextWorld = this.home;
        break;
    }
    this.scene.add(nextWorld);
    await this.expand(nextWorld);
    this.logScene(this.scene, '#: ');

    const nextWorldName = await nextWorld.run();
    await this.shrink(nextWorld);
    this.scene.remove(nextWorld);
    setTimeout(() => { this.run(nextWorldName) });
  }

  private logScene(o: THREE.Object3D, padding: string) {
    const p = new THREE.Vector3();
    o.getWorldPosition(p);

    let ch = '@';
    if (o instanceof THREE.Scene) {
      ch = 'S';
    } else if (o instanceof THREE.Mesh) {
      ch = 'M';
    }

    console.log(`${padding}${o.name} ${ch} ` +
      `${o.position.x.toFixed(3)},${o.position.y.toFixed(3)},${o.position.z.toFixed(3)} ` +
      `s:${o.scale.x}`);
    // `w:${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`);
    for (const c of o.children) {
      this.logScene(c, padding + ' ');
    }
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

  private doTick(o: THREE.Object3D, t: Tick) {
    if (!o.visible) {
      return;
    }
    if (o['tick']) {
      (o as any as Ticker).tick(t);
    }
    for (const child of o.children) {
      this.doTick(child, t);
    }
  }

  private clock = new THREE.Clock(/*autostart=*/true);
  private animationLoop() {
    let deltaS = this.clock.getDelta();
    deltaS = Math.min(0.1, deltaS);
    this.renderer.render(this.scene, this.camera);
    this.handleKeys();
    this.handleHeadMotion();
    this.doTick(this.scene, new Tick(this.clock.elapsedTime, deltaS));
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

  private handleHeadMotion() {

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