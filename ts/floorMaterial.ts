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

// All components are in the range [0…1], including hue.
// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 noiseV(vec2 v) {
  v = v * 0.1;
  vec2 v0 = v + vec2(cos(t * 0.9), sin(t * 1.09));
  for (int i = 0; i < 16; ++i) {
    v = noiseS(v, v0);
  }
  v = v * 0.707;

  float mag = length(v) * 0.5 + 0.5;
  float h = atan(v.x, v.y) / 3.1416 / 2.0 + 0.5;
  return hsv2rgb(vec3(h, 0.05, mag));
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