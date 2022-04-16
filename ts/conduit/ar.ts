import { Knob, KnobTarget } from "./knob";
import { AnyParam } from "./params";

export type TransferFunction = (x: number) => number;

export class AD {
  readonly attackKnob: Knob = new Knob('A', 0, 5, 0.05);
  readonly decayKnob: Knob = new Knob('D', 0, 5, 0.2);

  private attackS = 0.05;
  private decayS = 1;

  static Identity: TransferFunction = function (x: number) { return x; };

  constructor(private audioCtx: AudioContext, private param: AnyParam,
    private transferFunction: TransferFunction = AD.Identity,
    private exponential = false) {
    this.attackKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.attackS = x; }))
    this.decayKnob.addTarget(new KnobTarget(
      (p: number, x: number) => { this.decayS = x; }))
    let zero = this.transferFunction(0);
    if (exponential) {
      zero = Math.max(zero, 1e-4);
    }
    this.param.setValueAtTime(zero, audioCtx.currentTime);
  }

  private linearTrigger(latencyS: number): number {
    let t = this.audioCtx.currentTime + latencyS;
    this.param.cancelScheduledValues(t);
    t += this.attackS + 0.01;
    this.param.linearRampToValueAtTime(
      this.transferFunction(1.0), t);
    t += this.decayS + 0.001;
    const decayTime = t;
    this.param.linearRampToValueAtTime(
      this.transferFunction(0), t);
    return decayTime;
  }

  private exponentialTrigger(latencyS: number): number {
    let t = this.audioCtx.currentTime + latencyS;
    this.param.cancelScheduledValues(t);
    const zero = Math.max(1e-4, this.transferFunction(0));
    t += this.attackS + 0.01;
    let one = this.transferFunction(1.0);
    this.param.exponentialRampToValueAtTime(one, t);
    t += this.decayS + 0.001;
    const decayTime = t;
    this.param.exponentialRampToValueAtTime(zero, t);
    return decayTime;
  }

  public trigger(latencyS: number): number {
    if (this.exponential) {
      return this.exponentialTrigger(latencyS);
    } else {
      return this.linearTrigger(latencyS);
    }
  }
  public release() {
  }
}