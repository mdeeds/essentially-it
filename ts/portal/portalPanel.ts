import * as THREE from 'three';
import { MeshPhongMaterial } from 'three';
import { Shaders } from './shaders';

export class PortalPanels extends THREE.InstancedMesh {
  static makePanelMaterial(): THREE.Material {
    return new THREE.ShaderMaterial({
      vertexShader: `
       varying vec2 vUv;
       varying vec3 vWorldPosition;
       varying vec3 vPosition;
       void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          vWorldPosition = worldPosition.xyz / worldPosition.w;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
       }
       `,
      fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vPosition;
      ${Shaders.sinplex} 

      void main() {
        vec3 texturePosition = vPosition.xzy;
        float g = length(grey(vec3(texturePosition*10.0)));
        float e = step(0.45, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
        e = e * 0.1 + 0.9;
        float intensity = g * e;

        gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
      }
       `,
      side: THREE.FrontSide,
    });
  }

  constructor() {
    const singleGeometry = new THREE.PlaneGeometry(2.0, 2.0);
    super(singleGeometry, new MeshPhongMaterial({ color: '#99e' }),
      /*count=*/1000);
    this.count = 0;
  }

  private v1 = new THREE.Vector3;
  addPanel(position: THREE.Vector3, orientation: THREE.Quaternion) {
    console.log(`x = ${position.x}`);
    const m4 = new THREE.Matrix4();
    const positionMatrix = new THREE.Matrix4();
    m4.makeRotationFromQuaternion(orientation);
    positionMatrix.makeTranslation(position.x, position.y, position.z);
    m4.premultiply(positionMatrix);
    this.v1.setFromMatrixPosition(m4);
    console.log(`x = ${this.v1.x}`);
    const index = this.count++;
    this.setMatrixAt(index, m4);
    this.setColorAt(index, new THREE.Color(
      Math.random() * 0.1 + 0.9, Math.random() * 0.1 + 0.9,
      Math.random() * 0.1 + 0.9))
    console.log(`Panel count: ${this.count}`);
  }
}