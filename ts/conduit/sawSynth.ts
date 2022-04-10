import { stringify } from "querystring";
import { AR } from "./ar";
import { AudioUtil } from "./audioUtil";
import { Knob, KnobTarget } from "./knob";
import { AttenuatedParam, MultiParam, VpoSum } from "./params";
import { Synth } from "./synth";

export class SawSynth implements Synth {

  static bassDrumPatch = {
    "A1": 0.01, "R1": 0.04,
    "Freq": 0.24324000000357635, "Res": 0.13009999999999997,
    "A2": 0.011650000000000002, "R2": 0.1266200000017881,
    "Env2Osc": 0.08011000000238418, "Env2Filter": 0.5380799999982115,
    "MIDI": 0.2652026771641621, "Vol": 0.3850599999994041
  };

  static bassDrum2Patch =
    {
      "A1": 0.0066599999994039535, "R1": 0.04066000000238415,
      "Freq": 0.2565600000023844, "Res": 0.4568100000023841,
      "A2": 0, "R2": 0.011540000000596122,
      "Env2Osc": 0.3451800000011929, "Env2Filter": 0.7866899999976152,
      "MIDI": 0.28330267716714197, "Vol": 0.6600899999976161
    }

  static roboBeepPatch =
    {
      "A1": 0.008190000000596052, "R1": 0.027,
      "Freq": 0.4858700000107309, "Res": 0.17142999999821204,
      "A2": 0.05184000000059607, "R2": 0,
      "Env2Osc": 0.5496299999982115, "Env2Filter": 0.8916699999988075,
      "MIDI": 0.34936267715760555, "Vol": 0.358600000008941
    };

  readonly midiPitch = new Knob('MIDI', 0, 127, 43);
  public e2Attack: Knob;
  public e2Release: Knob;

  readonly envFilter = new Knob('Freq', -5, 5, 0.0);
  readonly resonance = new Knob('Res', 0, 50, 0);
  public e1Attack: Knob;
  public e1Release: Knob;

  public envToOsc = new Knob('Env2Osc', 0, 1, 0.0);
  public envToFilt = new Knob('Env2Filter', 0, 1, 0.0);

  private env1: AR;
  private env2: AR;

  public volumeKnob = new Knob('Vol', 0, 8, 1.0);

  constructor(private audioCtx: AudioContext) {
    const osc = this.makeOsc();
    const bpf = this.makeBpf();

    const attToOsc = new VpoSum(osc.frequency);
    this.envToOsc.addTarget(new KnobTarget((p, x) => {
      attToOsc.setAttenuation(x);
    }));
    const attToFilter = new VpoSum(bpf.frequency);
    this.envToFilt.addTarget(new KnobTarget((p, x) => {
      attToFilter.setAttenuation(x);
    }));

    const env2Mult = new MultiParam([attToOsc, attToFilter]);
    this.env2 = new AR(this.audioCtx, env2Mult);
    this.e2Attack = this.env2.attackKnob;
    this.e2Release = this.env2.releaseKnob;
    this.e2Attack.name = 'A2';
    this.e2Release.name = 'R2';

    const vca = this.makeVca();
    const volume = this.makeVca();

    this.volumeKnob.addTarget(
      KnobTarget.fromAudioParam(volume.gain, audioCtx, 0.01));

    this.env1 = new AR(this.audioCtx, vca.gain);
    this.e1Attack = this.env1.attackKnob;
    this.e1Release = this.env1.releaseKnob;
    this.e1Attack.name = 'A1';
    this.e1Release.name = 'R1';

    this.midiPitch.addTarget(new KnobTarget((p: number, x: number) => {
      attToOsc.setBias(AudioUtil.MidiToVolts(x));
    }));

    this.envFilter.addTarget(new KnobTarget((p: number, x: number) => {
      attToFilter.setBias(x);
    }));
    this.resonance.addTarget(
      KnobTarget.fromAudioParam(bpf.Q, audioCtx, 0.05));

    osc.connect(bpf);
    bpf.connect(vca);
    vca.connect(volume);
    volume.connect(audioCtx.destination);

    this.loadPatch(SawSynth.bassDrumPatch);
  }

  getKnobs(): Knob[] {
    return [
      this.e1Attack, this.e1Release,
      this.envFilter, this.resonance,
      this.e2Attack, this.e2Release,
      this.envToOsc, this.envToFilt, this.midiPitch,
      this.volumeKnob]
  }

  private loadPatch(patch: Object) {
    const knobMap = new Map<string, Knob>();
    for (const k of this.getKnobs()) {
      knobMap.set(k.name, k);
    }
    for (const name in patch) {
      knobMap.get(name).setP(patch[name]);
    }
  }

  trigger(): void {
    let patch = {};
    for (const k of this.getKnobs()) {
      patch[k.name] = k.getP();
    }
    console.log(JSON.stringify(patch));
    this.env1.trigger();
    this.env2.trigger();
  }

  private makeOsc(): OscillatorNode {
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.start();
    return osc;
  }

  private makeBpf(): BiquadFilterNode {
    const bpf = this.audioCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    return bpf;
  }

  private makeVca(): GainNode {
    const vca = this.audioCtx.createGain();
    vca.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    return vca;
  }
}