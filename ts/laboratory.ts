import * as THREE from "three";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Button } from "./button";

import { FloorMaterial } from "./floorMaterial";
import { FogMaterial } from "./fogMaterial";
import { Motion } from "./motion";
import { PaintCylinder } from "./paintCylinder";
// import { ParticleSystem } from "./particleSystem";
import { ProjectionCylinder } from "./projectionCylinder";
import { TactileInterface } from "./tactileInterface";
import { TactileProvider } from "./tactileProvider";

import { World } from "./world";

export class Laboratory extends THREE.Object3D implements World {
  private whiteBoard: PaintCylinder;
  // private particles: ParticleSystem;
  private floorMaterial: FloorMaterial;
  private doneCallback: (next: string) => void;

  constructor(private audioCtx: AudioContext,
    private tactileProvider: TactileProvider,
    motions: Motion[]) {
    super();
    const fogSphere = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 3),
      new FogMaterial());
    fogSphere.position.set(0, -0.4, 0);
    this.add(fogSphere);

    this.floorMaterial = new FloorMaterial();
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(40, 40),
      this.floorMaterial);
    groundPlane.rotateX(Math.PI / 2);
    groundPlane.position.set(0, -0.4, 0);

    const clock = new THREE.Clock();
    groundPlane.onBeforeRender = (
      renderer: THREE.WebGLRenderer, scene: THREE.Scene,
      camera: THREE.Camera, geometry: THREE.BufferGeometry,
      material: THREE.Material, group: THREE.Group) => {
      const deltaS = clock.getDelta();
      this.floorMaterial.setT(0.05 * clock.elapsedTime);
      // this.addRandomDot(deltaS);
    }

    this.add(groundPlane);
    // this.particles = new ParticleSystem();
    // this.scene.add(this.particles);
    this.whiteBoard = new PaintCylinder();
    this.whiteBoard.position.set(0, 1.7, 0);
    this.add(this.whiteBoard);
    {
      const light1 = new THREE.DirectionalLight('white', 0.8);
      light1.position.set(0, 5, 0);
      this.add(light1);
      // const light2 = new THREE.DirectionalLight('white', 0.1);
      // light2.position.set(0, -5, 0);
      // this.scene.add(light2);
      const light3 = new THREE.AmbientLight('white', 0.2);
      this.add(light3);
    }

    this.loadPlatform();
    const projection = new ProjectionCylinder(this.whiteBoard, 1.5);

    const tactile = new TactileInterface(
      this.whiteBoard, projection, this, audioCtx, motions);
    tactileProvider.addSink(tactile);
  }

  public run(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.doneCallback = resolve;
    });
  }

  // private slowColor = new THREE.Color('#0ff');
  // private mediumColor = new THREE.Color('#00f');
  // private fastColor = new THREE.Color('#f0f');

  // private addRandomDot(deltaS: number) {
  //   const r = 1.5 * Math.sqrt(Math.random());
  //   const t = Math.PI * 2 * Math.random();
  //   const y = Math.random() * 0.1;
  //   const p = new THREE.Vector3(
  //     r * Math.cos(t), y, r * Math.sin(t));
  //   const v = new THREE.Vector3(
  //     0.1 * (Math.random() - 0.5),
  //     0.05 * (Math.random() + 0.01),
  //     0.1 * (Math.random() - 0.5));
  //   let color = this.fastColor;
  //   if (deltaS > 1 / 50) {
  //     color = this.slowColor;
  //   } else if (deltaS > 1 / 85) {
  //     color = this.mediumColor;
  //   }
  //   this.particles.AddParticle(p, v, color);
  // }


  private getNamedObject(name: string, o: THREE.Object3D): THREE.Object3D {
    console.log(`'${o.name}'`);
    if (o.name === name) {
      return o;
    }
    for (const child of o.children) {
      const match = this.getNamedObject(name, child);
      if (match) {
        return match;
      }
    }
    return null;
  }

  private loadPlatform() {
    const loader = new GLTFLoader();
    loader.load('model/platform.gltf', (gltf) => {
      this.add(gltf.scene);
      const buttonObject = this.getNamedObject('Power_Button', gltf.scene);
      if (buttonObject === null) {
        console.log('not found.');
      }
      new Button(buttonObject, this.tactileProvider,
        () => { this.doneCallback(null) });
    });
  }
}