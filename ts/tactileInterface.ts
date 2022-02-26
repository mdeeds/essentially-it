import * as THREE from "three";
import { PaintCylinder } from "./paintCylinder";
import { ProjectionCylinder } from "./projectionCylinder";
import { S } from "./settings";
import { Tool } from "./tool";
import { ToolBelt } from "./toolBelt";

export class TactileInterface {
  private activeHands = new Map<number, THREE.Vector2>();
  private handTool = new Map<number, Tool>();

  private toolBelt: ToolBelt = null;

  constructor(private paint: PaintCylinder,
    private projection: ProjectionCylinder) {

    this.toolBelt = new ToolBelt(paint.getContext());
    this.paint.add(this.toolBelt);

    this.handTool.set(0, this.toolBelt.getTool(0));
    this.handTool.set(1, this.toolBelt.getTool(1));
  }


  public start(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    if (!uv) {
      return;
    }
    const nextTool = this.toolBelt.selectTool(ray);
    if (nextTool !== null) {
      this.handTool.set(handIndex, nextTool);
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
    lastUV.lerp(uv, S.float('s'));
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