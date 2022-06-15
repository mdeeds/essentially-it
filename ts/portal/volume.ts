export class Volume {
  private open: boolean[] = [];
  private stride: number;
  constructor(readonly radius: number) {
    this.stride = 2 * radius + 1;
    this.open.length = this.stride * this.stride * this.stride;
  }

  private getIndex(x: number, y: number, z: number): number {
    const xx = Math.round(x) + this.radius;
    const yy = Math.round(y) + this.radius;
    const zz = Math.round(z) + this.radius;

    const i = xx + yy * this.stride + zz * this.stride * this.stride;
    if (i < 0 || i >= this.stride * this.stride * this.stride) {
      throw new Error('Out of range!');
    }
    return i;
  }

  public set(x: number, y: number, z: number, isOpen: boolean) {
    this.open[this.getIndex(x, y, z)] = isOpen;
  }

  public isOpen(x: number, y: number, z: number): boolean {
    return !!this.open[this.getIndex(x, y, z)];
  }

}