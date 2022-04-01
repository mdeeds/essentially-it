import { Knob, KnobTarget } from "./knob";
import { AnyParam } from "./params";

export type TransferFunction = (x: number) => number;

export class ADSR {
  readonly attackKnob: Knob = new Knob('A', 0, 5, 0.05);
  readonly decayKnob: Knob = new Knob('D', 0, 5, 0.05);
  readonly sustainKnob: Knob = new Knob('S', 0, 5, 0.3);
  readonly releaseKnob: Knob = new Knob('R', 0, 5, 1.0);

  private attackS = 0.05;
  private decayS = 0.05;
  private sustainS = 0.3;
  private releaseS = 1;

  private static Identity: TransferFunction = function (x: number) { return x; };

  constructor(private audioCtx: AudioContext, private param: AnyParam,
    private transferFunction: TransferFunction = ADSR.Identity,
    private exponential = false) {
    this.attackKnob.addTarget(new KnobTarget(
      (x: number) => { this.attackS = x; }))
    this.decayKnob.addTarget(new KnobTarget(
      (x: number) => { this.decayS = x; }))
    this.sustainKnob.addTarget(new KnobTarget(
      (x: number) => { this.sustainS = x; }))
    this.releaseKnob.addTarget(new KnobTarget(
      (x: number) => { this.releaseS = x; }))
  }

  private linearTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.attackS;
    this.param.linearRampToValueAtTime(
      this.transferFunction(1.0), t);
    t += this.decayS;
    const releaseTime = t;
    this.param.linearRampToValueAtTime(
      this.transferFunction(this.sustainS), t);
    return releaseTime;
  }
  private linearRelease() {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.releaseS;
    this.param.linearRampToValueAtTime(
      this.transferFunction(0), t);
  }

  private exponentialTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    this.param.setValueAtTime(t, this.transferFunction(0));
    t += this.attackS;
    this.param.exponentialRampToValueAtTime(
      this.transferFunction(1.0), t);
    t += this.decayS;
    const releaseTime = t;
    this.param.exponentialRampToValueAtTime(
      this.transferFunction(this.sustainS), t);
    return releaseTime;
  }

  private exponentialRelease() {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.releaseS;
    this.param.exponentialRampToValueAtTime(
      this.transferFunction(0), t);
  }

  public trigger(): number {
    if (this.exponential) {
      return this.exponentialTrigger();
    } else {
      return this.linearTrigger();
    }
  }
  public release() {
    if (this.exponential) {
      this.exponentialRelease();
    } else {
      this.linearRelease();
    }
  }
}