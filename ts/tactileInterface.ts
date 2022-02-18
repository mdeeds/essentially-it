import * as THREE from "three";
import { PaintCylinder } from "./paintCylinder";
import { ProjectionCylinder } from "./projectionCylinder";

export interface Tool {

}

export class TactileInterface {
  private matrix = new THREE.Matrix3();
  private activeHands = new Map<number, THREE.Vector2>();

  constructor(private paint: PaintCylinder,
    private projection: ProjectionCylinder) {
    this.matrix.identity();
  }

  public start(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    this.activeHands.set(handIndex, uv);
    if (this.activeHands.size > 1) {
      // TODO: Cancel / undo last action
      this.paint.paintUp(uv);
    } else {
      this.paint.paintDown(uv);
    }
  }

  public move(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    const lastUV = this.activeHands.get(handIndex);
    lastUV.lerp(uv, 0.25);
    if (this.activeHands.size > 1) {
      // TODO: Zoom
    } else {
      this.paint.paintMove(lastUV);
    }
  }

  public end(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    const lastUV = this.activeHands.get(handIndex);
    lastUV.lerp(uv, 0.2);
    if (this.activeHands.size == 1) {
      this.paint.paintUp(uv);
    }
    this.activeHands.delete(handIndex);
  }

  public takeMatrix(): THREE.Matrix3 {
    const result = this.matrix;
    this.matrix = new THREE.Matrix3();
    this.matrix.identity();
    return result;
  }
}