import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { PaintCylinder } from "./paintCylinder";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  constructor(private audioCtx: AudioContext) {
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      /*fov=*/75, /*aspec=*/1280 / 720, /*near=*/0.1,
      /*far=*/100);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.6, -2);
    this.scene.add(this.camera);

    const sphere = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.1),
      new THREE.MeshBasicMaterial({ color: 'white' }));
    sphere.position.set(0, 1.7, -5);
    this.scene.add(sphere);
    const paint = new PaintCylinder();
    paint.position.set(0, 1.7, 0);
    this.scene.add(paint);

    this.setUpRenderer();
    this.setUpAnimation();
  }

  private animationLoop() {
    this.renderer.render(this.scene, this.camera);
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
    this.renderer.xr.enabled = true

  }
}