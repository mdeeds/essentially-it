import { AR } from "./ar";
import { AudioUtil } from "./audioUtil";
import { Knob, KnobTarget } from "./knob";
import { AttenuatedParam, MultiParam, VpoSum } from "./params";
import { Synth } from "./synth";

export class SawSynth implements Synth {
  readonly midiPitch = new Knob('MIDI', 0, 127, 43);
  public e2Attack: Knob;
  public e2Release: Knob;

  readonly envFilter = new Knob('Freq', -5, 5, 0.0);
  readonly resonance = new Knob('Res', 0, 50, 0);
  public e1Attack: Knob;
  public e1Release: Knob;

  public envToOsc = new Knob('Env2Osc', 0, 1, 0.0);
  public envToFilt = new Knob('Env2Filter', 0, 1, 1.0);

  private env1: AR;
  private env2: AR;

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

    const vca = this.makeVca();
    const volume = this.makeVca();
    this.env1 = new AR(this.audioCtx, vca.gain);
    this.e1Attack = this.env1.attackKnob;
    this.e1Release = this.env1.releaseKnob;

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
  }

  getKnobs(): Knob[] {
    return [
      this.e1Attack, this.e1Release,
      this.envFilter, this.resonance,
      this.e2Attack, this.e2Release,
      this.envToOsc, this.envToFilt, this.midiPitch]
  }

  trigger(): void {
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
    bpf.type = 'lowpass';
    return bpf;
  }

  private makeVca(): GainNode {
    const vca = this.audioCtx.createGain();
    vca.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    return vca;
  }
}