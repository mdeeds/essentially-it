import * as THREE from "three";
import { Motion } from "../motion";
import { Tick, Ticker } from "../ticker";
import { Knob } from "./knob";
import { SelectionSphere } from "./selectionSphere";

export class KnobAction extends THREE.Object3D implements Ticker {
  private static pointColors = [
    new THREE.Color('#f39'), new THREE.Color('#93f')];
  private static blandColor = new THREE.Color('#888');
  private highlight: SelectionSphere;

  constructor(knob: Knob, private motions: Motion[]) {
    super();
    this.highlight = new SelectionSphere(1, new THREE.Color('yellow'));
    this.add(this.highlight);
  }

  private p = new THREE.Vector3();
  private p2 = new THREE.Vector3();
  public tick(t: Tick) {
    this.highlight.setColor(KnobAction.blandColor);
    for (let i = 0; i < this.motions.length; ++i) {
      const m = this.motions[i];
      if (m.getDistanceToCamera() > 0.4) {
        this.getWorldPosition(this.p);
        m.rayZ.closestPointToPoint(this.p, this.p2);
        this.p2.sub(this.p);
        if (this.p2.length() < 0.1) {
          this.highlight.setColor(KnobAction.pointColors[i]);
        }
      }
    }
  }
}