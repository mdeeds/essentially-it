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
    if (!uv) {
      return;
    }
    this.activeHands.set(handIndex, uv);
    if (this.activeHands.size > 1) {
      // TODO: Cancel / undo last action
      this.paint.paintUp(uv);
      this.paint.zoomStart(this.activeHands.get(0), this.activeHands.get(1));
    } else {
      this.paint.paintDown(uv);
    }
  }

  public move(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    if (!uv) {
      return;
    }
    const lastUV = this.activeHands.get(handIndex) ?? uv;
    lastUV.lerp(uv, 0.2);
    if (this.activeHands.size > 1) {
      this.paint.zoomUpdate(this.activeHands.get(0), this.activeHands.get(1));
    } else {
      this.paint.paintMove(lastUV);
    }
    this.activeHands.set(handIndex, lastUV);
  }

  public end(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    if (!uv) {
      return;
    }
    const lastUV = this.activeHands.get(handIndex) ?? uv;
    lastUV.lerp(uv, 0.2);
    if (this.activeHands.size > 1) {
      this.paint.zoomEnd(this.activeHands.get(0), this.activeHands.get(1));
    } else {
      this.paint.paintUp(uv);
    }
    this.activeHands.delete(handIndex);
  }
}