import * as THREE from "three";
import { Matrix4 } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Motion } from "../motion";
import { InstancedObject } from "./instancedObject";

import { Knob, KnobTarget } from "./knob";
import { KnobAction } from "./knobAction";

export class Panel extends THREE.Object3D {
  private static kKnobSpacingM = 0.18;
  private knobsWide: number;
  constructor(private knobs: Knob[], private knobsHigh: number,
    private motions: Motion[]) {
    super();
    this.name = 'Panel';
    this.buildPanel();
  }

  private buildPanel() {
    this.knobsWide = Math.ceil(this.knobs.length / this.knobsHigh);
    const panelCanvas = document.createElement('canvas');
    panelCanvas.width = this.knobsWide * 256;
    panelCanvas.height = this.knobsHigh * 256;
    const panelTexture = new THREE.CanvasTexture(panelCanvas);
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: panelTexture
    });

    this.renderPanel(panelCanvas, panelTexture);

    const surface = new THREE.PlaneBufferGeometry(
      this.knobsWide * Panel.kKnobSpacingM, this.knobsHigh * Panel.kKnobSpacingM);

    this.add(new THREE.Mesh(surface, panelMaterial));
    this.buildKnobs();
  }

  private getKnobUV(i: number): THREE.Vector2 {
    const u = (Math.floor(i / this.knobsHigh) + 0.5) / (this.knobsWide);
    const v = (i % this.knobsHigh + 0.5) / (this.knobsHigh);
    return new THREE.Vector2(u, v);
  }

  // Returns knob position in real coordinates
  private getKnobXY(i: number): THREE.Vector2 {
    const width = this.knobsWide * Panel.kKnobSpacingM;
    const height = this.knobsHigh * Panel.kKnobSpacingM;
    const uv = this.getKnobUV(i);
    const x = (uv.x - 0.5) * width;
    const y = (0.5 - uv.y) * height;
    return new THREE.Vector2(x, y);
  }

  private async loadFont(): Promise<void> {
    const fontLoader = new FontFace(
      'Teko', 'url(Teko-Regular.ttf)');
    return new Promise<void>(async (resolve) => {
      await fontLoader.load();
      console.log('Teko loaded.');
      resolve();
    });
  }

  private async renderPanel(panelCanvas: HTMLCanvasElement,
    panelTexture: THREE.CanvasTexture) {
    const ctx = panelCanvas.getContext('2d');
    ctx.fillStyle = '#d14';
    ctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);
    console.log('Panel filled');
    await this.loadFont();
    ctx.font = '32px "Teko"';

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.2;
    ctx.textAlign = 'center';
    for (let i = 0; i < this.knobs.length; ++i) {
      const knob = this.knobs[i];
      const uv = this.getKnobUV(i);
      const x = uv.x * panelCanvas.width;
      const y = uv.y * panelCanvas.height
        + panelCanvas.height / this.knobsHigh * 0.4;
      ctx.strokeText(knob.name, x, y);
      ctx.fillText(knob.name, x, y);
    }
    console.log('Panel styled');
    panelTexture.needsUpdate = true;
  }

  private async buildKnobs() {
    console.log('Build Knobs');
    const knobModel = await this.loadKnob();
    const instanced = new InstancedObject(knobModel, this.knobs.length);
    this.add(instanced);
    const aPosition = new THREE.Vector3();
    for (let i = 0; i < this.knobs.length; ++i) {
      const xy = this.getKnobXY(i);
      const translation = new Matrix4();
      translation.makeTranslation(xy.x, xy.y, 0);
      const rotation = new THREE.Matrix4();
      rotation.makeRotationX(Math.PI / 2);
      rotation.premultiply(translation);
      instanced.setMatrixAt(i, rotation);
      aPosition.set(0, 0, 0);
      aPosition.applyMatrix4(rotation);
      const knob = this.knobs[i];
      knob.addTarget(KnobTarget.fromInstancedObject(instanced, i));
    }
    const selection = new KnobAction(null);
    selection.name = 'Selection';
    selection.position.copy(aPosition);
    this.add(selection);
  }

  private async loadKnob(): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
      loader.load('model/knob.gltf', (gltf) => {
        resolve(gltf.scene);
      });
    });
  }
}