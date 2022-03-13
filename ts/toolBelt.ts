import * as THREE from "three";

import { EraseTool } from "./eraseTool";
import { GraphitiTool } from "./graphitiTool";
import { HighlighterTool } from "./highlighterTool";
import { ImageTool } from "./imageTool";
import { PenTool } from "./penTool";
import { PlayTool } from "./playTool";
import { S } from "./settings";
import { SpectrogramTool } from "./spectrogramTool";
import { SpeechTool } from "./speechTool";
import { ShaderSphereTool1, ShaderSphereTool2, SphereTool, StandardSphereTool } from "./sphereTool";
import { Tool } from "./tool";

export class ToolBelt extends THREE.Group {
  private tools: Tool[] = [];

  constructor(tmpCanvas: HTMLCanvasElement,
    imgCanvas: HTMLCanvasElement,
    scene: THREE.Object3D,
    audioCtx: AudioContext) {
    super();
    this.addTools(tmpCanvas, imgCanvas, scene, audioCtx);
    if (window['webkitSpeechRecognition']) {
      this.tools.push(new SpeechTool(imgCanvas));
    }
    this.tools.push(new GraphitiTool(imgCanvas));

    const thetaStep = 0.12;
    let theta = thetaStep * -0.5 * (this.tools.length - 1);
    for (const t of this.tools) {
      const o = t.getIconObject();
      o.position.set(Math.sin(theta) * 1.45,
        -1.15,
        -Math.cos(theta) * 1.45);
      o.rotateY(-theta);
      theta += thetaStep;
      this.add(o);
    }
  }

  private addTools(tmpCanvas: HTMLCanvasElement,
    imgCanvas: HTMLCanvasElement,
    scene: THREE.Object3D,
    audioCtx: AudioContext) {
    const ctx = tmpCanvas.getContext('2d');
    this.tools.push(new EraseTool(ctx));
    this.tools.push(new PenTool(ctx, 'black'));
    this.tools.push(new PenTool(ctx, 'turquoise'));
    this.tools.push(new PenTool(ctx, 'purple'));
    this.tools.push(new HighlighterTool(ctx, 'mediumpurple'));
    switch (S.float('ep')) {
      case 1:
        this.tools.push(new PlayTool("ep/1/Essentially_It.mp3"));
        this.tools.push(new StandardSphereTool(scene, false));
        this.tools.push(new StandardSphereTool(scene, true));
        this.tools.push(new ShaderSphereTool1(scene));
        this.tools.push(new ShaderSphereTool2(scene));
        this.tools.push(new ImageTool(
          imgCanvas, 'ep/1/Basic Shading.png', 2.0));
        this.tools.push(new ImageTool(
          imgCanvas, 'ep/1/Normal Shading.png', 2.0));
        break;
      case 2:
        this.tools.push(new SpectrogramTool(scene, audioCtx));
        break;
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