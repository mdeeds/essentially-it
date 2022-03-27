import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { InstancedObject } from "./instancedObject";

import { Knob } from "./knob";

export class Panel extends THREE.Object3D {
  private static kKnobSpacingM = 0.3;
  private knobsWide: number;
  constructor(private knobs: Knob[], private knobsHigh: number) {
    super();
    this.buildPanel();
  }

  private buildPanel() {
    this.knobsWide = Math.ceil(this.knobs.length / this.knobsHigh);

    const panelCanvas = document.createElement('canvas');
    const panelTexture = new THREE.CanvasTexture(panelCanvas);
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: panelTexture
    });

    const ctx = panelCanvas.getContext('2d');
    ctx.fillStyle = '#f0f';
    ctx.fillRect(0, 0, panelCanvas.width, panelCanvas.height);

    const surface = new THREE.PlaneBufferGeometry(
      this.knobsWide * Panel.kKnobSpacingM, this.knobsHigh * Panel.kKnobSpacingM);

    this.add(new THREE.Mesh(surface, panelMaterial));
    this.buildKnobs();
  }

  private async buildKnobs() {
    const knobModel = await this.loadKnob();
    const instanced = new InstancedObject(knobModel, this.knobs.length);
    this.add(instanced);
    const left = -(this.knobsWide * 0.5 * Panel.kKnobSpacingM);
    const top = -(this.knobsHigh * 0.5 * Panel.kKnobSpacingM);
    for (let i = 0; i < this.knobs.length; ++i) {
      const x = Math.floor(i / this.knobsHigh);
      const y = (i % this.knobsHigh);
      const m = new THREE.Matrix4();
      m.makeTranslation(
        left + x * Panel.kKnobSpacingM,
        top + y * Panel.kKnobSpacingM, 0.05);
      instanced.setMatrixAt(i, m);
    }
  }

  private async loadKnob(): Promise<THREE.Object3D> {
    const loader = new GLTFLoader();
    return new Promise((resolve) => {
      loader.load('model/platform.gltf', (gltf) => {
        resolve(gltf.scene);
      });
    });
  }
}