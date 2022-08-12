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
import { ParticleSystem } from "../particleSystem";

export class Luna extends THREE.Object3D implements World, Ticker {
  private cameraPos = new Object3D();
  private zoa = new Zoa();
  private twoHands: TwoHands;
  private particles: ParticleSystem;
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
        Math.random() * 8 - 4, Math.random() - 1, Math.random() * 8 - 4), 1);
      console.timeEnd('Sphere');
    }

    const sdf = (pos: THREE.Vector3) => {
      return tex.sdf(pos);
    }
    // Voxels are 0.1m apart.
    // Cube radius should be 0.05m
    // 64 partitions means the total size should be 6.4 meters across
    // So the radius of the marching cubes should be 3.2.
    const g = new MarchingCubes(sdf, 3.2, new THREE.Vector3(0, 0, 0), 64);
    console.time('Merge');
    const mg = BufferGeometryUtils.mergeVertices(g, 0.01);
    console.timeEnd('Merge');
    console.time('Normals');
    mg.computeVertexNormals();
    console.timeEnd('Normals');
    console.time('Colors');
    this.addVertexColors(mg, sdf);
    console.timeEnd('Colors');

    const m = new THREE.Mesh(mg,
      //  new THREE.MeshBasicMaterial({ color: '#048' }));
      new THREE.MeshPhongMaterial(
        { color: '#048', side: THREE.FrontSide, vertexColors: true }));
    this.add(m);

    this.particles = new ParticleSystem(THREE.AdditiveBlending);
    this.add(this.particles);
  }

  private addVertexColors(mg: THREE.BufferGeometry,
    sdf: (pos: THREE.Vector3) => number) {
    const colors: number[] = [];
    const positions = mg.getAttribute('position');
    const normals = mg.getAttribute('normal');

    const tmpP = new THREE.Vector3();
    const tmpN = new THREE.Vector3();
    const epsilon = 0.1;
    const kOcclusionSteps = 10;
    for (let i = 0; i < positions.count; ++i) {
      tmpP.fromBufferAttribute(positions, i);
      tmpN.fromBufferAttribute(normals, i);
      tmpN.multiplyScalar(epsilon);
      let al = 0.0;
      for (let j = 0; j < kOcclusionSteps; ++j) {
        tmpP.add(tmpN);
        al += 1 - ((j * epsilon) - sdf(tmpP));
      }
      al *= 1 / kOcclusionSteps;
      al = Math.pow(al, 2.2);

      colors.push(al, al, al);
      // colors.push(1, 1, 1);
    }
    mg.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(colors), 3));
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

    const p = new THREE.Vector3(
      Math.random() * 0.1 - 0.05,
      Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05);
    p.add(this.zoa.position);
    const v = new THREE.Vector3(0, -0.01, 0);
    v.applyMatrix3(this.zoa.normalMatrix);
    this.particles.AddParticle(p, v, new THREE.Color(
      Math.random() * 0.1 + 0.9, Math.random() * 0.1 + 0.9, Math.random() * 0.1 + 0.9));
  }

}