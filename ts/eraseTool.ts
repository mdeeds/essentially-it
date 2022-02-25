import * as THREE from "three";
import { Tool } from "./tool";

export class EraseTool implements Tool {
  constructor(private ctx: CanvasRenderingContext2D) { }

  private lastX = 0;
  private lastY = 0;

  paintDown(xy: THREE.Vector2) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.lineWidth = 35;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.beginPath();
    this.ctx.arc(xy.x, xy.y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
    this.ctx.restore();
  }

  paintMove(xy: THREE.Vector2) {
    if (this.lastX === null) {
      return;
    }
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.lineWidth = 35;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.restore();
  }

  paintEnd() {
    this.lastX = null;
    this.lastY = null;
  }
}