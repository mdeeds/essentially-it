import * as THREE from "three";
import { Tick, Ticker } from "../ticker";

class Particle {
  constructor(readonly beatOffset: number, public size: number) { }
}

export class ZigZag extends THREE.Object3D implements Ticker {
  private bpm = 120;
  private particlesPerBeat = 32;
  private beatsPerLoop = 4 * 4;
  private beatsPerZig = 1;

  private particles: Particle[];
  private geometry: THREE.BufferGeometry;
  constructor() {
    super();
    this.particles = this.makeParticles();
    const material = this.makeMaterial();
    this.geometry = this.makeGeometry(this.particles);
    const points = new THREE.Points(this.geometry, material);
    this.add(points);
  }

  makeParticles(): Particle[] {
    const result: Particle[] = [];

    for (let i = 0; i < this.beatsPerLoop * this.particlesPerBeat; ++i) {
      let size = 0.02;  // Default, smallest size
      switch (i % this.particlesPerBeat) {
        case 0: size = 0.15; break;
        case 16: size = 0.1; break;
        case 8: case 24: size = 0.05; break;
      }
      result.push(new Particle(i / this.particlesPerBeat, size));
    }
    return result;
  }

  makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
  attribute float size;
  varying vec4 vColor;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 800.0 * size / gl_Position.w;
    vColor = color;
  }
      `,
      fragmentShader: `
  varying vec4 vColor;
  void main() {
    vec2 coords = gl_PointCoord;
    float intensity = 5.0 * (0.5 - length(gl_PointCoord - 0.5));
    gl_FragColor = vColor * intensity;
  }
      `,
      blending: THREE.SubtractiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
    });
    return material;
  }

  private getXPosition(beatOffset: number) {
    const zigNumber = Math.floor(beatOffset / this.beatsPerZig);
    const zigOffset = beatOffset % this.beatsPerZig;
    if ((zigNumber & 0x1) === 0x0) {
      // Even case; going right
      return (zigOffset - this.beatsPerZig / 2) * 2;
    } else {
      // Odd case; going left
      return (this.beatsPerZig / 2 - zigOffset) * 2;
    }
  }

  private getZPositionForBeat(beatOffset: number, currentBeatNumber: number) {
    const beatsIntoFuture = (
      beatOffset - currentBeatNumber + this.beatsPerLoop) % this.beatsPerLoop;
    return -beatsIntoFuture;
  }

  private getCurrentBeat(timeS: number) {
    const currentTimeBeats = timeS * (this.bpm / 60);
    return currentTimeBeats % this.beatsPerLoop;
  }

  private getZPositionForTime(beatOffset: number, timeS: number) {
    const currentBeatNumber = this.getCurrentBeat(timeS);
    return this.getZPositionForBeat(beatOffset, currentBeatNumber);
  }

  private p = new THREE.Vector3();
  makeGeometry(particles: Particle[]): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    const positions: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];

    for (const p of particles) {
      positions.push(
        this.getXPosition(p.beatOffset),
        0,
        this.getZPositionForTime(p.beatOffset, 0)
      );
      sizes.push(p.size);
      colors.push(0.8, 0.8, 0.8, 1.0);
    }

    geometry.setAttribute(
      'position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute(
      'size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      'color', new THREE.Float32BufferAttribute(colors, 4));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    return geometry;
  }

  public tick(t: Tick) {
    const currentBeatNumber = this.getCurrentBeat(t.elapsedS);

    const positions = this.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; ++i) {
      const p = this.particles[i];
      const z = this.getZPositionForBeat(p.beatOffset, currentBeatNumber);
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;
  }
}