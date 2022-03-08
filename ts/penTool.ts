import * as THREE from "three";
import { S } from "./settings";
import { Tool } from "./tool";

export class PenTool implements Tool {
  constructor(private ctx: CanvasRenderingContext2D,
    readonly color: string) { }

  private lastXY: THREE.Vector2 = null;
  private kInitialWidth = S.float('pi');
  private kTargetWidth = S.float('pf');
  private kBlend = 0.1;

  start(xy: THREE.Vector2) {
    this.ctx.lineWidth = this.kInitialWidth;
    this.lastXY = new THREE.Vector2();
    this.lastXY.copy(xy);
  }

  move(xy: THREE.Vector2) {
    if (this.lastXY === null) {
      return;
    }
    this.ctx.strokeStyle = this.color;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth =
      this.ctx.lineWidth * (1 - this.kBlend) + this.kBlend * this.kTargetWidth;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastXY.x, this.lastXY.y);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastXY.copy(xy);
  }

  end() {
    this.lastXY = null;
    return true;
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