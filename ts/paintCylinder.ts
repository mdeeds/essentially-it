import * as THREE from "three";
import { Zoom } from "./zoom";

class Polar {
  constructor(readonly theta: number, readonly rho: number) { }
}

export class PaintCylinder extends THREE.Object3D {
  private mesh: THREE.Mesh;
  private canvasTexture: THREE.CanvasTexture;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private radius: number;
  // private panelMaterial: THREE.MeshStandardMaterial = null;
  constructor() {
    super();
    this.radius = 1.5;
    const circumfrence = 2 * Math.PI * this.radius;
    const height = circumfrence / 4;

    this.mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(
        /*top=*/this.radius, /*bottom=*/this.radius,
        /*height=*/height,
        /*radial=*/32, /*vertical=*/8,
        /*open=*/true),
      this.getMaterial());
    this.mesh.position.set(0, 0, 0);

    this.add(this.mesh);
  }



  private getXY(uv: THREE.Vector2): THREE.Vector2 {
    return new THREE.Vector2(
      this.canvas.width * (uv.x / 2 + 0.5),
      this.canvas.height * (uv.y * 2 + 0.5));
  }

  private zoom(left1: THREE.Vector2, right1: THREE.Vector2,
    left2: THREE.Vector2, right2: THREE.Vector2) {
    const l1 = this.getXY(left1);
    const r1 = this.getXY(right1);
    const l2 = this.getXY(left2);
    const r2 = this.getXY(right2);
    return Zoom.makeZoomMatrix(l1, r1, l2, r2);
  }

  private lastX = 0;
  private lastY = 0;

  paintDown(uv: THREE.Vector2) {
    const xy = this.getXY(uv);
    if (!xy) return;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.ctx.beginPath();
    this.ctx.arc(xy.x, xy.y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
    this.canvasTexture.needsUpdate = true;
  }

  paintMove(uv: THREE.Vector2) {
    const xy = this.getXY(uv);
    if (!xy) return;
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(xy.x, xy.y);
    this.ctx.stroke();
    this.canvasTexture.needsUpdate = true;
    this.lastX = xy.x;
    this.lastY = xy.y;
    this.canvasTexture.needsUpdate = true;
  }

  paintUp(uv: THREE.Vector2) {
  }

  private getMaterial(): THREE.Material {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 4096;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');

    this.ctx.fillStyle = '#9af4';
    for (let x = 0; x < this.canvas.width; x += 64) {
      for (let y = 0; y < this.canvas.height; y += 64) {
        this.ctx.fillRect(x - 1, y - 3, 3, 7);
        this.ctx.fillRect(x - 3, y - 1, 7, 3);
      }
    }
    this.ctx.strokeStyle = '#9af';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0.5, 0.5);
    this.ctx.lineTo(this.canvas.width - 0.5, 0.5);
    this.ctx.lineTo(this.canvas.width - 0.5, this.canvas.height - 0.5);
    this.ctx.lineTo(0.5, this.canvas.height - 0.5);
    this.ctx.lineTo(0.5, 0.5);
    this.ctx.stroke();

    this.ctx.fillStyle = '#000';
    this.ctx.strokeStyle = '#000';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 10;

    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.canvasTexture.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        panelTexture: {
          value: this.canvasTexture,
        },
        zoomCenter: {
          value: new THREE.Vector2(0, 0),
        },
        zoomAmount: {
          value: 1.0,
        }
      },
      vertexShader: `
varying vec2 v_uv;
uniform vec2 zoomCenter;
uniform float zoomAmount;
void main() {
  float r = length(position.xz);
  float u = (atan(position.x, -position.z) / 3.14 / 2.0) + 0.5;
  float v = (atan(position.y, r) / 3.14 * 2.0) + 0.5;
  u = (u - zoomCenter.x) / zoomAmount + zoomCenter.x;
  v = (v - zoomCenter.y) / zoomAmount + zoomCenter.y;

  gl_Position = projectionMatrix * modelViewMatrix * 
    vec4(position, 1.0);
  v_uv = vec2(u, v);
}`,
      fragmentShader: `
varying vec2 v_uv;
uniform sampler2D panelTexture;
void main() {
  // gl_FragColor = vec4(v_uv.x, v_uv.y, 0.5, 0.4);
  gl_FragColor = texture2D(panelTexture, v_uv);
}`
    });

    this.canvasTexture.needsUpdate = true;

    return material;

  }
}