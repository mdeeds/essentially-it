import * as THREE from "three";
import { Tool } from "./tool";

export class EraseTool implements Tool {
  constructor(private ctx: CanvasRenderingContext2D) { }

  private lastX = null;
  private lastY = null;

  start(xy: THREE.Vector2) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.lineWidth = 75;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.beginPath();
    this.ctx.arc(xy.x, xy.y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
    this.ctx.restore();
  }

  move(xy: THREE.Vector2) {
    if (this.lastX === null) {
      return;
    }
    this.ctx.save();
    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.lineWidth = 75;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.restore();
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
      new THREE.BoxBufferGeometry(0.12, 0.03, 0.05),
      new THREE.MeshStandardMaterial({ color: '#333' }));
    return this.icon;
  }

}