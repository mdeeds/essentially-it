import * as THREE from "three";

export class Zoom {
  public static makePerpendicular(l: number[], r: number[]) {
    const dx = r[0] - l[0];
    const dy = r[1] - l[1];
    return [l[0] - dy, l[1] + dx];
  }

  public static makeZoomMatrix(
    l1: number[], r1: number[],
    l2: number[], r2: number[]): THREE.Matrix3 {

    const p1 = Zoom.makePerpendicular(l1, r1);
    const p2 = Zoom.makePerpendicular(l2, r2);

    const initialPosition = new THREE.Matrix3();
    initialPosition.set(
      l1[0], r1[0], p1[0],
      l1[1], r1[1], p1[1],
      1, 1, 1);

    const newPosition = new THREE.Matrix3();
    newPosition.set(
      l2[0], r2[0], p2[0],
      l2[1], r2[1], p2[1],
      1, 1, 1);

    // console.log(initialPosition);
    // console.log(newPosition);

    initialPosition.invert();
    newPosition.multiplyMatrices(newPosition, initialPosition);

    return newPosition;
  }
}