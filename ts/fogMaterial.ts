import * as THREE from "three";

export class FogMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {},
      vertexShader: `
varying vec4 vWorldPosition;
void main() {
  vWorldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`,
      fragmentShader: `
varying vec4 vWorldPosition;
void main() {
  float y = vWorldPosition.y;
  if (y > 0.0) {
    float a = pow(clamp(y / 5.0, 0.0, 1.0), 0.2);
    gl_FragColor = mix(
      vec4(0.5, 0.5, 0.5, 1.0),
      vec4(1.0, 1.0, 1.0, 1.0), a);
  } else {
    float a = clamp(-y * 20.0, 0.0, 1.0);
    gl_FragColor = mix(
      vec4(0.5, 0.5, 0.5, 1.0),
      vec4(0.017 * 2.0, 0.0, 0.073 * 2.0, 1.0), a);
  }
}`,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      side: THREE.BackSide,
    });
  }

}