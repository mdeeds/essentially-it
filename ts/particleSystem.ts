import * as THREE from "three";

class Particle {
  constructor(
    readonly position: THREE.Vector3,
    readonly velocity: THREE.Vector3,
    readonly color: THREE.Vector4,
    readonly currentSize: number,
    readonly rotation: number,
    public lifeS: number,
  ) { }
}

export class ParticleSystem extends THREE.Object3D {
  private static kVS = `
// uniform float pointMultiplier;
attribute float size;
varying vec4 vColor;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  // gl_PointSize = size * pointMultiplier / gl_Position.w;
  gl_PointSize = 800.0 * size / gl_Position.w;
  
  vColor = color;
}`;

  private static kFS = `
// uniform sampler2D diffuseTexture;
varying vec4 vColor;
void main() {
  vec2 coords = gl_PointCoord;
  // gl_FragColor = texture2D(diffuseTexture, coords) * vColor;
  float intensity = 2.0 * (0.5 - length(gl_PointCoord - 0.5));
  gl_FragColor = vColor * intensity;
}`;

  private material: THREE.ShaderMaterial;
  private particles: Particle[] = [];
  private geometry = new THREE.BufferGeometry();
  private points: THREE.Points;

  constructor() {
    super();
    const uniforms = {
      diffuseTexture: {
        value: new THREE.TextureLoader().load('./img/dot.png')
      },
      pointMultiplier: {
        value: window.innerHeight / (2.0 * Math.tan(0.5 * 60.0 * Math.PI / 180.0))
      }
    };

    console.log(`Multiplier: ${uniforms.pointMultiplier.value}`);

    this.material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: ParticleSystem.kVS,
      fragmentShader: ParticleSystem.kFS,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
      vertexColors: true
    });

    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('size', new THREE.Float32BufferAttribute([], 1));

    this.points = new THREE.Points(this.geometry, this.material);
    this.add(this.points);
    this.geometry.boundingSphere =
      new THREE.Sphere(new THREE.Vector3(), 50);

    this.UpdateGeometry();
  }

  AddParticle(position: THREE.Vector3, velocity: THREE.Vector3,
    color: THREE.Color) {
    if (!position.manhattanLength() || !velocity.manhattanLength()) {
      return;
    }
    const p = new THREE.Vector3();
    p.copy(position);
    const v = new THREE.Vector3();
    v.copy(velocity);
    const colorVector = new THREE.Vector4(color.r, color.g, color.b, 0.5);
    this.particles.push(new Particle(
      p, v, colorVector,
      Math.random() * 0.05,
      Math.random() * 2 * Math.PI, 10));
  }

  private UpdateGeometry() {
    const positions: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];

    for (let p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
      colors.push(p.color.x, p.color.y, p.color.z, p.color.w);
      sizes.push(p.currentSize);
    }

    this.geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute(
      'size', new THREE.Float32BufferAttribute(sizes, 1));
    this.geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 4));

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  private v = new THREE.Vector3();
  private UpdateParticles(deltaS: number) {
    for (const p of this.particles) {
      this.v.copy(p.velocity);
      this.v.multiplyScalar(deltaS);
      p.position.add(this.v);
      p.lifeS -= deltaS;
    }

    let numDeleted = 0;
    for (let i = 0; i < this.particles.length; ++i) {
      if (this.particles[i].lifeS < 0) {
        numDeleted++;
      } else {
        this.particles[i - numDeleted] = this.particles[i];
      }
    }

    this.particles.splice(this.particles.length - numDeleted);
    // this.particles.sort((a, b) => {
    //   const d1 = camera.position.distanceTo(a.position);
    //   const d2 = camera.position.distanceTo(b.position);
    //   return d2 - d1;
    // });
  }

  step(deltaS: number) {
    this.UpdateParticles(deltaS);
    this.UpdateGeometry();
  }
}