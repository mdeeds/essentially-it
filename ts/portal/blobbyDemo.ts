import { resolve } from 'path/posix';
import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Tick, Ticker } from '../ticker';
import { World } from '../world';
import { Portal } from './portal';


export class BlobbyDemo extends THREE.Object3D implements World, Ticker {
  private leftPortal: Portal;
  private rightPortal: Portal;

  constructor(private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer) {
    super();
    this.init();
  }
  async run(): Promise<string> {
    return new Promise<string>((resolve) => { });
  }

  init() {
    console.log('Init');
    const container = document.body;

    container.appendChild(this.renderer.domElement);
    container.appendChild(VRButton.createButton(this.renderer));

    // renderer.localClippingEnabled = true;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshPhongMaterial({ color: '#66f' })
    );
    floor.rotateX(-Math.PI / 2);
    this.add(floor);

    for (let i = 0; i < 20; ++i) {
      const color = new THREE.Color(
        Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5);
      const ball = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(0.2, 3),
        new THREE.MeshPhongMaterial({ color: color })
      );
      ball.position.set(
        Math.random() * 4 - 2, Math.random(), Math.random() * 4 - 2);
      this.add(ball);
    }

    this.leftPortal = new Portal(2, 2);
    this.leftPortal.position.set(-2, 1.5, -2);
    this.leftPortal.rotateY(Math.PI / 8);
    this.add(this.leftPortal);

    this.rightPortal = new Portal(1, 1);
    this.rightPortal.position.set(2, 1.5, -2);
    this.rightPortal.rotateY(-Math.PI / 8)
    this.add(this.rightPortal);

    // lights
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 200);
    mainLight.position.y = 60;
    this.add(mainLight);

    window.addEventListener('resize', () => { this.onWindowResize(); });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  tick(t: Tick) {
    // save the original camera properties
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    const currentShadowAutoUpdate = this.renderer.shadowMap.autoUpdate;
    this.renderer.xr.enabled = false; // Avoid camera modification
    this.renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    this.leftPortal.render(this.rightPortal, this.camera, this.renderer, this);
    this.rightPortal.render(this.leftPortal, this.camera, this.renderer, this);

    // restore the original rendering properties
    this.renderer.xr.enabled = currentXrEnabled;
    this.renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    this.renderer.setRenderTarget(currentRenderTarget);
  }

}