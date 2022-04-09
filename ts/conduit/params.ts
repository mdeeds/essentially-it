import { AudioUtil } from "./audioUtil";

export type AnyParam = MultiParam | AudioParam | AttenuatedParam | VpoSum;

export class MultiParam {
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
}

export class AttenuatedParam {
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
}

export class VpoSum {
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

  public cancelScheduledValues(t: number) {
    this.outputParam.cancelScheduledValues(t);
  }
  public setValueAtTime(value: number, t: number) {
    this.outputParam.setValueAtTime(
      AudioUtil.VoltsToHz(value * this.attenuation + this.bias), t);
  }
  public linearRampToValueAtTime(value: number, t: number) {
    this.outputParam.linearRampToValueAtTime(
      AudioUtil.VoltsToHz(value * this.attenuation + this.bias), t);
  }
  public exponentialRampToValueAtTime(value: number, t: number) {
    this.outputParam.exponentialRampToValueAtTime(
      AudioUtil.VoltsToHz(value * this.attenuation + this.bias), t);
  }
}
