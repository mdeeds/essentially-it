import * as THREE from "three";
import { Tool } from "./tool";

export class HighlighterTool implements Tool {
  private strokeStyle: string = null;
  constructor(private ctx: CanvasRenderingContext2D,
    readonly color: string) { }

  private lastX = null;
  private lastY = null;

  start(xy: THREE.Vector2) {
    this.lastX = xy.x;
    this.lastY = xy.y;
  }

  move(xy: THREE.Vector2) {
    if (this.lastX === null) {
      return;
    }
    this.ctx.save();
    this.ctx.globalCompositeOperation = "darken";
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 65;
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
      new THREE.CylinderBufferGeometry(0.02, 0.02, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: this.color }));
    this.icon.rotateZ(Math.PI / 2);
    return this.icon;
  }
}