import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { Hand } from "./hand";
import { PaintCylinder } from "./paintCylinder";
import { ParticleSystem } from "./particleSystem";
import { TactileInterface } from "./tactileInterface";
import { ProjectionCylinder } from "./projectionCylinder";
import { FogMaterial } from "./fogMaterial";
import { FloorMaterial } from "./floorMaterial";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private whiteBoard: PaintCylinder;
  private particles: ParticleSystem;
  private keysDown = new Set<string>();

  private tactile: TactileInterface;

  private hands: Hand[] = [];

  private floorMaterial: FloorMaterial;

  constructor(private audioCtx: AudioContext) {
    this.scene = new THREE.Scene();

    const fogSphere = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 3),
      new FogMaterial());
    fogSphere.position.set(0, -0.4, 0);
    this.scene.add(fogSphere);

    this.floorMaterial = new FloorMaterial();
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(40, 40),
      this.floorMaterial);
    groundPlane.rotateX(Math.PI / 2);
    groundPlane.position.set(0, -0.4, 0);
    this.scene.add(groundPlane);

    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      /*fov=*/75, /*aspec=*/1280 / 720, /*near=*/0.1,
      /*far=*/100);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -2);
    this.scene.add(this.camera);

    this.particles = new ParticleSystem();
    this.scene.add(this.particles);

    // const sphere = new THREE.Mesh(
    //   new THREE.SphereBufferGeometry(0.1),
    //   new THREE.MeshBasicMaterial({ color: 'white' }));
    // sphere.position.set(0, 1.7, -5);
    // this.scene.add(sphere);
    this.whiteBoard = new PaintCylinder();
    this.whiteBoard.position.set(0, 1.7, 0);
    this.scene.add(this.whiteBoard);

    {
      const light = new THREE.DirectionalLight('white', 2.0);
      light.position.set(0, 5, 0);
      this.scene.add(light);
      const light2 = new THREE.DirectionalLight('white', 2.0);
      light2.position.set(2, 1, -5);
      this.scene.add(light2);
    }

    this.loadPlatform();

    const projection = new ProjectionCylinder(this.whiteBoard, 1.5);
    this.tactile = new TactileInterface(this.whiteBoard, projection);

    this.setUpRenderer();
    this.setUpAnimation();
    this.hands.push(
      new Hand('left', this.scene, this.renderer, this.tactile, this.particles))
    this.hands.push(
      new Hand('right', this.scene, this.renderer, this.tactile, this.particles))
    this.setUpKeyHandler();
    this.setUpTouchHandlers();
  }

  private loadPlatform() {
    const loader = new GLTFLoader();
    loader.load('model/platform.gltf', (gltf) => {
      this.scene.add(gltf.scene);
    });
  }

  private getRay(ev: Touch | PointerEvent): THREE.Ray {
    const x = (ev.clientX / 1280) * 2 - 1;
    const y = 1 - (ev.clientY / 720) * 2;
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
          this.tactile.start(ray, index);
        }
        ev.preventDefault();
      });
    canvas.addEventListener('touchmove',
      (ev: TouchEvent) => {
        for (let i = 0; i < ev.touches.length; ++i) {
          const index = this.getTouchIndex(ev.touches[i].identifier,
            idToIndex);
          const ray = this.getRay(ev.touches[i]);
          this.tactile.move(ray, index);
        }
        ev.preventDefault();
      });
    const handleEnd = (ev: TouchEvent) => {
      for (const index of idToIndex.values()) {
        this.tactile.end(index);
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
    this.floorMaterial.setT(0.05 * this.clock.elapsedTime);
    this.renderer.render(this.scene, this.camera);
    this.handleKeys();
    for (const h of this.hands) {
      h.tick();
    }
    this.particles.step(deltaS);
  }

  private setUpAnimation() {
    this.renderer.setAnimationLoop(
      (function (self: Game) {
        return function () { self.animationLoop(); }
      })(this));
  }

  private setUpRenderer() {
    this.renderer.setSize(1280, 720);
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