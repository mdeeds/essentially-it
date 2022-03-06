import * as THREE from "three";

import { Graphiti, Stroke } from "./graphiti";
import { Tool } from "./tool";

export class GraphitiTool implements Tool {
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement = null;
  private stroke = new Stroke();
  private graphiti = new Graphiti();
  private location: THREE.Vector2 = null;
  private message = "";

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');

    {
      const fontLoader = new FontFace('Technical', 'url(technicn.ttf)');
      fontLoader.load().then(function (font) {
        document.fonts.add(font);
        console.log(`Font loaded: ${font.style} ${font.family}`);
      });
    }
  }

  private lastXY = new THREE.Vector2();
  private minX = Infinity;
  private minY = Infinity;
  private maxY = Infinity;

  private updateMinMax(xy: THREE.Vector2) {
    this.minX = Math.min(xy.x, minX);
  }

  start(xy: THREE.Vector2) {
    this.lastXY.copy(xy);
    if (this.location === null) {
      this.location = new THREE.Vector2(xy.x, xy.y);
    }
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
    if (this.stroke.d.length < 8) {
      this.location = null;
      this.stroke.clear();
      this.message = "";
      return;
    }
    this.stroke = this.stroke.reduce();
    const glyph = this.graphiti.recognize(this.stroke);
    if (!!glyph) {
      if (glyph === "backspace") {
        this.message = this.message.slice(0, -1);
      } else {
        this.message = this.message + glyph;
      }
    }
    this.ctx.font = "64px Technical";
    this.ctx.fillStyle = "black";
    this.ctx.fillText(this.message, this.location.x, this.location.y);
    // this.stroke.logAsClock();
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