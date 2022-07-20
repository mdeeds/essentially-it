import * as THREE from "three";
import { Tick, Ticker } from "../ticker";

export class Zoa extends THREE.Object3D implements Ticker {
  private shaderMaterial: THREE.ShaderMaterial;
  constructor() {
    super();
    this.shaderMaterial = this.makeMaterial();
    const m = new THREE.Mesh(
      new THREE.SphereBufferGeometry(
        0.3, 64, 32,
        0, 2 * Math.PI,
        0.0, Math.PI - 1.2), this.shaderMaterial);
    this.add(m);
  }

  private makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial(
      {
        vertexShader: `
uniform float iTime;
varying vec3 vModelPosition;
varying vec3 vToCamera;
void main() {
  vec3 pos = position;
  pos.y *= 1.0 + (0.05 * sin(iTime * 2.0) - 0.05);
  float theta = atan(pos.x, pos.z);
  pos.xz *= 1.0 + (0.1 * sin(7.0 * (abs(theta) + iTime)));

  vModelPosition = pos;
  vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
  vToCamera = normalize(cameraPosition - worldPosition.xyz / worldPosition.w);
}
        `,
        fragmentShader: `
uniform float iTime;
varying vec3 vModelPosition;
varying vec3 vToCamera;
void main() {

  float fwd = dot(normalize(vModelPosition), vToCamera);
  if (fwd < 0.0) {
    fwd = 0.5 + 0.5 * fwd;
  } else {
    fwd = 1.0 - fwd;
  }
  
  float hue = iTime + atan(vModelPosition.z, vModelPosition.x) + vModelPosition.y;
  
  vec3 saturated = vec3(cos(hue), 0.0, sin(hue));
  vec3 col = mix(saturated, vec3(1.0, 1.0, 1.0), 0.8);  
  col = col * fwd;

  gl_FragColor = vec4(col, 1.0);
}`,

        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        uniforms: {
          iTime: { value: 1.0 }
        }
      });
    return material;
  }

  tick(t: Tick) {
    this.shaderMaterial.uniforms['iTime'].value = t.elapsedS;
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

}