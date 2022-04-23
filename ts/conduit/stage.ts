import * as THREE from "three";
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
import { ThresholdMaterial } from "./thresholdMaterial";
import { ZigZag } from "./zigZag";

export class ConduitStage extends THREE.Object3D implements World, Ticker {
  private synths: Synth[] = [];

  private junk: THREE.Object3D;

  constructor(audioCtx: AudioContext, private motions: Motion[],
    private tactile: TactileProvider, private particles: ParticleSystem,
    private keySet: Set<string>) {
    super();
    const sky = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 1),
      new THREE.MeshBasicMaterial({ color: '#bbb', side: THREE.BackSide })
    );
    this.add(sky);

    const light1 = new THREE.DirectionalLight('white', 0.6);
    light1.position.set(20, 20, 0);
    this.add(light1);
    const light2 = new THREE.DirectionalLight('white', 0.6);
    light2.position.set(-20, 20, 0);
    this.add(light2);

    this.buildSynth(audioCtx);

    const zigZag = new ZigZag(motions, this.synths, keySet);
    zigZag.position.set(0, S.float('zy'), -0.5);
    this.add(zigZag);

    const tm = new THREE.Matrix4();
    tm.makeTranslation(0, S.float('zy'), -0.3);
    const material = new ThresholdMaterial(tm);
    this.junk = new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.1, 1),
      material);
    this.add(this.junk);
  }

  buildSynth(audioCtx: AudioContext) {
    {  // Saw Synth
      const synth = new SawSynth(audioCtx)
      const knobs = synth.getKnobs();
      const panel = new Panel(synth, 2, this.motions, this.tactile,
        this.particles, this.keySet, '#d14');
      panel.position.set(1, 2.0, 0);
      panel.rotateY(-Math.PI / 2);
      this.add(panel);
      this.synths.push(synth);
    }
    {  // Fuzz Synth
      const synth = new FuzzSynth(audioCtx)
      const knobs = synth.getKnobs();
      const panel = new Panel(synth, 2, this.motions, this.tactile,
        this.particles, this.keySet, '#df4');
      panel.position.set(-1, 2.0, 0);
      panel.rotateY(Math.PI / 2);
      this.add(panel);
      this.synths.push(synth);
    }
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  tick(t: Tick) {
    this.junk.position.set(0, Math.sin(t.elapsedS) + 1, Math.cos(t.elapsedS));
  }
}