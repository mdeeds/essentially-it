import * as THREE from "three";
import { Motion } from "../motion";
import { Tick, Ticker } from "../ticker";
import { Synth } from "./synth";

class Trigger {
  constructor(readonly synth: Synth, readonly velocity: number) {
    console.assert(!!synth);
  }
}

class Particle {
  private trigger: Trigger;
  readonly color = new THREE.Color;
  constructor(readonly beatOffset: number, public size: number) {
    this.color.set('#888');
  }
  setTrigger(trigger: Trigger) {
    this.color.set('#a2a');
    this.trigger = trigger;
  }
  getTrigger() {
    return this.trigger;
  }
}

export class ZigZag extends THREE.Object3D implements Ticker {
  private bpm = 120;
  private particlesPerBeat = 32;
  private beatsPerLoop = 4 * 4;
  private beatsPerZig = 1;

  private particles: Particle[];
  private geometry: THREE.BufferGeometry;
  constructor(private motions: Motion[], private synths: Synth[],
    private keySet: Set<string>) {
    super();
    this.name = 'ZigZag';
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
    float intensity = 
      clamp(5.0 * (0.5 - length(gl_PointCoord - 0.5)), 0.0, 1.0);
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
      return (zigOffset - this.beatsPerZig / 2);
    } else {
      // Odd case; going left
      return (this.beatsPerZig / 2 - zigOffset);
    }
  }

  public getBeatOffsetForX(currentBeatOffset: number, x: number) {
    // Quantize to -0.5, -0.25, 0, 0.25, 0.5
    x = Math.round((x * 4)) / 4;
    const zigNumber = Math.floor(currentBeatOffset / this.beatsPerZig);
    let zigOffset = 0;
    if ((zigNumber & 0x1) === 0x0) {
      // Even case; going right
      zigOffset = x + this.beatsPerZig / 2;
    } else {
      // Odd case; going left
      zigOffset = 1 - (x + this.beatsPerZig / 2);
    }
    const zigStartOffset =
      (Math.floor(currentBeatOffset / this.beatsPerZig) * this.beatsPerZig)
    return (zigOffset + zigStartOffset) % this.beatsPerLoop;
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
      colors.push(p.color.r, p.color.g, p.color.b, 1.0);
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

  private slice(x: number, currentBeatNumber: number, trigger: Trigger) {
    // TODO: trigger at zero latency if this is in the past
    // this.synth.trigger();
    const selectedBeatOffset = this.getBeatOffsetForX(currentBeatNumber, x);
    const i = Math.round(selectedBeatOffset * this.particlesPerBeat)
      % this.particles.length;
    this.particles[i].setTrigger(trigger);
    const c = this.particles[i].color;
    const colorAtt = this.geometry.attributes.color;
    colorAtt.setXYZ(i, c.r, c.g, c.b);
    colorAtt.needsUpdate = true;
  }

  // Executes all triggers in the range [fromTimeS, toTimeS)
  executeTriggers(fromTimeS: number, toTimeS: number, nowS: number) {
    let currentTime = fromTimeS;
    const secondsPerBeat = 60 / this.bpm;
    const timeStep = secondsPerBeat / this.particlesPerBeat;
    const secondsPerParticle = secondsPerBeat / this.particlesPerBeat;

    let i = Math.ceil(fromTimeS / secondsPerParticle)
      % this.particles.length;
    const j = Math.ceil(toTimeS / secondsPerParticle)
      % this.particles.length;
    while (i !== j) {
      const trigger = this.particles[i].getTrigger();
      if (trigger) {
        trigger.synth.trigger(currentTime - nowS, trigger.velocity);
      }
      ++i;
      if (i >= this.particles.length) {
        i -= this.particles.length;
      };
      currentTime += timeStep;
    }
  }

  private p1 = new THREE.Vector3();
  private p2 = new THREE.Vector3();
  private lastTriggerTime = 0;
  private playedThroughTime = 0;
  public tick(t: Tick) {
    const currentBeatNumber = this.getCurrentBeat(t.elapsedS);

    const endPlayTime = t.elapsedS + 0.05;
    this.executeTriggers(this.playedThroughTime, endPlayTime, t.elapsedS);
    this.playedThroughTime = endPlayTime;

    const positions = this.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; ++i) {
      const p = this.particles[i];
      const z = this.getZPositionForBeat(p.beatOffset, currentBeatNumber);
      positions.setZ(i, z);
    }
    positions.needsUpdate = true;

    for (let i = 0; i < this.motions.length; ++i) {
      const synth = this.synths[i];
      const m = this.motions[i];
      if (m.velocity.y < -1) {
        this.p1.copy(m.prevP);
        this.worldToLocal(this.p1);
        this.p2.copy(m.p);
        this.worldToLocal(this.p2);
        if (this.p1.y > 0 && this.p2.y < 0) {
          const velocity = Math.max(0.1, Math.min(1.0,
            ((m.velocity.y + 1) * -2)))
          this.slice((this.p1.x + this.p2.x) / 2, currentBeatNumber,
            new Trigger(synth, velocity));
        }
      }
    }
    if (t.elapsedS - this.lastTriggerTime > 0.2)
      if (this.keySet.has('Digit1')) {
        this.slice(-0.5, currentBeatNumber, new Trigger(this.synths[0], 0.5));
        this.lastTriggerTime = t.elapsedS;
      } else if (this.keySet.has('Digit2')) {
        this.slice(0, currentBeatNumber, new Trigger(this.synths[0], 0.5));
        this.lastTriggerTime = t.elapsedS;
      } else if (this.keySet.has('Digit3')) {
        this.slice(0.5, currentBeatNumber, new Trigger(this.synths[0], 0.5));
        this.lastTriggerTime = t.elapsedS;
      }
    if (this.keySet.has('KeyZ')) {
      this.slice(-0.5, currentBeatNumber, new Trigger(this.synths[1], 0.5));
      this.lastTriggerTime = t.elapsedS;
    } else if (this.keySet.has('KeyX')) {
      this.slice(0, currentBeatNumber, new Trigger(this.synths[1], 0.5));
      this.lastTriggerTime = t.elapsedS;
    } else if (this.keySet.has('KeyC')) {
      this.slice(0.5, currentBeatNumber, new Trigger(this.synths[1], 0.5));
      this.lastTriggerTime = t.elapsedS;
    }
  }
}