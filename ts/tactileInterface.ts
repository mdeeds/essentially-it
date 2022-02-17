import * as THREE from "three";
import { PaintCylinder } from "./paintCylinder";

export interface Tool {

}

export class TactileInterface {
  private matrix = new THREE.Matrix3();
  private activeHands = new Set<number>();


  constructor(private paint: PaintCylinder) {
    this.matrix.identity();
  }

  public start(ray: THREE.Ray, handIndex: number) {
    this.activeHands.add(handIndex);
    this.paint.paintDown(ray);
  }

  public move(ray: THREE.Ray, handIndex: number) {
    this.paint.paintMove(ray);
  }

  public end(ray: THREE.Ray, handIndex: number) {
    this.paint.paintUp(ray);
    this.activeHands.delete(handIndex);
  }

  public takeMatrix(): THREE.Matrix3 {
    const result = this.matrix;
    this.matrix = new THREE.Matrix3();
    this.matrix.identity();
    return result;
  }
}