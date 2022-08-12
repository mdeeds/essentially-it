import * as THREE from "three";

class CubeRange {
  readonly mini: number;
  readonly maxi: number;
  constructor(private voxelCount: number,
    x: number, radius: number, private voxelSize: number) {
    const ci = this.get1DIndex(x);

    this.mini = Math.max(0, Math.round(ci - radius / voxelSize));
    this.maxi = Math.min(voxelCount - 1, Math.round(ci + radius / voxelSize));
  }

  private get1DIndex(x: number) {
    let xx = x + this.voxelSize * this.voxelCount / 2;
    let i = Math.round(xx / this.voxelSize);
    return Math.min(this.voxelCount - 1, Math.max(0, i));
  }
}

export class CubeTexture {
  private static kVoxelSize = 0.1;

  private static kCoarse = 8;
  private static kY = CubeTexture.kCoarse * CubeTexture.kCoarse;
  private static kX = 64;
  private static kZ = 64;

  private data = new Uint8Array(
    CubeTexture.kX * CubeTexture.kY * CubeTexture.kZ);
  constructor() {
    console.time('Initialize 255');
    for (let i = 0; i < this.data.length; ++i) {
      this.data[i] = 255;
    }
    console.timeEnd('Initialize 255');
  }

  private sdToUInt8(sd: number): number {
    //     sd    uint8
    //  -0.55        0
    //      0       55
    //   2.00      255
    return Math.min(255, Math.max(0, Math.round((sd + 0.55) * 100)));
  }

  getX(i: number, voxelCount: number): number {
    i -= voxelCount / 2;
    return i * CubeTexture.kVoxelSize;
  }

  private vectorToIndex(pos: THREE.Vector3): number {
    const i = Math.round(pos.x / CubeTexture.kVoxelSize + CubeTexture.kX / 2);
    const j = Math.round(pos.y / CubeTexture.kVoxelSize + CubeTexture.kY / 2);
    const k = Math.round(pos.z / CubeTexture.kVoxelSize + CubeTexture.kZ / 2);
    return this.getIndex(i, j, k);
  }

  private getIndex(i: number, j: number, k: number): number {
    const k0 = k % CubeTexture.kCoarse;
    const k1 = Math.floor(k / CubeTexture.kCoarse);

    return i
      + j * CubeTexture.kX
      + k0 * CubeTexture.kX * CubeTexture.kY
      + k1 * CubeTexture.kX * CubeTexture.kY * CubeTexture.kCoarse;
  }

  setSphere(center: THREE.Vector3, radius: number) {
    const iRange =
      new CubeRange(CubeTexture.kX, center.x,
        radius + 20, CubeTexture.kVoxelSize);
    const jRange =
      new CubeRange(CubeTexture.kY, center.y,
        radius + 20, CubeTexture.kVoxelSize);
    const kRange =
      new CubeRange(CubeTexture.kZ, center.z,
        radius + 20, CubeTexture.kVoxelSize);

    const t = new THREE.Vector3();
    const x0 = this.getX(iRange.mini, CubeTexture.kX);
    const y0 = this.getX(jRange.mini, CubeTexture.kY);
    const z0 = this.getX(kRange.mini, CubeTexture.kZ);
    const dd = CubeTexture.kVoxelSize;

    let y = y0;
    for (let j = jRange.mini; j <= jRange.maxi; ++j) {
      let z = z0;
      for (let k = kRange.mini; k < kRange.maxi; ++k) {
        let index = this.getIndex(iRange.mini, j, k);
        let x = x0;
        for (let i = iRange.mini; i <= iRange.maxi; ++i) {
          t.set(x, y, z);
          t.sub(center);
          const sd = t.length() - radius;
          this.data[index] = Math.min(this.data[index], this.sdToUInt8(sd));
          ++index;
          x += dd;
        }
        z += dd;
      }
      y += dd;
    }
  }

  // TODO: clearSphere just like above, but invert and max.

  sdf(pos: THREE.Vector3) {
    // As long as the grid size is larger or equal to the voxel
    // size, no sense in interpolating.
    const val = (this.data[this.vectorToIndex(pos)] - 55) / 100;
    return val;
  }

  gradient(pos: THREE.Vector3, g: THREE.Vector3) {
    let i = Math.round(pos.x / CubeTexture.kVoxelSize + CubeTexture.kX / 2);
    let j = Math.round(pos.y / CubeTexture.kVoxelSize + CubeTexture.kY / 2);
    let k = Math.round(pos.z / CubeTexture.kVoxelSize + CubeTexture.kZ / 2);

    // TODO: this is pretty horrible for performance.
    // Better to just extend the arrays by 1 cell on all sides and assert
    // that we are within bounds.
    if (i < 1) i = 1;
    if (j < 1) j = 1;
    if (k < 1) k = 1;
    if (i >= CubeTexture.kX - 1) i = CubeTexture.kX - 2;
    if (j >= CubeTexture.kY - 1) i = CubeTexture.kY - 2;
    if (k >= CubeTexture.kZ - 1) i = CubeTexture.kZ - 2;

    const dx = this.data[this.getIndex(i + 1, j, k)] -
      this.data[this.getIndex(i - 1, j, k)];
    const dy = this.data[this.getIndex(i, j + 1, k)] -
      this.data[this.getIndex(i, j - 1, k)];
    const dz = this.data[this.getIndex(i, j, k + 1)] -
      this.data[this.getIndex(i, j, k - 1)];
    g.set(dx, dy, dz);
    if (g.manhattanLength() > 0) {
      g.normalize();
    }
  }



}