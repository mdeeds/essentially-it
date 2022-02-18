import * as THREE from "three";

export class ProjectionCylinder {
  constructor(private reference: THREE.Object3D, private radius: number) {
  }

  private o = new THREE.Vector3();
  private p = new THREE.Vector3();
  private intersectRayOnCylinder(ray: THREE.Ray): THREE.Vector2 {
    // (d, y) + tl = (r, h)
    // d + tl_r = r
    // t = (r - d) / l_r
    this.o.copy(ray.origin);
    this.reference.worldToLocal(this.o);
    const d = ray.direction;

    const a = d.x * d.x + d.z * d.z;
    const b = 2 * (this.o.x * d.x + this.o.z * d.z);
    const c = this.o.x * this.o.x + this.o.z * this.o.z -
      this.radius * this.radius;

    const determinant = b * b - 4 * a * c;
    if (determinant < 0) {
      return null;
    }

    const t = (-b + Math.sqrt(determinant)) / (2 * a);
    this.p.copy(ray.direction);
    this.p.multiplyScalar(t);
    this.p.add(this.o);
    const theta = Math.atan2(this.p.x, -this.p.z);
    const rho = Math.atan2(this.p.y, this.radius);
    return new THREE.Vector2(theta, rho);
  }

  // Returns posiiton in UV space (between -1 and 1)
  getUV(ray: THREE.Ray): THREE.Vector2 {
    const polar = this.intersectRayOnCylinder(ray);
    if (polar) {
      const x = polar.x / Math.PI;
      const y = -polar.y / Math.PI;
      return new THREE.Vector2(x, y);
    } else {
      return null;
    }
  }

}