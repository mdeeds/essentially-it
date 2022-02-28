import * as THREE from "three";

import { EraseTool } from "./eraseTool";
import { HighlighterTool } from "./highlighterTool";
import { ImageTool } from "./imageTool";
import { PenTool } from "./penTool";
import { ShaderSphereTool1, ShaderSphereTool2, SphereTool, StandardSphereTool } from "./sphereTool";
import { Tool } from "./tool";

export class ToolBelt extends THREE.Group {
  private tools: Tool[] = [];

  constructor(tmpCanvas: HTMLCanvasElement,
    imgCanvas: HTMLCanvasElement,
    scene: THREE.Object3D) {
    super();
    const ctx = tmpCanvas.getContext('2d');
    this.tools.push(new EraseTool(ctx));
    this.tools.push(new PenTool(ctx, 'black'));
    this.tools.push(new PenTool(ctx, 'turquoise'));
    this.tools.push(new PenTool(ctx, 'purple'));
    this.tools.push(new HighlighterTool(ctx, 'mediumpurple'));
    this.tools.push(new StandardSphereTool(scene, false));
    this.tools.push(new StandardSphereTool(scene, true));
    this.tools.push(new ShaderSphereTool1(scene));
    this.tools.push(new ShaderSphereTool2(scene));
    this.tools.push(new ImageTool(imgCanvas, 'ep/1/Basic Shading.png'))

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