import * as THREE from "three";
import { Motion } from "../motion";
import { Tick, Ticker } from "../ticker";
import { Knob } from "./knob";
import { SelectionSphere } from "./selectionSphere";

export class KnobAction extends THREE.Object3D implements Ticker {
  private static blandColor = new THREE.Color('#888');
  private highlight: SelectionSphere;
  private knob: Knob = null;

  constructor(private motions: Motion[], color: THREE.Color) {
    super();
    this.highlight = new SelectionSphere(1, color);
    this.add(this.highlight);
  }

  private p = new THREE.Vector3();
  private p2 = new THREE.Vector3();
  public tick(t: Tick) {
    if (!this.knob) {
      return;
    }
    for (let i = 0; i < this.motions.length; ++i) {
      const m = this.motions[i];
      if (m.getDistanceToCamera() > 0.4) {
        if (m.orientX.y > 0.2) {
          this.knob.change(m.velocity.length());
        } else if (
          m.orientX.y < -0.2) {
          this.knob.change(-m.velocity.length());
        }
      }
    }
  }

  public setKnob(knob: Knob) {
    this.knob = knob;
  }
}