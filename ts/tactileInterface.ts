import * as THREE from "three";
import { EraseTool } from "./eraseTool";
import { PaintCylinder } from "./paintCylinder";
import { PenTool } from "./penTool";
import { ProjectionCylinder } from "./projectionCylinder";
import { S } from "./settings";
import { Tool } from "./tool";

export class TactileInterface {
  private activeHands = new Map<number, THREE.Vector2>();
  private handTool = new Map<number, Tool>();

  private toolBelt: Tool[] = [];

  constructor(private paint: PaintCylinder,
    private projection: ProjectionCylinder) {
    this.toolBelt.push(new EraseTool(paint.getContext()));
    this.toolBelt.push(new PenTool(paint.getContext(), 'black'));
    this.toolBelt.push(new PenTool(paint.getContext(), 'turquoise'));
    this.toolBelt.push(new PenTool(paint.getContext(), 'purple'));

    this.handTool.set(0, this.toolBelt[0]);
    this.handTool.set(1, this.toolBelt[1]);

    let theta = 0;
    for (const t of this.toolBelt) {
      const o = t.getIconObject();
      o.position.set(Math.sin(theta) * 1.45,
        -1.15,
        -Math.cos(theta) * 1.45);
      o.rotateY(-theta);
      theta += 0.12
      this.paint.add(o);
    }
  }

  private p = new THREE.Vector3();
  private c = new THREE.Vector3();
  private maybeChangeTool(ray: THREE.Ray, handIndex: number): boolean {
    let tool: Tool = null;
    let closest = 0.1;
    for (const t of this.toolBelt) {
      const o = t.getIconObject();
      o.getWorldPosition(this.p);
      ray.closestPointToPoint(this.p, this.c);
      this.c.sub(this.p);
      const closestDistance = this.c.length();
      if (closestDistance < closest) {
        closest = closestDistance;
        tool = t;
      }
    }
    if (tool !== null) {
      this.handTool.set(handIndex, tool);
    }
    return (tool !== null);
  }


  public start(ray: THREE.Ray, handIndex: number) {
    const uv = this.projection.getUV(ray);
    if (!uv) {
      return;
    }
    if (this.maybeChangeTool(ray, handIndex)) {
      console.log(`Tool change!`);
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