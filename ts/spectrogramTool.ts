import * as THREE from "three";
import { BufferGeometry, Sphere } from "three";
import { SampleSource } from "./sampleSource";

import { Tool } from "./tool";

export class SpectrogramTool implements Tool {
  private sampleSource: SampleSource = null;
  private material: THREE.Material;
  private static kNoteCount = 88;
  private static kSampleCount = 100;
  private static kKeyHeight = 36;
  private static minFrequencyHz = 27.5;  // A0
  private peak: number;

  private pianoCanvas: HTMLCanvasElement;
  private spectrogramCanvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;

  constructor(private scene: THREE.Object3D,
    audioCtx: AudioContext, input: AudioNode) {
    console.log(`Sample rate: ${audioCtx.sampleRate} Hz`);

    this.spectrogramCanvas = document.createElement('canvas');
    this.spectrogramCanvas.width = SpectrogramTool.kNoteCount;
    this.spectrogramCanvas.height = SpectrogramTool.kSampleCount;

    this.pianoCanvas = document.createElement('canvas');
    this.pianoCanvas.width = 512;
    this.pianoCanvas.height = 512;
    this.drawKeyboard();

    this.sampleSource = new SampleSource(audioCtx, input);
    this.sampleSource.setListener((samples: Float32Array,
      peak: number) => {
      this.addSamples(samples);
      this.peak = Math.max(peak, this.peak);
    });
  }

  private getStyle(n: number) {
    switch (n % 12) {
      case 1:
      case 4:
      case 6:
      case 9:
      case 11:
        return 'black';
      default:
        return 'white';
    }
  }

  private drawKeyboard() {
    const ctx = this.pianoCanvas.getContext('2d');
    const keyWidth = this.pianoCanvas.width / 88;
    let x = 0;
    ctx.fillStyle = 'white';
    ctx.fillRect(x, 512 - SpectrogramTool.kKeyHeight,
      512, SpectrogramTool.kKeyHeight);
    x = -keyWidth / 2;
    const whiteWidth = this.pianoCanvas.width / 88 * 12 / 7;
    for (let n = 0; n < 88; ++n) {
      const style = this.getStyle(n);
      if (style == 'white') {
        ctx.strokeStyle = '#aaa';
        ctx.strokeRect(x, 512 - SpectrogramTool.kKeyHeight,
          whiteWidth, SpectrogramTool.kKeyHeight);
        x += whiteWidth;
      }
    }
    x = 0;
    for (let n = 0; n < 88; ++n, x += keyWidth) {
      const style = this.getStyle(n);
      if (style == 'black') {
        ctx.fillStyle = style;
        ctx.fillRect(x, 512 - SpectrogramTool.kKeyHeight,
          keyWidth, SpectrogramTool.kKeyHeight / 2);
      }
    }
  }

  private worldObject: THREE.Object3D;

  private needsUpdate = true;

  private static plookup = (() => {
    const numbers = [];
    let i = 0;
    for (let x = 0; x <= 1.0; x += 0.001) {
      numbers[i++] = Math.pow(x, 0.3);
    }
    return numbers;
  })();

  private static plookupFine = (() => {
    const numbers = [];
    let i = 0;
    for (let x = 0; x <= 0.01; x += 0.00001) {
      numbers[i++] = Math.pow(x, 0.3);
    }
    return numbers;
  })();

  private static conv(f: number) {
    if (f < 0) {
      return 0;
    } else if (f > 1) {
      return 1;
    } else if (f < 0.01) {
      return SpectrogramTool.plookupFine[Math.round(f * 100000)];
    } else {
      return SpectrogramTool.plookup[Math.round(f * 1000)];
    }
  }

  private addSamplesToSpectrogramCanvas(noteWeights: Float32Array) {
    if (!this.needsUpdate) {
      return;
    }
    this.needsUpdate = false;
    const ctx = this.spectrogramCanvas.getContext('2d');
    if (this.material) {
      // Shift everything up one pixel
      const oldContent = ctx.getImageData(
        0, 1, this.spectrogramCanvas.width, this.spectrogramCanvas.height - 1);
      ctx.putImageData(oldContent, 0, 0);

      // Splat the last row
      const newImageData = ctx.createImageData(this.spectrogramCanvas.width, 1);
      for (let x = 0; x < newImageData.width; ++x) {
        const i = x * 4;
        const f = SpectrogramTool.conv(noteWeights[x]);
        //   f   | r  g  b
        // ----------------
        //  0    | 0  0  0
        //  0.25 |    0  0
        //  0.5  | 1     0
        //  0.75 |    1
        // 1.0   | 1  1  1
        newImageData.data[i + 0] = f * 255 * 2;
        newImageData.data[i + 1] = (f - 0.25) * 255 * 2;
        newImageData.data[i + 2] = (f - 0.5) * 255 * 2;
        newImageData.data[i + 3] = 255;
      }

      // const peakOffset =
      //   4 * Math.min(88, Math.max(0, Math.round(this.peak * 10 + 44)));
      // const i = newImageData.data.length - stride + peakOffset;
      // newImageData.data[i + 0] = 128;
      // newImageData.data[i + 1] = 255;
      // newImageData.data[i + 2] = 128;
      this.peak = 0;

      ctx.putImageData(newImageData, 0, this.spectrogramCanvas.height - 1);
    }
  }

  private addSamples(noteWeights: Float32Array) {
    this.addSamplesToSpectrogramCanvas(noteWeights);
    const ctx = this.pianoCanvas.getContext('2d');
    ctx.drawImage(this.spectrogramCanvas, 0, 0,
      512, 512 - SpectrogramTool.kKeyHeight);
    this.texture.needsUpdate = true;
    this.material.needsUpdate = true;
  }

  public makeObject(): THREE.Object3D {
    let planeGeometry: BufferGeometry =
      new THREE.PlaneBufferGeometry(1, 1);
    return new THREE.Mesh(planeGeometry, this.getMaterial());
  }

  private updatePosition(ray: THREE.Ray) {
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

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    this.updatePosition(ray);
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    this.updatePosition(ray);
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

    this.texture = new THREE.CanvasTexture(this.pianoCanvas);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
    });
    return this.material;
  }
}