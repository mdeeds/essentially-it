import * as THREE from "three";

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Tick, Ticker } from "../ticker";
import { Grass } from "./grass";

class Firestarter {
  private scene = new THREE.Scene();
  private universe = new THREE.Group();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor() {
    document.body.innerHTML = '';
    this.scene.fog = new THREE.FogExp2('#9ef', 0.0025);

    this.scene.add(this.universe);
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, /*near=*/0.1, /*far=*/20e9);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    // const skyBox = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(100, 100, 100),
    //   new THREE.MeshBasicMaterial({ color: '#9ef', side: THREE.BackSide })
    // )
    // this.scene.add(skyBox);

    const grass = new Grass();
    this.universe.add(grass);

    const clock = new THREE.Clock();
    let elapsedS = 0.0;
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      const t = new Tick(elapsedS, deltaS);
      this.scene.traverseVisible((o: THREE.Object3D) => {
        if (o['tick']) {
          (o as any as Ticker).tick(t);
        }
      });
    });
  }
}

new Firestarter();