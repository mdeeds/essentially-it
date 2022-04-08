import * as THREE from "three";
import { Motion } from "../motion";
import { Tick, Ticker } from "../ticker";
import { Knob } from "./knob";
import { SelectionSphere } from "./selectionSphere";

export class KnobAction extends THREE.Object3D implements Ticker {
  private static pointColor = new THREE.Color('#f39');
  private static blandColor = new THREE.Color('#888');
  private highlight: SelectionSphere;

  constructor(knob: Knob, private motions: Motion[]) {
    super();
    this.highlight = new SelectionSphere(1, new THREE.Color('yellow'));
    this.add(this.highlight);
  }

  public tick(t: Tick) {
    this.highlight.setColor(KnobAction.blandColor);
    for (const m of this.motions) {
      if (m.getDistanceToCamera() > 0.5) {
        this.highlight.setColor(KnobAction.pointColor);
      }
    }
  }
}