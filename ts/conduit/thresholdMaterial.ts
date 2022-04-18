import * as THREE from "three";

export class ThresholdMaterial extends THREE.ShaderMaterial {
  // Shader is red when the world position is in the -Y and +Z portion
  // of the coordinate system defined by `thresholdMatrix`
  constructor(thresholdMatrix: THREE.Matrix4) {
    const inv = new THREE.Matrix4();
    inv.copy(thresholdMatrix);
    inv.invert();
    super({
      vertexShader: `
  uniform mat4 thresholdMatrix;
  varying vec4 thresholdPosition;
  varying vec3 vNormal;
  void main() {
    thresholdPosition = thresholdMatrix * modelMatrix * vec4(position, 1.0);
    thresholdPosition = thresholdPosition / thresholdPosition.w;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vNormal = normalMatrix * normal;
  }
      `,
      fragmentShader: `
  varying vec4 thresholdPosition;
  uniform vec3 triggerColor;
  uniform vec3 baseColor;
  varying vec3 vNormal;
  void main() {
    float intensity = (0.2 + clamp(vNormal.y, 0.0, 1.0));
    if ((thresholdPosition.y <= 0.0) && (thresholdPosition.z <= 0.0)) {
      gl_FragColor = vec4(intensity * triggerColor.rgb, 1.0);
    } else {
      gl_FragColor = vec4(intensity * baseColor.rgb, 1.0);
    }
  }
      `,
      uniforms: {
        thresholdMatrix: { value: inv },
        triggerColor: { value: new THREE.Color('orange') },
        baseColor: { value: new THREE.Color('#777') },
      },
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      vertexColors: false,
      side: THREE.FrontSide,
    });
    this.uniformsNeedUpdate = true;
  }
}