import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { Object3D } from "three";
import { TwoHands } from "../hamburger/twoHands";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import { MarchingCubes } from "./marchingCubes";
import { ThirdPersonCamera } from "./thirdPersonCamera";
import { Zoa } from "./zoa";
import { CubeTexture } from "./cubeTexture";

export class Luna extends THREE.Object3D implements World, Ticker {
  private cameraPos = new Object3D();
  private zoa = new Zoa();
  private twoHands: TwoHands;
  constructor(private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer) {
    super();
    camera.add(this.cameraPos);
    const light = new THREE.HemisphereLight('#fff', '#222');
    this.add(light);
    this.zoa.position.set(0, 0.9, -2.0);
    const tpc = new ThirdPersonCamera(this.zoa);
    this.add(this.zoa);
    this.twoHands = new TwoHands(renderer.xr);

    const tex = new CubeTexture();
    for (let i = 0; i < 7; ++i) {
      console.time('Sphere');
      tex.setSphere(new THREE.Vector3(
        Math.random() * 4 - 2, Math.random() - 1, Math.random() * 4 - 2), 1);
      console.timeEnd('Sphere');
    }
    tex.setSphere(new THREE.Vector3(0, 1.5, -5), 0.5);

    const sdf = (pos: THREE.Vector3) => {
      return tex.sdf(pos);
    }
    const g = new MarchingCubes(sdf, 4.0, new THREE.Vector3(0, 0, 0), 32);
    console.time('Merge');
    const mg = BufferGeometryUtils.mergeVertices(g, 0.01);
    console.timeEnd('Merge');
    console.time('Normals');
    mg.computeVertexNormals();
    console.timeEnd('Normals');

    const m = new THREE.Mesh(mg,
      //  new THREE.MeshBasicMaterial({ color: '#048' }));
      new THREE.MeshStandardMaterial(
        { color: '#048', side: THREE.DoubleSide }));
    this.add(m);
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private spacePressed = false;
  private previousY = undefined;
  private currentCameraPosition = new THREE.Vector3();

  private leftPosition = new THREE.Vector3();
  private rightPosition = new THREE.Vector3();
  private updateRotation() {
    if (!this.twoHands.isInitialized()) {
      return;
    }
    this.twoHands.getLeftPosition(this.leftPosition);
    this.twoHands.getRightPosition(this.rightPosition);
    const deltaY = this.rightPosition.y - this.leftPosition.y;
    const deltaX = this.rightPosition.x - this.leftPosition.x;
    const deltaZ = this.rightPosition.z - this.leftPosition.z;
    const deltaXZ = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    const tilt = Math.atan2(deltaY, deltaXZ);
    this.zoa.rotation.z = tilt;
    this.zoa.quaternion.setFromEuler(this.zoa.rotation);
  }


  tick(t: Tick) {
    this.cameraPos.getWorldPosition(this.currentCameraPosition);
    if (this.previousY) {
      const deltaY = this.currentCameraPosition.y - this.previousY;
      if (deltaY > 0) {
        this.zoa.position.y += 2.0 * deltaY;
      }
    }
    this.zoa.position.y -= 0.3 * t.deltaS;
    if (this.zoa.position.y < 0.0) {
      this.zoa.position.y = 0.0;
    }
    this.updateRotation();
    this.previousY = this.currentCameraPosition.y;
  }

}