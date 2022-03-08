import * as THREE from "three";
import { Tool } from "./tool";

export class ImageTool implements Tool {
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement = null;
  private height: number;
  private width: number;
  constructor(private canvas: HTMLCanvasElement, url: string,
    private scale: number) {
    canvas.style.setProperty('image-rendering', 'optimizeSpeed');
    canvas.style.setProperty('image-rendering', 'crisp-edges');
    canvas.style.setProperty('image-rendering', '-moz-crisp-edges');
    canvas.style.setProperty('image-rendering', '-o-crisp-edges');
    canvas.style.setProperty('image-rendering', '-webkit-optimize-contrast');
    canvas.style.setProperty('-ms-interpolation-mode', 'nearest-neighbor');
    this.ctx = canvas.getContext('2d');
    this.loadImage(url);
  }

  private moveOrStart(xy: THREE.Vector2) {
    if (this.image) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image,
        Math.round(xy.x - this.width / 2),
        Math.round(xy.y - this.height / 2),
        this.width, this.height);
    }
  }

  start(xy: THREE.Vector2) {
    this.moveOrStart(xy);
  }

  move(xy: THREE.Vector2) {
    this.moveOrStart(xy);
  }

  end() {
    return true;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.15, 0.15),
      new THREE.MeshStandardMaterial({ color: '#0ff' }));
    return this.icon;
  }

  private loadImage(url: string) {
    const img = new Image();
    img.addEventListener('load', () => {
      this.image = img;
      this.height = this.image.height * this.scale;
      this.width = this.image.width * this.scale;
    }, false);
    img.src = url;
  }
}