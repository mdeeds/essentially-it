import { Knob, KnobTarget } from "./knob";
import { AnyParam } from "./params";

export type TransferFunction = (x: number) => number;

export class AR {
  readonly attackKnob: Knob = new Knob('A', 0, 5, 0.05);
  readonly releaseKnob: Knob = new Knob('R', 0, 5, 0.2);

  private attackS = 0.05;
  private releaseS = 1;

  private static Identity: TransferFunction = function (x: number) { return x; };

  constructor(private audioCtx: AudioContext, private param: AnyParam,
    private transferFunction: TransferFunction = AR.Identity,
    private exponential = false) {
    this.attackKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.attackS = x; }))
    this.releaseKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.releaseS = x; }))
    this.param.setValueAtTime(this.transferFunction(0), audioCtx.currentTime);
  }

  private linearTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.attackS;
    this.param.setTargetAtTime(
      this.transferFunction(1.0), t, this.attackS / 2);
    t += this.releaseS;
    const releaseTime = t;
    this.param.setTargetAtTime(
      this.transferFunction(0), t, this.releaseS / 2);
    return releaseTime;
  }
  private linearRelease() {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    t += this.releaseS;
    this.param.setTargetAtTime(
      this.transferFunction(0), t, this.releaseS / 2);
  }

  private exponentialTrigger(): number {
    let t = this.audioCtx.currentTime;
    this.param.cancelScheduledValues(t);
    this.param.setValueAtTime(t, this.transferFunction(0));
    t += this.attackS;
    this.param.exponentialRampToValueAtTime(
      this.transferFunction(1.0), t);
    t += this.releaseS;
    const releaseTime = t;
    this.param.exponentialRampToValueAtTime(
      this.transferFunction(0), t);
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