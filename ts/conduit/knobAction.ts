import * as THREE from "three";
import { Motion } from "../motion";
import { ParticleSystem } from "../particleSystem";
import { Tick, Ticker } from "../ticker";
import { Knob } from "./knob";
import { SelectionSphere } from "./selectionSphere";

export class KnobAction extends THREE.Object3D implements Ticker {
  private static blandColor = new THREE.Color('#888');
  private static brightColor = new THREE.Color('#f0f');
  private highlight: SelectionSphere;
  private knob: Knob = null;

  constructor(private motion: Motion, color: THREE.Color,
    private particles: ParticleSystem, private keySet: Set<String>) {
    super();
    this.highlight = new SelectionSphere(1, color);
    this.add(this.highlight);
  }

  public tick(t: Tick) {
    if (!this.knob) {
      return;
    }
    let c = KnobAction.blandColor;
    const m = this.motion;
    let delta = 0.0;
    if (m.getDistanceToCamera() > 0.4) {
      c = KnobAction.brightColor;
      this.knob.change(m.p.y - m.prevP.y);
    }
    if (this.keySet.has('Equal')) {
      delta = t.deltaS * 0.1;
    } else if (this.keySet.has('Minus')) {
      delta = -t.deltaS * 0.1;
    }
    if (delta != 0.0) {
      this.knob.change(delta);
    }
    this.particles.AddParticle(
      m.p, m.orientX, c);
  }

  public setKnob(knob: Knob) {
    this.knob = knob;
  }
}