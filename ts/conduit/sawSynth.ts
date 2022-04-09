import { AR } from "./ar";
import { Knob, KnobTarget } from "./knob";
import { AttenuatedParam, MultiParam } from "./params";
import { Synth } from "./synth";

export class SawSynth implements Synth {
  readonly midiPitch = new Knob('MIDI', 0, 127, 43);

  readonly envPitch = new Knob('Freq', 20, 2000, 200);
  public e2Attack: Knob;
  public e2Release: Knob;
  readonly envFilter = new Knob('Freq', 0.0, 1.0, 0.0);
  readonly resonance = new Knob('Res', 0, 5, 0);
  public e1Attack: Knob;
  public e1Release: Knob;

  private env1: AR;
  private env2: AR;

  private frequency = 110;  // Hz
  constructor(private audioCtx: AudioContext) {
    const osc = this.makeOsc();
    const bpf = this.makeBpf();

    const arBias = (x: number) => {
      // One octave per volt.
      return this.frequency * Math.pow(2, x);
    };
    const freqMult = new MultiParam([osc.frequency, bpf.frequency]);
    this.env2 = new AR(this.audioCtx, osc.frequency, arBias, true);
    this.e2Attack = this.env2.attackKnob;
    this.e2Release = this.env2.releaseKnob;
    this.envPitch.addTarget(new KnobTarget((p: number, x: number) => {
      freqMult.exponentialRampToValueAtTime(
        x, this.audioCtx.currentTime + 0.05);
    }));

    const vca = this.makeVca();
    const volume = this.makeVca();
    this.env1 = new AR(this.audioCtx, vca.gain);
    this.e1Attack = this.env1.attackKnob;
    this.e1Release = this.env1.releaseKnob;

    this.midiPitch.addTarget(new KnobTarget((p: number, x: number) => {
      const hz = 440 * Math.pow(2, (x - 69) / 12);
      this.frequency = hz;
    }));

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
      this.envPitch,]
  }

  trigger(): void {
    this.env1.trigger();
    this.env2.trigger();
  }

  private makeOsc(): OscillatorNode {
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
    osc.start();
    return osc;
  }

  private makeBpf(): BiquadFilterNode {
    const bpf = this.audioCtx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(this.frequency, this.audioCtx.currentTime);
    return bpf;
  }

  private makeVca(): GainNode {
    const vca = this.audioCtx.createGain();
    vca.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    return vca;
  }
}