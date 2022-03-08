import * as THREE from "three";

import { Graphiti, Stroke } from "./graphiti";
import { Tool } from "./tool";

export class GraphitiTool implements Tool {
  private ctx: CanvasRenderingContext2D;
  private stroke = new Stroke();
  private graphiti = new Graphiti();
  private location: THREE.Vector2 = null;
  private message = "";
  private height = 64;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    {
      const fontLoader = new FontFace(
        'SedgwickAve', 'url(SedgwickAve-Regular.ttf)');
      fontLoader.load().then(function (font) {
        document.fonts.add(font);
        console.log(`Font loaded: ${font.style} ${font.family}`);
      });
    }
    {
      const fontLoader = new FontFace(
        'Long Cang', 'url("LongCang-Regular.ttf")');
      fontLoader.load().then(function (font) {
        document.fonts.add(font);
        console.log(`Font loaded: ${font.style} ${font.family}`);
        for (const f of document.fonts) {
          console.log(`Ready: ${f.family}`);
        }
      });
    }
  }

  private firstCharacter = true;
  private lastXY = new THREE.Vector2();
  private minX = Infinity;
  private minY = Infinity;
  private maxY = -Infinity;

  private resetMinMax() {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxY = -Infinity;
  }

  private updateMinMax(xy: THREE.Vector2) {
    this.minX = Math.min(xy.x, this.minX);
    this.minY = Math.min(xy.y, this.minY);
    this.maxY = Math.max(xy.y, this.maxY);
  }

  start(xy: THREE.Vector2) {
    this.stroke.clear();
    this.lastXY.copy(xy);
    if (this.location === null) {
      this.location = new THREE.Vector2(xy.x, xy.y);
      this.firstCharacter = true;
      this.resetMinMax();
    }
  }

  private d = new THREE.Vector2();
  move(xy: THREE.Vector2) {
    if (this.firstCharacter) {
      this.updateMinMax(xy);
    }
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
    console.log('Clear (graphiti)');
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.stroke.getPixelLength() < 32) {
      this.location = null;
      this.stroke.clear();
      this.message = "";
      return;
    }
    console.log(`${this.stroke.d.length} = ${this.stroke.getPixelLength()}`);
    // TODO: pixel length > 256 = Move
    const glyph = this.graphiti.recognize(this.stroke);
    if (!!glyph) {
      switch (glyph) {
        case "backspace": this.message = this.message.slice(0, -1); break;
        case "done": break;
          break;
        default: this.message = this.message + glyph; break;
      }
    }
    if (this.firstCharacter) {
      this.height = this.maxY - this.minY;
      this.location.x = this.minX;
      this.location.y = this.minY;
      this.firstCharacter = false;
    }
    const fontStyle = `${this.height.toFixed(0)}px "Long Cang"`;
    this.ctx.font = fontStyle;
    this.ctx.fillStyle = "black";
    this.ctx.fillText(this.message, this.location.x, this.location.y);
    // this.stroke.reduce().logAsClock();
    this.stroke.clear();
    if (glyph === "done") {
      this.message = "";
      this.location.y += this.height;
      return true;
    } else {
      return false;
    }
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