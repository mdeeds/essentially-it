import * as THREE from "three";
import { BufferGeometry } from "three";

import { Tool } from "./tool";

interface ToneSource {
  getAudioSource(): AudioNode;
  renderToCanvas(canavs: HTMLCanvasElement): void;
  start(): void;
  stop(): void;
}

class ShapeToneSource implements ToneSource {
  private oscillator: OscillatorNode;
  private gain: GainNode;
  constructor(private audioCtx: AudioContext,
    type: OscillatorType, destination: AudioNode) {
    this.gain = audioCtx.createGain();
    this.gain.gain.setValueAtTime(0, audioCtx.currentTime);
    this.gain.connect(destination);
    this.gain.connect(audioCtx.destination);

    this.oscillator = audioCtx.createOscillator();
    this.oscillator.type = type;
    this.oscillator.frequency.setValueAtTime(196, audioCtx.currentTime);
    this.oscillator.connect(this.gain);
    this.oscillator.start();
  }
  getAudioSource(): AudioNode {
    return this.oscillator;
  }

  renderToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#a9b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  }

  start() {
    this.gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
  }
  stop() {
    this.gain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
  }
}

class SineToneSource extends ShapeToneSource {
  constructor(audioCtx: AudioContext, destination: AudioNode) {
    super(audioCtx, 'sine', destination);
  }
  renderToCanvas(canvas: HTMLCanvasElement): void {
    super.renderToCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const wavelength = canvas.width * 0.9;
    const left = (canvas.width - wavelength) / 2;
    const ymid = (canvas.height / 2);
    const amplitude = canvas.height * 0.3;

    ctx.lineWidth = canvas.width / 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#82f';
    ctx.beginPath();
    ctx.moveTo(left, ymid);
    for (let i = 0; i < 1.0; i += 0.01) {
      const theta = Math.PI * 2 * i;
      ctx.lineTo(left + i * wavelength, ymid + amplitude * Math.sin(theta));
    }
    ctx.stroke();
  }
}

class SquareToneSource extends ShapeToneSource {
  constructor(audioCtx: AudioContext, destination: AudioNode) {
    super(audioCtx, 'square', destination);
  }
  renderToCanvas(canvas: HTMLCanvasElement): void {
    super.renderToCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const wavelength = canvas.width * 0.9;
    const left = (canvas.width - wavelength) / 2;
    const ymid = (canvas.height / 2);
    const amplitude = canvas.height * 0.3;

    ctx.lineWidth = canvas.width / 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#82f';
    ctx.beginPath();
    ctx.moveTo(left, ymid);
    ctx.lineTo(left, ymid + amplitude);
    ctx.lineTo(left + wavelength / 2, ymid + amplitude);
    ctx.lineTo(left + wavelength / 2, ymid - amplitude);
    ctx.lineTo(left + wavelength, ymid - amplitude);
    ctx.lineTo(left + wavelength, ymid);
    ctx.stroke();
  }
}

class TriangleToneSource extends ShapeToneSource {
  constructor(audioCtx: AudioContext, destination: AudioNode) {
    super(audioCtx, 'triangle', destination);
  }
  renderToCanvas(canvas: HTMLCanvasElement): void {
    super.renderToCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const wavelength = canvas.width * 0.9;
    const left = (canvas.width - wavelength) / 2;
    const ymid = (canvas.height / 2);
    const amplitude = canvas.height * 0.3;

    ctx.lineWidth = canvas.width / 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#82f';
    ctx.beginPath();
    ctx.moveTo(left, ymid);
    ctx.lineTo(left + 0.25 * wavelength, ymid + amplitude);
    ctx.lineTo(left + 0.75 * wavelength, ymid - amplitude);
    ctx.lineTo(left + wavelength, ymid);
    ctx.stroke();
  }
}

class SawtoothToneSource extends ShapeToneSource {
  constructor(audioCtx: AudioContext, destination: AudioNode) {
    super(audioCtx, 'sawtooth', destination);
  }
  renderToCanvas(canvas: HTMLCanvasElement): void {
    super.renderToCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const wavelength = canvas.width * 0.9;
    const left = (canvas.width - wavelength) / 2;
    const ymid = (canvas.height / 2);
    const amplitude = canvas.height * 0.3;

    ctx.lineWidth = canvas.width / 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#82f';
    ctx.beginPath();
    ctx.moveTo(left, ymid);
    ctx.lineTo(left, ymid + amplitude);
    ctx.lineTo(left + wavelength, ymid - amplitude);
    ctx.lineTo(left + wavelength, ymid);
    ctx.stroke();
  }
}

class ToneTool implements Tool {
  private material: THREE.Material;
  private waveformCanvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;

  constructor(private scene: THREE.Object3D,
    private toneSource: ToneSource,
    audioCtx: AudioContext, destination: AudioNode) {
    console.log(`Sample rate: ${audioCtx.sampleRate} Hz`);

    this.waveformCanvas = document.createElement('canvas');
    this.waveformCanvas.width = 512;
    this.waveformCanvas.height = 512;
  }
  private worldObject: THREE.Object3D;
  private needsUpdate = true;

  public makeObject(): THREE.Object3D {
    let planeGeometry: BufferGeometry =
      new THREE.PlaneBufferGeometry(1.5, 1.5, 1.5);
    const obj = new THREE.Mesh(planeGeometry, this.getMaterial());
    obj.scale.set(0.25, 0.25, 0.25);
    return obj;
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(1);
    this.worldObject.position.add(ray.origin);
    this.toneSource.start();
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(1);
    this.worldObject.position.add(ray.origin);
    const theta = Math.atan2(
      ray.direction.x, ray.direction.z);
    this.worldObject.rotation.y = theta + Math.PI;
    this.worldObject.updateMatrix();
  }

  end(): boolean {
    this.toneSource.stop();
    return false;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = this.makeObject();
    this.icon.scale.setLength(0.1);
    return this.icon;
  }

  private getMaterial(): THREE.Material {
    if (this.material) {
      return this.material;
    }

    this.texture = new THREE.CanvasTexture(this.waveformCanvas);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
    });
    // this.material = new THREE.MeshBasicMaterial({ color: "pink" });

    this.toneSource.renderToCanvas(this.waveformCanvas);
    this.material.needsUpdate = true;
    this.texture.needsUpdate = true;
    return this.material;
  }
}

export class SineToneTool extends ToneTool {
  constructor(scene: THREE.Object3D,
    audioCtx: AudioContext, destination: AudioNode) {
    super(scene, new SineToneSource(audioCtx, destination),
      audioCtx, destination);
  }
}

export class SquareToneTool extends ToneTool {
  constructor(scene: THREE.Object3D,
    audioCtx: AudioContext, destination: AudioNode) {
    super(scene, new SquareToneSource(audioCtx, destination),
      audioCtx, destination);
  }
}

export class TriangleToneTool extends ToneTool {
  constructor(scene: THREE.Object3D,
    audioCtx: AudioContext, destination: AudioNode) {
    super(scene, new TriangleToneSource(audioCtx, destination),
      audioCtx, destination);
  }
}

export class SawtoothToneTool extends ToneTool {
  constructor(scene: THREE.Object3D,
    audioCtx: AudioContext, destination: AudioNode) {
    super(scene, new SawtoothToneSource(audioCtx, destination),
      audioCtx, destination);
  }
}