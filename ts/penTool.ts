import * as THREE from "three";

export class PenTool {
  constructor(private ctx: CanvasRenderingContext2D,
    readonly color: string) { }

  private lastX = 0;
  private lastY = 0;

  paintDown(xy: THREE.Vector2) {
    this.ctx.strokeStyle = this.color;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.beginPath();
    this.ctx.arc(xy.x, xy.y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
  }

  paintMove(xy: THREE.Vector2) {
    if (this.lastX === null) {
      return;
    }
    this.ctx.strokeStyle = this.color;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastX = xy.x;
    this.lastY = xy.y;
  }

  paintEnd() {
    this.lastX = null;
    this.lastY = null;
  }
}