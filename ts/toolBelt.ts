import * as THREE from "three";
import { AudioHelper } from "./audioHelper";

import { EraseTool } from "./eraseTool";
import { GraphitiTool } from "./graphitiTool";
import { HighlighterTool } from "./highlighterTool";
import { ImageTool } from "./imageTool";
import { Motion } from "./motion";
import { PenTool } from "./penTool";
import { PlayTool } from "./playTool";
import { S } from "./settings";
import { SpectrogramTool } from "./spectrogramTool";
import { SpeechTool } from "./speechTool";
import { ShaderSphereTool1, ShaderSphereTool2, StandardSphereTool, ShaderSphereTool3, ShaderSphereTool4, LineSphereTool, StringSphere } from "./sphereTool";
import { SawtoothToneTool, SineToneTool, SquareToneTool, TriangleToneTool } from "./toneTool";
import { Tool } from "./tool";

export class ToolBelt extends THREE.Group {
  private tools: Tool[] = [];

  constructor(tmpCanvas: HTMLCanvasElement,
    imgCanvas: HTMLCanvasElement,
    scene: THREE.Object3D,
    audioCtx: AudioContext,
    motions: Motion[]) {
    super();
    this.name = 'Tool Belt';
    this.addTools(tmpCanvas, imgCanvas, scene, audioCtx, motions);
  }

  private async addTools(tmpCanvas: HTMLCanvasElement,
    imgCanvas: HTMLCanvasElement,
    scene: THREE.Object3D, audioCtx: AudioContext,
    motions: Motion[]) {
    const ctx = tmpCanvas.getContext('2d');
    this.tools.push(new EraseTool(ctx));
    this.tools.push(new PenTool(ctx, 'black'));
    this.tools.push(new PenTool(ctx, 'turquoise'));
    this.tools.push(new PenTool(ctx, 'purple'));
    this.tools.push(new HighlighterTool(ctx, 'mediumpurple'));

    const mix = audioCtx.createGain();
    mix.gain.setValueAtTime(1.0, audioCtx.currentTime);

    const microphone = await AudioHelper.getMicrophoneSource(audioCtx);
    microphone.connect(mix);

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
        this.tools.push(new SpectrogramTool(scene, audioCtx, mix));
        this.tools.push(new ImageTool(
          imgCanvas, 'ep/2/code.png', 2.0));
        break;
      case 3:
        this.tools.push(new SpectrogramTool(scene, audioCtx, mix));
        this.tools.push(new SineToneTool(scene, audioCtx, mix));
        this.tools.push(new SquareToneTool(scene, audioCtx, mix));
        this.tools.push(new TriangleToneTool(scene, audioCtx, mix));
        this.tools.push(new SawtoothToneTool(scene, audioCtx, mix));
        break;
      case 4:
        this.tools.push(new ShaderSphereTool3(scene));
        this.tools.push(new ShaderSphereTool4(scene));
        this.tools.push(new LineSphereTool(scene));
        this.tools.push(new ImageTool(
          imgCanvas, 'ep/4/SelectionCode1.png', 2.0));
        this.tools.push(new ImageTool(
          imgCanvas, 'ep/4/SelectionCode2.png', 2.0));
        break;
    }
    if (window['webkitSpeechRecognition']) {
      this.tools.push(new SpeechTool(imgCanvas));
    }
    this.tools.push(new GraphitiTool(imgCanvas));
    this.addIcons();
  }

  private addIcons() {
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