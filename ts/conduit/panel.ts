import * as THREE from "three";
import { Matrix4 } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Motion } from "../motion";
import { TactileProvider, TactileSink } from "../tactileProvider";
import { Util } from "../util";
import { InstancedObject } from "./instancedObject";

import { Knob, KnobTarget } from "./knob";
import { KnobAction } from "./knobAction";
import { SelectionSphere } from "./selectionSphere";

export class Panel extends THREE.Object3D implements TactileSink {
  private static kKnobSpacingM = 0.18;
  private knobsWide: number;
  private instancedKnobs: InstancedObject;
  private highlights: SelectionSphere[] = [];
  constructor(private knobs: Knob[], private knobsHigh: number,
    private motions: Motion[], private tactile: TactileProvider) {
    super();
    this.name = 'Panel';
    this.buildPanel();
    this.tactile.addSink(this);
    for (const c of Panel.pointColors) {
      const highlight = new SelectionSphere(1, c);
      highlight.visible = false;
      this.add(highlight);
      this.highlights.push(highlight);
    }
  }

  private static pointColors = [
    new THREE.Color('#f39'), new THREE.Color('#93f')];

  private p = new THREE.Vector3();
  private m = new THREE.Matrix4();
  private p2 = new THREE.Vector3();
  start(ray: THREE.Ray, id: number): void {
    for (let i = 0; i < this.instancedKnobs.getInstanceCount(); ++i) {
      this.p.set(0, 0, 0);
      this.instancedKnobs.getMatrixAt(i, this.m);
      this.p.applyMatrix4(this.m);
      this.p.applyMatrix4(this.instancedKnobs.matrixWorld);
      ray.closestPointToPoint(this.p, this.p2);
      this.p2.sub(this.p);
      if (this.p2.length() < 0.1) {
        this.highlights[id].visible = true;
        this.instancedKnobs.getMatrixAt(i, this.m);
        this.highlights[id].position.set(0, 0, 0);
        this.highlights[id].position.applyMatrix4(this.m);
      }
    }
  }
  move(ray: THREE.Ray, id: number): void { }
  end(id: number): void { }

  isEnabled(): boolean {
    return Util.isModelVisible(this);
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

  private selectKnob(i: number) {
    const knob = this.knobs[i];
    const selection = new KnobAction(knob, this.motions);
    this.instancedKnobs.getMatrixAt(i, selection.matrix);
    selection.position.applyMatrix4(selection.matrix);
    selection.name = 'Selection';
    this.add(selection);
  }

  private async buildKnobs() {
    console.log('Build Knobs');
    const knobModel = await this.loadKnob();
    this.instancedKnobs = new InstancedObject(knobModel, this.knobs.length);
    this.add(this.instancedKnobs);
    for (let i = 0; i < this.knobs.length; ++i) {
      const xy = this.getKnobXY(i);
      const translation = new Matrix4();
      translation.makeTranslation(xy.x, xy.y, 0);
      const rotation = new THREE.Matrix4();
      rotation.makeRotationX(Math.PI / 2);
      rotation.premultiply(translation);
      this.instancedKnobs.setMatrixAt(i, rotation);
      const knob = this.knobs[i];
      knob.addTarget(KnobTarget.fromInstancedObject(this.instancedKnobs, i));
    }
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