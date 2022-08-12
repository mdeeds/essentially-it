import * as THREE from "three";
import { S } from "../settings";
import { Tick, Ticker } from "../ticker";

export class Grass extends THREE.Object3D implements Ticker {
  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  constructor() {
    super();

    const positions: THREE.Vector3[] = [];
    const index: number[] = [];
    const dx: number[] = [];
    for (let i = 0; i < S.float('fsnb'); ++i) {
      this.addRandomBlade(positions, index, dx);
    }
    this.updateGeometry(positions, index, dx);
    this.setMaterial();

    const mesh = new THREE.Mesh(this.geometry, this.material);
    this.add(mesh);
  }

  private addRandomBlade(
    points: THREE.Vector3[], index: number[], dx: number[]) {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    const y = 0;

    const vertexStart = points.length;
    points.push(new THREE.Vector3(x, y, z));        // 0      3
    points.push(new THREE.Vector3(x, y + 0.4, z));  // 1     / \
    points.push(new THREE.Vector3(x, y + 0.6, z));  // 2    2---4
    points.push(new THREE.Vector3(x, y + 0.7, z));  // 3    | \ |
    points.push(new THREE.Vector3(x, y + 0.6, z));  // 4    1---5
    points.push(new THREE.Vector3(x, y + 0.4, z));  // 5    | \ |
    points.push(new THREE.Vector3(x, y, z));        // 6    0---6

    index.push(vertexStart + 0, vertexStart + 1, vertexStart + 6);
    index.push(vertexStart + 1, vertexStart + 5, vertexStart + 6);
    index.push(vertexStart + 1, vertexStart + 2, vertexStart + 5);
    index.push(vertexStart + 2, vertexStart + 4, vertexStart + 5);
    index.push(vertexStart + 2, vertexStart + 3, vertexStart + 4);

    dx.push(-0.8, -1, -0.6, 0, 0.6, 1, 0.8);
  }

  private updateGeometry(
    points: THREE.Vector3[], index: number[], dx: number[]) {

    const position: number[] = [];
    for (const v of points) {
      position.push(v.x, v.y, v.z);
    }
    this.geometry.setFromPoints(points);
    this.geometry.setIndex(index);
    // this.geometry.setAttribute('position',
    //   new THREE.BufferAttribute(new Float32Array(position), 3, false));
    this.geometry.setAttribute('dx',
      new THREE.BufferAttribute(new Float32Array(dx), 1, false));
  }

  private setMaterial() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'iTime': { value: 0 }
      },
      vertexShader: `
      varying vec3 vColor;
      attribute float dx;
      uniform float iTime;
      void main() {
        float t = iTime + sin(position.x);
        vec3 pos = position + 0.1 * position.y * vec3(sin(t), 0.0, cos(t));
        //pos.x -= dx * 0.04;
        vColor = mix(vec3(0.5, 0.4, 0.3), vec3(1.0, 0.9, 0.2), position.y);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        mvPosition.x -= 0.05 * dx;

        // float distance = smoothstep(0.0, 10.0, mvPosition.z);
        // vColor = mix(vColor, vec3(0.8, 0.9, 1.0), distance);

        // mvPosition /= mvPosition.w;

        gl_Position = projectionMatrix * mvPosition;
      }`,
      fragmentShader: `
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, 1.0);
  }`,
    })
  }

  public tick(t: Tick) {
    this.material.uniforms['iTime'].value = t.elapsedS;
    this.material.uniformsNeedUpdate = true;
  }
}