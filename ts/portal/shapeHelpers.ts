import * as THREE from 'three';
import Ammo from "ammojs-typed";


export interface ShapeFactory {
  getBtShape(radius: number): Ammo.btCollisionShape;
  getThreeShape(radius: number, color: THREE.Color): THREE.Object3D;
}

export class CompoundShape implements ShapeFactory {
  private group = new THREE.Group();
  private compound: Ammo.btCompoundShape;
  constructor(private ammo: typeof Ammo) {
    this.compound = new ammo.btCompoundShape();
  }

  add(position: THREE.Vector3, shape: ShapeFactory,
    radius: number, color: THREE.Color) {
    const noRotation = new this.ammo.btQuaternion(0, 0, 0, 1);
    const basePosition = new this.ammo.btVector3(
      position.x, position.y, position.z);
    const baseTx = new this.ammo.btTransform(noRotation, basePosition);
    this.compound.addChildShape(baseTx, shape.getBtShape(radius));
    const obj = shape.getThreeShape(radius, color);
    obj.position.copy(position);
    this.group.add(obj);
  }

  getThreeShape() { return this.group; }
  getBtShape() { return this.compound; }
}

export class BoxShape implements ShapeFactory {
  private threeShape: THREE.Mesh;
  private btShape: Ammo.btCollisionShape;
  constructor(ammo: typeof Ammo, width: number, height: number, depth: number,
    material: THREE.Material) {
    this.threeShape = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth), material);
    this.btShape = new ammo.btBoxShape(
      new ammo.btVector3(width / 2, height / 2, depth / 2));
  }
  getThreeShape() { return this.threeShape; }
  getBtShape() { return this.btShape; }
}