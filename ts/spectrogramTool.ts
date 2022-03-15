import * as THREE from "three";
import { BufferGeometry, Sphere } from "three";
import { SampleSource } from "./sampleSource";

import { Tool } from "./tool";

export class SpectrogramTool implements Tool {
  private sampleSource: SampleSource = null;
  private material: THREE.Material;
  private static kNoteCount = 88;
  private static kSampleCount = 100;
  private static minFrequencyHz = 27.5;  // A0

  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private ctx: CanvasRenderingContext2D;

  constructor(private scene: THREE.Object3D,
    private audioCtx: AudioContext) {
    console.log(`Sample rate: ${audioCtx.sampleRate} Hz`);

    this.canvas = document.createElement('canvas');
    this.canvas.width = SpectrogramTool.kNoteCount;
    this.canvas.height = SpectrogramTool.kSampleCount;
    this.ctx = this.canvas.getContext('2d');

    SampleSource.make(audioCtx).then((source) => {
      this.sampleSource = source;
      this.sampleSource.setListener((samples: Float32Array) => {
        this.addSamples(samples);
      });
    });
  }

  private worldObject: THREE.Object3D;

  private needsUpdate = true;

  private addSamples(noteWeights: Float32Array) {
    if (!this.needsUpdate) {
      return;
    }
    this.needsUpdate = false;
    if (this.material) {
      const imageData = this.ctx.getImageData(
        0, 0, this.canvas.width, this.canvas.height);
      const newImageData = this.ctx.createImageData(imageData);
      const stride = SpectrogramTool.kNoteCount * 4;
      for (let i = 0; i < newImageData.data.length - stride; ++i) {
        newImageData.data[i] = imageData.data[i + stride];
      }
      let j = 0;
      for (let i = imageData.data.length - stride;
        i < imageData.data.length; i += 4) {
        // const f = Math.pow(noteWeights[j], 0.8);
        const f = noteWeights[j];
        //   f   | r  g  b
        // ----------------
        //  0    | 0  0  0
        //  0.25 |    0  0
        //  0.5  | 1     0
        // 1.0   | 1  1  1
        newImageData.data[i + 0] = f * 255 * 2;
        newImageData.data[i + 1] = (f - 0.25) * 255 * 2;
        newImageData.data[i + 2] = (f - 0.5) * 255 * 2;
        newImageData.data[i + 3] = 255;
        ++j;
      }
      this.ctx.putImageData(newImageData, 0, 0);
      this.texture.needsUpdate = true;
      this.material.needsUpdate = true;
    }
  }

  public makeObject(): THREE.Object3D {
    let planeGeometry: BufferGeometry =
      new THREE.PlaneBufferGeometry(1, 1);
    return new THREE.Mesh(planeGeometry, this.getMaterial());
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
      this.worldObject.onBeforeRender = () => { this.needsUpdate = true; }
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(1);
    this.worldObject.position.add(ray.origin);
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
      this.worldObject.onBeforeRender = () => { this.needsUpdate = true; }
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

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
    });
    return this.material;
  }
}