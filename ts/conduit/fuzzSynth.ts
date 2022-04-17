import { S } from "../settings";
import { AD } from "./ar";
import { AudioUtil } from "./audioUtil";
import { Knob, KnobTarget } from "./knob";
import { VpoSum } from "./params";
import { Synth } from "./synth";

export class FuzzSynth implements Synth {
  static snarePatch = {
    "A1": 0, "R1": 0.05333999999761583,
    "Freq": 0.42922999999523154, "Res": 0.11750999999940366,
    "A2": 0, "R2": 0.07186999999880792, "Env2Filter": 0.8099900000035754,
    "Vol": 0.3180099999964238
  };

  public e2Attack: Knob;
  public e2Decay: Knob;

  readonly envFilter = new Knob('Freq', -5, 5, 0.0);
  readonly resonance = new Knob('Res', 0, 50, 0);
  public e1Attack: Knob;
  public e1Decay: Knob;

  public envToFilt = new Knob('Env2Filter', 0, 1, 0.0);

  private env1: AD;
  private env2: AD;

  public volumeKnob = new Knob('Vol', 0, 1, 0.125);

  constructor(private audioCtx: AudioContext) {
    const osc = this.makeOsc(audioCtx);

    const bpf = this.makeBpf();

    const attToFilter = new VpoSum(bpf.frequency);
    this.envToFilt.addTarget(new KnobTarget((p, x) => {
      attToFilter.setAttenuation(x);
    }));

    this.env2 = new AD(this.audioCtx, attToFilter);
    this.e2Attack = this.env2.attackKnob;
    this.e2Decay = this.env2.decayKnob;
    this.e2Attack.name = 'A2';
    this.e2Decay.name = 'R2';

    const vca = this.makeVca();


    this.env1 = new AD(this.audioCtx, vca.gain, AD.Identity, true);
    this.e1Attack = this.env1.attackKnob;
    this.e1Decay = this.env1.decayKnob;
    this.e1Attack.name = 'A1';
    this.e1Decay.name = 'R1';

    this.envFilter.addTarget(new KnobTarget((p: number, x: number) => {
      attToFilter.setBias(x);
    }));
    this.resonance.addTarget(
      KnobTarget.fromAudioParam(bpf.Q, audioCtx, 0.05));

    const volume = this.makeVca();

    this.volumeKnob.addTarget(
      KnobTarget.fromAudioParam(volume.gain, audioCtx, 0.01));
    const saturation = AudioUtil.makeSaturation(audioCtx);

    osc.connect(bpf);
    bpf.connect(vca);
    vca.connect(volume);
    volume.connect(saturation);
    saturation.connect(audioCtx.destination);

    // this.loadPatch(FuzzSynth.simplePatch);
  }

  getKnobs(): Knob[] {
    return [
      this.e1Attack, this.e1Decay,
      this.envFilter, this.resonance,
      this.e2Attack, this.e2Decay,
      this.envToFilt, this.volumeKnob]
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

  trigger(latencyS: number, velocity: number): void {
    // let patch = {};
    // for (const k of this.getKnobs()) {
    //   patch[k.name] = k.getP();
    // }
    // console.log(JSON.stringify(patch));
    this.env1.trigger(latencyS, velocity);
    this.env2.trigger(latencyS, velocity);
  }

  private makeOsc(audioCtx: AudioContext): AudioBufferSourceNode {
    // Twelve-second monophonic buffer
    const arrayBuffer = audioCtx.createBuffer(
      /*numberOfChannels=*/1, audioCtx.sampleRate * 12, audioCtx.sampleRate);

    // Fill the buffer with brown noise;  We add an adjustment to the random
    // noise so that it will never go outside the -1 to 1 range.
    const channelData = arrayBuffer.getChannelData(0);
    let previousValue = 0.0;
    const noiseStep = S.float('bh');
    for (let i = 0; i < arrayBuffer.length; i++) {
      // Clamp the previous value so we can't exceed -1 to 1.
      previousValue = Math.max(-1 + noiseStep,
        Math.min(1 - noiseStep, previousValue));
      const delta = (Math.random() - 0.5) * 2 * noiseStep;
      previousValue = previousValue + delta;
      channelData[i] = previousValue;
    }

    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    var source = audioCtx.createBufferSource();
    source.loop = true;
    source.buffer = arrayBuffer;
    source.start();
    return source;
  }

  private makeBpf(): BiquadFilterNode {
    const bpf = this.audioCtx.createBiquadFilter();
    bpf.type = 'highpass';
    return bpf;
  }

  private makeVca(): GainNode {
    const vca = this.audioCtx.createGain();
    vca.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    return vca;
  }
}