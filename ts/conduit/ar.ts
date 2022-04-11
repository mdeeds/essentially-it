import { Knob, KnobTarget } from "./knob";
import { AnyParam } from "./params";

export type TransferFunction = (x: number) => number;

export class AR {
  readonly attackKnob: Knob = new Knob('A', 0, 5, 0.05);
  readonly releaseKnob: Knob = new Knob('R', 0, 5, 0.2);

  private attackS = 0.05;
  private releaseS = 1;

  static Identity: TransferFunction = function (x: number) { return x; };

  constructor(private audioCtx: AudioContext, private param: AnyParam,
    private transferFunction: TransferFunction = AR.Identity,
    private exponential = false) {
    this.attackKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.attackS = x; }))
    this.releaseKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.releaseS = x; }))
    let zero = this.transferFunction(0);
    if (exponential) {
      zero = Math.max(zero, 1e-4);
    }
    this.param.setValueAtTime(zero, audioCtx.currentTime);
  }

  private linearTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.attackS + 0.001;
    this.param.linearRampToValueAtTime(
      this.transferFunction(1.0), t);
    t += this.releaseS + 0.001;
    const releaseTime = t;
    this.param.linearRampToValueAtTime(
      this.transferFunction(0), t);
    return releaseTime;
  }
  private linearRelease() {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.releaseS + 0.001;
    this.param.setTargetAtTime(
      this.transferFunction(0), t, this.releaseS / 2);
  }

  private exponentialTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += 0.001;
    const zero = Math.max(1e-4, this.transferFunction(0));
    this.param.exponentialRampToValueAtTime(zero, t);
    t += this.attackS + 0.001;
    let one = this.transferFunction(1.0);
    this.param.exponentialRampToValueAtTime(one, t);
    console.log(`Ramping to ${one.toFixed(2)} over ${this.attackS.toFixed(2)} seconds.`);
    console.log(`Target ${this.param['constructor'].name}`);
    if (this.param instanceof AudioParam) {
      console.log(this.param);
    }
    t += this.releaseS + 0.001;
    const releaseTime = t;
    this.param.exponentialRampToValueAtTime(zero, t);
    return releaseTime;
  }

  private exponentialRelease() {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.releaseS + 0.001;
    const zero = Math.max(1e-4, this.transferFunction(0));
    this.param.exponentialRampToValueAtTime(zero, t);
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