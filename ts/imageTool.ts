import * as THREE from "three";
import { Tool } from "./tool";

export class ImageTool implements Tool {
  private ctx: CanvasRenderingContext2D;
  private image: HTMLImageElement = null;
  constructor(private canvas: HTMLCanvasElement, url: string) {
    this.ctx = canvas.getContext('2d');
    this.loadImage(url);
  }

  private moveOrStart(xy: THREE.Vector2) {
    if (this.image) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.image,
        xy.x - this.image.width / 2, xy.y - this.image.height / 2);
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
    }, false);
    img.src = url;
  }
}