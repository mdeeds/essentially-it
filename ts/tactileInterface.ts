import * as THREE from "three";
import { PaintCylinder } from "./paintCylinder";
import { ProjectionCylinder } from "./projectionCylinder";

export interface Tool {

}

export class TactileInterface {
  private activeHands = new Map<number, THREE.Vector2>();

  constructor(private paint: PaintCylinder,
    private projection: ProjectionCylinder) {
  }

  public start(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    if (!uv) {
      return;
    }
    const flipped = new THREE.Vector2(uv.x, uv.y);
    this.activeHands.set(handIndex, flipped);
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
    const flipped = new THREE.Vector2(lastUV.x, lastUV.y);
    this.activeHands.set(handIndex, flipped);
  }

  public end(handIndex: number) {
    if (this.activeHands.size > 1) {
      this.paint.zoomEnd(this.activeHands.get(0), this.activeHands.get(1));
    }
    this.activeHands.delete(handIndex);
  }
}