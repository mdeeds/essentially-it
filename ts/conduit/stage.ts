import * as THREE from "three";
import { DirectionalLight } from "three";
import { Motion } from "../motion";
import { ParticleSystem } from "../particleSystem";
import { S } from "../settings";
import { TactileProvider } from "../tactileProvider";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import { FuzzSynth } from "./fuzzSynth";
import { Panel } from "./panel";
import { SawSynth } from "./sawSynth";
import { Synth } from "./synth";
import { ZigZag } from "./zigZag";

export class ConduitStage extends THREE.Object3D implements World, Ticker {
  private synth: Synth;
  constructor(audioCtx: AudioContext, private motions: Motion[],
    private tactile: TactileProvider, private particles: ParticleSystem,
    private keySet: Set<string>) {
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

    const zigZag = new ZigZag(motions, this.synth, keySet);
    zigZag.position.set(0, S.float('zy'), -0.5);
    this.add(zigZag);
  }

  buildSynth(audioCtx: AudioContext) {
    {  // Saw Synth
      const synth = new SawSynth(audioCtx)
      const knobs = synth.getKnobs();
      const panel = new Panel(knobs, 2, this.motions, this.tactile,
        this.particles, this.keySet, '#d14');
      panel.position.set(1, 2.0, 0);
      panel.rotateY(-Math.PI / 2);
      this.add(panel);
    }
    {  // Fuzz Synth
      this.synth = new FuzzSynth(audioCtx)
      const knobs = this.synth.getKnobs();
      const panel = new Panel(knobs, 2, this.motions, this.tactile,
        this.particles, this.keySet, '#df4');
      panel.position.set(-1, 2.0, 0);
      panel.rotateY(Math.PI / 2);
      this.add(panel);
    }
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  tick(t: Tick) {
  }
}