import * as THREE from 'three';
import { S } from '../settings';

export class Blobby extends THREE.Mesh {
  private shaderMaterial: THREE.ShaderMaterial;
  private static makeBlobbyMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        p1: { value: new THREE.Vector3() },
        p2: { value: new THREE.Vector3() },
        p3: { value: new THREE.Vector3() },
        p4: { value: new THREE.Vector3() },
      },
      vertexShader: `
      uniform vec3 p1;
      uniform vec3 p2;
      uniform vec3 p3;
      uniform vec3 p4;
      attribute vec4 blend;
      varying vec3 vColor;
      varying vec3 vNormal;

      float noise3to1(in vec3 p) {
        const mat3 m = mat3(
          1.0, 0.0, 0.0,
          0.5, 1.2, 0.0,
          0.0, 0.0, 1.0);
      
        vec3 s = m * p;
      
        return sin(s.x) * sin(s.y) * sin(s.z);
      }
      
      vec3 noise3to3(in vec3 p) {
        return vec3(
          noise3to1(p.xyz + vec3(1, 2, 3) * vec3(0.9, 0.7, 1.3)),
          noise3to1(p.zyx + vec3(7, 9, 8) * vec3(0.5, 1.2, 1.1)),
          noise3to1(p.yxz + vec3(3, 2, 5) * vec3(0.8, 0.3, 1.5)));
      }
      
      vec3 brown(in vec3 p) {
        return 0.5 * noise3to3(p) + 0.2 * noise3to3(p * 3.0) + 0.1 * noise3to3(p * 5.0);
      
      }
      
      vec3 grey(in vec3 p) {
        return brown(brown(p * 0.1) * 5.0);
      }

      void main() {
        vec3 updatedPosition = vec3(
          position.x + dot(blend, vec4(p1.x, p2.x, p3.x, p4.x)),
          position.y + dot(blend, vec4(p1.y, p2.y, p3.y, p4.y)),
          position.z + dot(blend, vec4(p1.z, p2.z, p3.z, p4.z)));
        vNormal = normalMatrix * normal;
        vColor = (0.5 + grey(position * 20.0)) * color;
        vec4 mvPosition = modelViewMatrix * vec4(updatedPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
      `,
      fragmentShader: `
      varying vec3 vColor;
      varying vec3 vNormal;
      void main() {
        float intensity = clamp(vNormal.y, 0.1, 1.0);
        gl_FragColor = vec4(clamp(vColor * intensity, 0.1, 1.0), 1.0);
      }
      `,
      vertexColors: true,
    });

    return material;
  }

  // `geometry` must have an attribute called `blend` which is a vec4
  // used to adjust the positioning of each vertex.
  constructor() {
    const material = Blobby.makeBlobbyMaterial();
    const geometry = Blobby.makeBlobbyGeometry();
    super(geometry, material);
    this.shaderMaterial = material;
  }

  setLimbs(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3) {
    this.shaderMaterial.uniforms['p1'].value.copy(p1);
    this.shaderMaterial.uniforms['p2'].value.copy(p2);
    this.shaderMaterial.uniforms['p3'].value.copy(p3);
    this.shaderMaterial.uniforms['p4'].value.copy(p4);
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  private static makeBlobbyGeometry(): THREE.BufferGeometry {
    const initialRadius = 0.3;
    const geometry = new THREE.IcosahedronBufferGeometry(initialRadius, 5);
    geometry.translate(0, 1.0, 0);

    const blend: number[] = [];
    const positions = geometry.getAttribute('position');
    const geometryPosition = new THREE.Vector3();

    const a = S.float('ha');

    const naturalPositions = [
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(-Math.sin(a), Math.cos(a), -0.1),
      new THREE.Vector3(Math.sin(a), Math.cos(a), -0.1),
      new THREE.Vector3(0, -0.2, 0)
    ];

    naturalPositions[0].setLength(0.8 * initialRadius);
    naturalPositions[1].setLength(1.1 * initialRadius);
    naturalPositions[2].setLength(1.1 * initialRadius);
    naturalPositions[3].setLength(0.99 * initialRadius);
    for (let i = 0; i < 4; ++i) {
      naturalPositions[i].y += 1;
    }

    for (let i = 0; i < positions.count; ++i) {
      geometryPosition.fromBufferAttribute(positions, i);
      const a = [
        Blobby.getBlend(geometryPosition, naturalPositions[0]),
        Blobby.getBlend(geometryPosition, naturalPositions[1]),
        Blobby.getBlend(geometryPosition, naturalPositions[2]),
        Blobby.getBlend(geometryPosition, naturalPositions[3])
      ];

      blend.push(...Blobby.softMax(a));
    }
    geometry.setAttribute('blend', new THREE.BufferAttribute(
      new Float32Array(blend), 4));

    return geometry;
  }

  private static t = new THREE.Vector3();
  private static getBlend(a: THREE.Vector3, b: THREE.Vector3) {
    Blobby.t.copy(a);
    Blobby.t.sub(b);
    return 1.0 / Blobby.t.length();
  }

  private static softMax(n: number[]): number[] {
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < n.length; ++i) {
      sum += n[i];
      result[i] = n[i];
    }
    for (let i = 0; i < n.length; ++i) {
      result[i] /= sum;
    }
    return result;
  }


}