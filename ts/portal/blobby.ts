import * as THREE from 'three';

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
      void main() {
        vec3 updatedPosition = vec3(
          position.x + dot(blend, vec4(p1.x, p2.x, p3.x, p4.x)),
          position.y + dot(blend, vec4(p1.y, p2.y, p3.y, p4.y)),
          position.z + dot(blend, vec4(p1.z, p2.z, p3.z, p4.z)));
        vNormal = normalMatrix * normal;
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(updatedPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
      `,
      fragmentShader: `
      varying vec3 vColor;
      varying vec3 vNormal;
      void main() {
        gl_FragColor = vec4(clamp(vColor * vNormal.y, 0.1, 1.0), 1.0);
      }
      `,
      vertexColors: true,
    });

    return material;
  }

  // `geometry` must have an attribute called `blend` which is a vec4
  // used to adjust the positioning of each vertex.
  constructor(geometry: THREE.BufferGeometry) {
    const material = Blobby.makeBlobbyMaterial();
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

}