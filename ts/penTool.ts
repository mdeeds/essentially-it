import * as THREE from "three";
import { Tool } from "./tool";

export class PenTool implements Tool {
  constructor(private ctx: CanvasRenderingContext2D,
    readonly color: string) { }

  private lastX = null;
  private lastY = null;
  private kInitialWidth = 35;
  private kTargetWidth = 25;
  private kBlend = 0.1;

  start(xy: THREE.Vector2) {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.kInitialWidth;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.beginPath();
    this.ctx.arc(xy.x, xy.y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
  }

  move(xy: THREE.Vector2) {
    if (this.lastX === null) {
      return;
    }
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth =
      this.ctx.lineWidth * (1 - this.kBlend) + this.kBlend * this.kTargetWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastX = xy.x;
    this.lastY = xy.y;
  }

  end() {
    this.lastX = null;
    this.lastY = null;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.02, 0.02, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: this.color }));
    this.icon.rotateZ(Math.PI / 2);
    return this.icon;
  }
}