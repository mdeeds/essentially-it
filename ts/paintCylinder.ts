import * as THREE from "three";

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

  private o = new THREE.Vector3();
  private p = new THREE.Vector3();
  private intersectRayOnCylinder(ray: THREE.Ray): Polar {
    // (d, y) + tl = (r, h)
    // d + tl_r = r
    // t = (r - d) / l_r
    this.o.copy(ray.origin);
    this.worldToLocal(this.o);
    const d = ray.direction;

    const a = d.x * d.x + d.z * d.z;
    const b = 2 * (this.o.x * d.x + this.o.z * d.z);
    const c = this.o.x * this.o.x + this.o.z * this.o.z -
      this.radius * this.radius;

    const determinant = b * b - 4 * a * c;
    if (determinant < 0) {
      return null;
    }

    const t = (-b + Math.sqrt(determinant)) / (2 * a);
    this.p.copy(ray.direction);
    this.p.multiplyScalar(t);
    this.p.add(this.o);
    const theta = Math.atan2(this.p.x, -this.p.z);
    const rho = Math.atan2(this.p.y, this.radius);
    return new Polar(theta, rho);
  }

  private getXY(ray: THREE.Ray): number[] {
    const polar = this.intersectRayOnCylinder(ray);
    if (polar) {
      const x = this.canvas.width * (polar.theta / 2 / Math.PI + 0.5);
      const y = this.canvas.height * (-polar.rho * 2 / Math.PI + 0.5);
      return [x, y];
    } else {
      return null;
    }
  }

  private zoom(left1: THREE.Ray, right1: THREE.Ray,
    left2: THREE.Ray, right2: THREE.Ray) {
    const l1 = this.getXY(left1);
    const r1 = this.getXY(right1);
    const l2 = this.getXY(left2);
    const r2 = this.getXY(right2);

    if (!l1 || !r1 || !l2 || !r2) {
      return;
    }

    const d1 = [r1[0] - l1[0], r1[1], l1[1]];
    const d2 = [r2[0] - l2[0], r2[1], l2[1]];

    const len1 = Math.sqrt(d1[0] * d1[0] + d1[1] * d1[1]);
    const len2 = Math.sqrt(d2[0] * d2[0] + d2[1] * d2[1]);

    const zoomChange = len2 / len1;
    const center1 = [(l1[0] + r1[0]) / 2, (l1[1] + r1[1]) / 2];
    const center2 = [(l2[0] + r2[0]) / 2, (l2[1] + r2[1]) / 2];
  }

  private lastX = 0;
  private lastY = 0;

  paintDown(ray: THREE.Ray) {
    const [x, y] = this.getXY(ray);
    this.lastX = x;
    this.lastY = y;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 5, -Math.PI, Math.PI);
    this.ctx.fill();
    this.canvasTexture.needsUpdate = true;
  }

  paintMove(ray: THREE.Ray) {
    const [x, y] = this.getXY(ray);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.canvasTexture.needsUpdate = true;
    this.lastX = x;
    this.lastY = y;
    this.canvasTexture.needsUpdate = true;
  }

  paintUp(ray: THREE.Ray) {
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