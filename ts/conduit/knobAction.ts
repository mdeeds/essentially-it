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
    private particles: ParticleSystem) {
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
    let c = KnobAction.blandColor;
    const m = this.motion;
    if (m.getDistanceToCamera() > 0.4) {
      c = KnobAction.brightColor;
      if (m.orientX.y > 0.2) {
        this.knob.change(m.velocity.length());
      } else if (
        m.orientX.y < -0.2) {
        this.knob.change(-m.velocity.length());
      }
    }
    this.particles.AddParticle(
      m.p, m.orientX, c);
  }

  public setKnob(knob: Knob) {
    this.knob = knob;
  }
}