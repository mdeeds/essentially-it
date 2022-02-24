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

    const ll1 = new THREE.Vector2(l1.x, l1.y);
    const ll2 = new THREE.Vector2(l2.x, l2.y);
    const rr1 = new THREE.Vector2(r1.x, r1.y);
    const rr2 = new THREE.Vector2(r2.x, r2.y);

    const p1 = Zoom.makePerpendicular(ll1, rr1);
    const p2 = Zoom.makePerpendicular(ll2, rr2);

    const initialPosition = new THREE.Matrix3();
    initialPosition.set(
      ll1.x, rr1.x, p1.x,
      ll1.y, rr1.y, p1.y,
      1, 1, 1);

    const newPosition = new THREE.Matrix3();
    newPosition.set(
      ll2.x, rr2.x, p2.x,
      ll2.y, rr2.y, p2.y,
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