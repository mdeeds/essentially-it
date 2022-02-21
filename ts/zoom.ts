import * as THREE from "three";

export class Zoom {
  public static makePerpendicular(l: THREE.Vector2, r: THREE.Vector2):
    THREE.Vector2 {
    const dx = r.x - l.x;
    const dy = r.y - l.y;
    return new THREE.Vector2(l.x - dy, l.y + dx);
  }

  public static makeZoomMatrix(
    l1: THREE.Vector2, r1: THREE.Vector2,
    l2: THREE.Vector2, r2: THREE.Vector2): THREE.Matrix3 {

    const p1 = Zoom.makePerpendicular(l1, r1);
    const p2 = Zoom.makePerpendicular(l2, r2);

    const initialPosition = new THREE.Matrix3();
    initialPosition.set(
      l1.x, r1.x, p1.x,
      l1.y, r1.y, p1.y,
      1, 1, 1);

    const newPosition = new THREE.Matrix3();
    newPosition.set(
      l2.x, r2.x, p2.x,
      l2.y, r2.y, p2.y,
      1, 1, 1);

    // console.log(initialPosition);
    // console.log(newPosition);

    initialPosition.invert();
    newPosition.multiplyMatrices(newPosition, initialPosition);

    // Remove rotation.
    // this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
    // this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
    // this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;
    // newPosition.elements[1] = 0;
    // newPosition.elements[3] = 0;

    return newPosition;
  }
}