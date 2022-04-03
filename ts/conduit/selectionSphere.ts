import * as THREE from "three";

export class SelectionSphere extends THREE.Object3D {
  constructor(version: number) {
    super();
    let material: THREE.ShaderMaterial;
    switch (version) {
      default: case 1: material = this.makeHighlightMaterial1(); break;
      case 2: material = this.makeHighlightMaterial2(); break;
    }
    const highlight = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(0.13, 3),
      material
    );
    this.add(highlight);
  }

  makeHighlightMaterial1(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 v_toCamera;
        varying vec3 v_normal;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1);
          // Calculate camera and normal vectors.
          v_toCamera = normalize(-viewPosition.xyz);
          v_normal = normalMatrix * normal;

          // Calculate position
          gl_Position = projectionMatrix * viewPosition;

        }`,
      fragmentShader: `
      varying vec3 v_toCamera;
      varying vec3 v_normal;
      void main() {
        // Calculate color from camera and normal
        float viewDot = dot(v_toCamera, v_normal);
        float r = sqrt(1.0 - viewDot * viewDot);
        float density = 0.5 - abs(r - 0.5);
        density = density * density * 3.5;
        gl_FragColor = vec4(0.3,0.1,1.0, density);  
      }`,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
    });
    return material;
  }

  makeHighlightMaterial2(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec4 v_color;
        void main() {
          // Calculate camera and normal vectors.
          vec4 viewPosition = modelViewMatrix * vec4(position, 1);
          vec3 toCamera = normalize(-viewPosition.xyz);
          vec3 normal = normalMatrix * normal;

          // Calculate color from camera and normal
          float viewDot = dot(toCamera, normal);
          float r = sqrt(1.0 - viewDot * viewDot);
          float density = 0.5 - abs(r - 0.5);
          density = density * density * 3.5;
          v_color = vec4(0.3,0.1,1.0, density);

          // Calculate position
          gl_Position = projectionMatrix * viewPosition;
        }`,
      fragmentShader: `
      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color;  
      }`,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
    });
    return material;
  }

}