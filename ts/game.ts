import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Hand } from "./hand";
import { PaintCylinder } from "./paintCylinder";
import { ParticleSystem } from "./particleSystem";

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  private whiteBoard: PaintCylinder;
  private particles: ParticleSystem;

  private hands: Hand[] = [];

  constructor(private audioCtx: AudioContext) {
    this.scene = new THREE.Scene()
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

    this.setUpTouchHandlers();
    this.setUpRenderer();
    this.setUpAnimation();
    this.hands.push(
      new Hand('left', this.scene, this.renderer, this.whiteBoard, this.particles))
    this.hands.push(
      new Hand('right', this.scene, this.renderer, this.whiteBoard, this.particles))
  }

  private getRay(ev: Touch | MouseEvent): THREE.Ray {
    const x = (ev.clientX / 1280) * 2 - 1;
    const y = -(ev.clientY / 720) * 2 + 1;
    const ray = this.rayFromCamera(x, y);
    return ray;
  }

  private setUpTouchHandlers() {
    document.body.addEventListener('touchstart',
      (ev: TouchEvent) => {
        if (ev.touches.length === 1) {
          const ray = this.getRay(ev.touches[0]);
          this.whiteBoard.paintDown(ray);
        }
      },
      false);
    document.body.addEventListener('touchmove',
      (ev: TouchEvent) => {
        if (ev.touches.length === 1) {
          const ray = this.getRay(ev.touches[0]);
          this.whiteBoard.paintMove(ray);
        }
      },
      false);
    document.body.addEventListener('touchend',
      (ev: TouchEvent) => {
        if (ev.touches.length === 1) {
          const ray = this.getRay(ev.touches[0]);
          this.whiteBoard.paintUp(ray);
        }
      },
      false);
  }

  private rayFromCamera(x: number, y: number): THREE.Ray {
    const ray = new THREE.Ray();
    ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
    ray.direction.set(x, y, 0.5).unproject(this.camera)
      .sub(ray.origin).normalize();
    return ray;
  }

  private particleColor = new THREE.Color('#abf');
  private clock = new THREE.Clock(/*autostart=*/true);
  private animationLoop() {
    let deltaS = this.clock.getDelta();
    deltaS = Math.max(0.1, deltaS);
    this.renderer.render(this.scene, this.camera);
    for (const h of this.hands) {
      h.tick();
    }
    this.particles.AddParticle(
      new THREE.Vector3((Math.random() - 0.5) * 5, 1.0, (Math.random() - 0.5) * 5),
      new THREE.Vector3(0.01 * (Math.random() - 0.5), 0.03 * (Math.random()), 0.01 * (Math.random() - 0.5)),
      this.particleColor);
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
    this.renderer.xr.enabled = true
  }
}