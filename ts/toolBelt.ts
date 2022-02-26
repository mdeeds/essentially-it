import * as THREE from "three";

import { EraseTool } from "./eraseTool";
import { PenTool } from "./penTool";
import { Tool } from "./tool";

export class ToolBelt extends THREE.Group {
  private tools: Tool[] = [];

  constructor(private ctx: CanvasRenderingContext2D) {
    super();
    this.tools.push(new EraseTool(ctx));
    this.tools.push(new PenTool(ctx, 'black'));
    this.tools.push(new PenTool(ctx, 'turquoise'));
    this.tools.push(new PenTool(ctx, 'purple'));

    let theta = 0;
    for (const t of this.tools) {
      const o = t.getIconObject();
      o.position.set(Math.sin(theta) * 1.45,
        -1.15,
        -Math.cos(theta) * 1.45);
      o.rotateY(-theta);
      theta += 0.12
      this.add(o);
    }
  }

  getTool(index: number): Tool {
    return this.tools[index];
  }

  private p = new THREE.Vector3();
  private c = new THREE.Vector3();
  public selectTool(ray: THREE.Ray): Tool {
    let tool: Tool = null;
    let closest = 0.1;
    for (const t of this.tools) {
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
    return tool;
  }

}