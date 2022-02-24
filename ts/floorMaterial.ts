import * as THREE from "three";

export class FloorMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        t: { value: 0.0 }
      },
      vertexShader: `
varying vec4 vWorldPosition;
void main() {
  vWorldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`,
      fragmentShader: `
uniform float t;
varying vec4 vWorldPosition;

vec2 noiseM(vec2 v, vec2 v0) {
  return vec2(
    v0.x + v.x * v.x + v.y * v.y,
    v0.y + 2.0 * v.x * v.y);
}

vec2 noiseS(vec2 v, vec2 v0) {
  vec2 n = noiseM(v, v0);
  return vec2(sin(n.x), sin(n.y));
}

vec3 noiseV(vec2 v) {
  v = v * 0.1;
  vec2 v0 = v + vec2(cos(t * 0.9), sin(t * 1.09));
  for (int i = 0; i < 16; ++i) {
    v = noiseS(v, v0);
  }
  v = v * 0.707;

  float mag = length(v) * 0.5 + 0.5;
  return vec3(mag, mag, mag);
}

void main() {
  vec3 c = noiseV(vWorldPosition.xz);
  gl_FragColor = vec4(c, 1.0);
}`,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      side: THREE.DoubleSide,
    });
  }

  setT(t: number) {
    this.uniforms['t'].value = t;
    this.uniformsNeedUpdate = true;
  }

}