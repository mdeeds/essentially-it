import * as THREE from "three";
import { S } from "../settings";

export class StarField extends THREE.Object3D {
  constructor() {
    super();
    const stars = this.makeParticles();
    this.add(stars);
    const clock = new THREE.Clock();
    stars.onBeforeRender = (
      renderer: THREE.WebGLRenderer, scene: THREE.Scene,
      camera: THREE.Camera, geometry: THREE.BufferGeometry,
      material: THREE.Material, group: THREE.Group) => {
      stars.position.z = 3000 * Math.sin(clock.getElapsedTime() / 30);
      stars.position.x = 3000 * Math.cos(clock.getElapsedTime() / 30);
    };

    for (let theta = -Math.PI; theta < Math.PI; theta += 0.02) {
      const x = Math.cos(theta) * 5;
      const z = Math.sin(theta) * 5;
      const y = 3 * (Math.random() - 0.5);
      const sphere = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(0.5, 3),
        new THREE.MeshStandardMaterial({ color: '#09f' }));
      sphere.position.set(x, y, z);
      this.add(sphere);
    }

    const l1 = new THREE.DirectionalLight('#ff9', 0.8);
    l1.position.set(0.5, 3, -0.5);
    this.add(l1)
    const l2 = new THREE.DirectionalLight('#9ff', 0.8);
    l2.position.set(-0.5, 3, 0.5);
    this.add(l2)
  }

  private setAttributes(geometry: THREE.BufferGeometry) {
    const positions: number[] = [];
    const sizes: number[] = [];
    for (let i = 0; i < S.float('ns'); ++i) {
      const p = new THREE.Vector3(
        (Math.random() - 0.5) * S.float('sr'),
        (Math.random() - 0.5) * S.float('sr'),
        (Math.random() - 0.5) * S.float('sr'));
      positions.push(p.x, p.y, p.z);
      sizes.push(1.0);
    }
    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute(
      'size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.attributes['position'].needsUpdate = true;
    geometry.attributes['size'].needsUpdate = true;
  }

  private makeParticles(): THREE.Object3D {
    const material = new THREE.ShaderMaterial({
      uniforms: {
      },
      vertexShader: `
        // uniform float pointMultiplier;
        attribute float size;
        varying vec4 vColor;
        void main() {
          vColor = vec4(1.0, 1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distance = length(mvPosition.xyz);
          if (distance > 1000.0) {
            mvPosition.xyz = mvPosition.xyz * (1000.0 / distance);
          }
          gl_Position = projectionMatrix * mvPosition;
          // gl_PointSize = size * pointMultiplier / gl_Position.w;
          // gl_PointSize appears to be measured in screen pixels.
          gl_PointSize = max(800.0 * size / distance, ${S.float('mr').toFixed(3)});
          
        }`,
      fragmentShader: `
      uniform sampler2D diffuseTexture;
      varying vec4 vColor;
      void main() {
        vec2 coords = gl_PointCoord;
        // gl_FragColor = texture2D(diffuseTexture, coords) * vColor;
        float intensity = 2.0 * (0.5 - length(gl_PointCoord - 0.5));
        gl_FragColor = vColor * intensity;
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
    });

    const geometry = new THREE.BufferGeometry();
    this.setAttributes(geometry);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
  }
}