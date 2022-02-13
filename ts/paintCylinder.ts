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
    // this.panelMaterial = new THREE.MeshStandardMaterial(
    //   { color: '#8f8', emissive: 1.0, side: THREE.BackSide });

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
    this.getWorldPosition(this.o);
    this.o.multiplyScalar(-1);
    this.o.add(ray.origin);

    const d = Math.sqrt(this.o.x * this.o.x + this.o.z * this.o.z);
    const l_r = Math.sqrt(ray.direction.x * ray.direction.x +
      ray.direction.z * ray.direction.z);
    const t = (this.radius - d) / l_r;
    this.p.copy(ray.direction);
    this.p.multiplyScalar(t);
    const theta = Math.atan2(this.p.x, -this.p.z);
    const rho = Math.atan2(this.p.y, this.radius);
    return new Polar(theta, rho);
  }

  private getXY(ray: THREE.Ray): number[] {
    const polar = this.intersectRayOnCylinder(ray);
    const x = this.canvas.width * (polar.theta / 2 / Math.PI + 0.5);
    const y = this.canvas.height * (-polar.rho * 2 / Math.PI + 0.5);
    return [x, y];
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
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 10;
    for (let i = 0; i < 100; ++i) {
      this.ctx.fillText('Hello, World!',
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height);
    }
    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.canvasTexture.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        panelTexture: {
          value: this.canvasTexture,
        },
      },
      vertexShader: `
varying vec2 v_uv;
void main() {
  float r = length(position.xz);
  float u = (atan(position.x, -position.z) / 3.14 / 2.0) + 0.5;
  float v = (atan(position.y, r) / 3.14 * 2.0) + 0.5;
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

  // setUpTexture1() {
  //   const loader = new THREE.ImageLoader();
  //   loader.load('img/panel.png', (image) => {
  //     const canvas = document.createElement('canvas');
  //     canvas.width = 4096;
  //     canvas.height = 1024;
  //     const ctx = canvas.getContext('2d');
  //     ctx.drawImage(image, 0, 0);
  //     this.canvasTexture = new THREE.CanvasTexture(canvas);
  //     this.canvasTexture.needsUpdate = true;
  //     this.panelMaterial.map = this.canvasTexture;
  //     this.panelMaterial.color = null; // new THREE.Color('white');
  //     this.panelMaterial.needsUpdate = true;
  //   });
  // }
}