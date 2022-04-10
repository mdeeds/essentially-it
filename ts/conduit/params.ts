import { AudioUtil } from "./audioUtil";

export interface AnyParam {
  cancelScheduledValues(t: number): void;
  setValueAtTime(value: number, t: number): void;
  linearRampToValueAtTime(value: number, t: number): void;
  exponentialRampToValueAtTime(value: number, t: number);
  setTargetAtTime(value: number, startTime: number, timeConstant: number);
}

export class MultiParam implements AnyParam {
  constructor(private params: AnyParam[]) { }
  public cancelScheduledValues(t: number) {
    for (const p of this.params) {
      p.cancelScheduledValues(t);
    }
  }
  public setValueAtTime(value: number, t: number) {
    for (const p of this.params) {
      p.setValueAtTime(value, t);
    }
  }
  public linearRampToValueAtTime(value: number, t: number) {
    for (const p of this.params) {
      p.linearRampToValueAtTime(value, t);
    }
  }
  public exponentialRampToValueAtTime(value: number, t: number) {
    for (const p of this.params) {
      p.exponentialRampToValueAtTime(value, t);
    }
  }
  public setTargetAtTime(value: number, startTime: number,
    timeConstant: number) {
    for (const p of this.params) {
      p.setTargetAtTime(value, startTime, timeConstant);
    }
  }
}

export class AttenuatedParam implements AnyParam {
  private attenuation = 1.0;
  constructor(private param: AnyParam) { }
  public setAttenuation(x: number) {
    // TODO: Ideally this would change any scheduled values as well.
    this.attenuation = x;
  }

  public cancelScheduledValues(t: number) {
    this.param.cancelScheduledValues(t);
  }
  public setValueAtTime(value: number, t: number) {
    this.param.setValueAtTime(value * this.attenuation, t);
  }
  public linearRampToValueAtTime(value: number, t: number) {
    this.param.linearRampToValueAtTime(value * this.attenuation, t);
  }
  public exponentialRampToValueAtTime(value: number, t: number) {
    this.param.exponentialRampToValueAtTime(value * this.attenuation, t);
  }
  public setTargetAtTime(value: number, startTime: number,
    timeConstant: number) {
    this.param.setTargetAtTime(
      value * this.attenuation, startTime, timeConstant);
  }
}

export class VpoSum implements AnyParam {
  private bias = 0;
  private attenuation = 1;
  constructor(private outputParam: AnyParam) {
  }

  public setAttenuation(x: number) {
    this.attenuation = x;
  }
  public setBias(x: number) {
    this.bias = x;
  }

  private transform(value: number) {
    return AudioUtil.VoltsToHz(value * this.attenuation + this.bias);
  }

  public cancelScheduledValues(t: number) {
    this.outputParam.cancelScheduledValues(t);
  }
  public setValueAtTime(value: number, t: number) {
    this.outputParam.setValueAtTime(this.transform(value), t);
  }
  public linearRampToValueAtTime(value: number, t: number) {
    this.outputParam.linearRampToValueAtTime(this.transform(value), t);
  }
  public exponentialRampToValueAtTime(value: number, t: number) {
    this.outputParam.exponentialRampToValueAtTime(
      this.transform(value), t);
  }
  public setTargetAtTime(value: number, startTime: number,
    timeConstant: number) {
    this.outputParam.setTargetAtTime(
      this.transform(value), startTime, timeConstant);
  }

}
