
export type AnyParam = MultiParam | AudioParam | AttenuatedParam;

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
