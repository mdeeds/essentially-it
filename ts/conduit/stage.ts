import * as THREE from "three";
import { DirectionalLight } from "three";
import { Motion } from "../motion";
import { ParticleSystem } from "../particleSystem";
import { TactileProvider } from "../tactileProvider";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import { Knob } from "./knob";
import { Panel } from "./panel";
import { SawSynth } from "./sawSynth";
import { Synth } from "./synth";

export class ConduitStage extends THREE.Object3D implements World, Ticker {
  private synth: Synth;
  constructor(audioCtx: AudioContext, private motions: Motion[],
    tactile: TactileProvider, particles: ParticleSystem, keySet: Set<string>) {
    super();
    const sky = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 1),
      new THREE.MeshBasicMaterial({ color: '#bbb', side: THREE.BackSide })
    );
    this.add(sky);

    const light1 = new DirectionalLight('white', 0.6);
    light1.position.set(20, 20, 0);
    this.add(light1);
    const light2 = new DirectionalLight('white', 0.6);
    light2.position.set(-20, 20, 0);
    this.add(light2);

    this.buildSynth(audioCtx);
    const knobs = this.synth.getKnobs();
    const panel = new Panel(knobs, 2, motions, tactile, particles, keySet);
    panel.position.set(1, 2.0, 0);
    panel.rotateY(-Math.PI / 2);
    this.add(panel);
  }

  buildSynth(audioCtx: AudioContext) {
    this.synth = new SawSynth(audioCtx)
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private lastTick = 0;
  tick(t: Tick) {
    if (t.elapsedS - this.lastTick > 1) {
      this.lastTick = t.elapsedS;
      this.synth.trigger();
    }
  }
}