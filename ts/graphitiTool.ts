import * as THREE from "three";

import { Graphiti, Stroke } from "./graphiti";
import { Tool } from "./tool";

export class GraphitiTool implements Tool {
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement = null;
  private stroke = new Stroke();
  private graphiti = new Graphiti();
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
  }

  private lastXY = new THREE.Vector2();
  start(xy: THREE.Vector2) {
    this.lastXY.copy(xy);
  }

  private d = new THREE.Vector2();
  move(xy: THREE.Vector2) {
    this.d.x = xy.x - this.lastXY.x;
    this.d.y = this.lastXY.y - xy.y;
    this.stroke.add(this.d);

    if (this.lastXY === null) {
      return;
    }
    this.ctx.strokeStyle = 'black';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastXY.x, this.lastXY.y);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.lastXY.copy(xy);
  }

  end() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.stroke = this.stroke.reduce();
    console.log(this.graphiti.recognize(this.stroke));
    this.stroke.logAsClock();
    this.stroke.clear();
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = new THREE.Mesh(
      new THREE.OctahedronBufferGeometry(0.1),
      new THREE.MeshStandardMaterial({ color: '#20f' }));
    return this.icon;
  }

}