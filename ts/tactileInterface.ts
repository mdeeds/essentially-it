import * as THREE from "three";
import { PaintCylinder } from "./paintCylinder";
import { PenTool } from "./penTool";
import { ProjectionCylinder } from "./projectionCylinder";

export class TactileInterface {
  private activeHands = new Map<number, THREE.Vector2>();
  private handTool = new Map<number, PenTool>();

  constructor(private paint: PaintCylinder,
    private projection: ProjectionCylinder) {
    this.handTool.set(0, new PenTool(paint.getContext(), 'turquoise'));
    this.handTool.set(0, new PenTool(paint.getContext(), 'purple'));
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
      const xy = this.paint.getXY(uv);
      this.handTool.get(handIndex).paintDown(xy);
      this.paint.setNeedsUpdate();
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
      const xy = this.paint.getXY(uv);
      this.handTool.get(handIndex).paintMove(xy);
      this.paint.setNeedsUpdate();
    }
    this.activeHands.set(handIndex, lastUV);
  }

  public end(handIndex: number) {
    if (this.activeHands.size > 1) {
      this.paint.zoomEnd(this.activeHands.get(0), this.activeHands.get(1));
    } else {
      this.handTool.get(handIndex).paintEnd();
    }
    this.activeHands.delete(handIndex);
  }
}