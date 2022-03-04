import * as THREE from "three";
import { CylinderBufferGeometry } from "three";
import { Zoom } from "./zoom";

export class PaintCylinder extends THREE.Group {
  private mesh: THREE.Mesh;
  private gridTexture: THREE.CanvasTexture;
  private tmpTexture: THREE.CanvasTexture;
  private imgTexture: THREE.CanvasTexture;

  private undoCanvas: HTMLCanvasElement;
  private gridCanvas: HTMLCanvasElement;
  private tmpCanvas: HTMLCanvasElement;
  private imgCanvas: HTMLCanvasElement;

  private tmpCtx: CanvasRenderingContext2D;
  private radius: number;
  private material: THREE.ShaderMaterial;

  // private panelMaterial: THREE.MeshStandardMaterial = null;
  constructor() {
    super();
    this.radius = 1.5;
    const circumfrence = 2 * Math.PI * this.radius;
    const height = circumfrence / 4;

    this.material = this.getMaterial();
    this.mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(
        /*top=*/this.radius, /*bottom=*/this.radius,
        /*height=*/height,
        /*radial=*/32, /*vertical=*/8,
        /*open=*/true),
      this.material);
    this.mesh.position.set(0, 0, 0);

    this.add(this.mesh);

    const a = document.createElement('a');
    a.id = 'download';
    a.download = 'infographic.png';
    a.innerText = 'Download Infograpic';
    a.addEventListener('mouseenter', () => { this.updateSaveUrl(); });
    document.body.appendChild(a);

    const b = document.createElement('span');
    b.innerText = 'update';
    b.style.border = '2px outset';
    b.addEventListener('click', () => { this.updateSaveUrl(); });
    document.body.appendChild(b);
  }

  public getTmpCanvas(): HTMLCanvasElement {
    return this.tmpCanvas;
  }
  public getImgCanvas(): HTMLCanvasElement {
    return this.imgCanvas;
  }

  public setNeedsUpdate() {
    this.imgTexture.needsUpdate = true;
    this.tmpTexture.needsUpdate = true;
  }

  paintUp(uv: THREE.Vector2) {
  }

  private startLeftUV = new THREE.Vector2();
  private startRightUV = new THREE.Vector2();
  zoomStart(leftUV: THREE.Vector2, rightUV: THREE.Vector2) {
    const luv = new THREE.Vector2();
    const ruv = new THREE.Vector2();
    luv.copy(leftUV);
    ruv.copy(rightUV);
    luv.applyMatrix3(this.finalizedInverseMatrix);
    ruv.applyMatrix3(this.finalizedInverseMatrix);
    this.startLeftUV.copy(luv);
    this.startRightUV.copy(ruv);
  }

  private finalizedZoomMatrix = new THREE.Matrix3();
  private finalizedInverseMatrix = new THREE.Matrix3();
  private zoomInternal(leftUV: THREE.Vector2, rightUV: THREE.Vector2,
    finalize: boolean) {
    const m = this.material.uniforms['uvMatrix'].value as THREE.Matrix3;
    const luv = new THREE.Vector2();
    const ruv = new THREE.Vector2();
    luv.copy(leftUV);
    ruv.copy(rightUV);
    luv.applyMatrix3(this.finalizedInverseMatrix);
    ruv.applyMatrix3(this.finalizedInverseMatrix);
    m.copy(Zoom.makeZoomMatrix(
      this.startLeftUV, this.startRightUV,
      luv, ruv));
    m.premultiply(this.finalizedZoomMatrix);
    if (finalize) {
      this.finalizedZoomMatrix.copy(m);
      this.finalizedInverseMatrix.copy(m);
      this.finalizedInverseMatrix.invert();
    }
    m.invert();
    this.material.uniformsNeedUpdate = true;
  }


  zoomUpdate(leftUV: THREE.Vector2, rightUV: THREE.Vector2) {
    this.zoomInternal(leftUV, rightUV, false);
  }

  zoomEnd(leftUV: THREE.Vector2, rightUV: THREE.Vector2) {
    this.zoomInternal(leftUV, rightUV, true);

  }

  private setClip(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D) {
    const region = new Path2D();
    // We need a pretty big margin because of the way the sampler
    // works.  When zooming out, it will use a downsampled and smoothed
    // value.
    region.rect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.clip(region);

  }

  private makeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024 * 8;
    canvas.height = 1024 * 2;
    // Prohibit drawing on the last pixel.
    this.setClip(canvas, canvas.getContext('2d'));

    return canvas;
  }

  public commit() {
    const undoCtx = this.undoCanvas.getContext('2d');
    undoCtx.clearRect(0, 0, this.undoCanvas.width, this.undoCanvas.height);
    undoCtx.drawImage(this.tmpCanvas, 0, 0);
    undoCtx.drawImage(this.imgCanvas, 0, 0);
    this.tmpCtx.drawImage(this.imgCanvas, 0, 0);
    this.tmpTexture.needsUpdate = true;
  }

  public cancel() {
    this.tmpCtx.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
    this.tmpCtx.drawImage(this.undoCanvas, 0, 0);
    this.imgCanvas.getContext('2d')
      .clearRect(0, 0, this.imgCanvas.width, this.imgCanvas.height);
    this.tmpTexture.needsUpdate = true;
  }

  private drawGrid() {
    const gridCtx = this.gridCanvas.getContext('2d');
    gridCtx.fillStyle = '#9af4';
    for (let x = 0; x < this.gridCanvas.width; x += 64) {
      for (let y = 0; y < this.gridCanvas.height; y += 64) {
        gridCtx.fillRect(x - 1, y - 3, 3, 7);
        gridCtx.fillRect(x - 3, y - 1, 7, 3);
      }
    }
  }

  private getMaterial(): THREE.ShaderMaterial {
    this.undoCanvas = this.makeCanvas();
    this.tmpCanvas = this.makeCanvas();
    this.gridCanvas = this.makeCanvas();
    this.imgCanvas = this.makeCanvas();

    this.tmpCtx = this.tmpCanvas.getContext('2d');

    this.drawGrid();

    this.tmpTexture = new THREE.CanvasTexture(this.tmpCanvas);
    this.gridTexture = new THREE.CanvasTexture(this.gridCanvas);
    this.imgTexture = new THREE.CanvasTexture(this.imgCanvas);

    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        panelTexture: {
          value: this.tmpTexture,
        },
        gridTexture: {
          value: this.gridTexture,
        },
        imgTexture: {
          value: this.imgTexture,
        },
        zoomCenter: {
          value: new THREE.Vector2(0, 0),
        },
        zoomAmount: {
          value: 1.0,
        },
        uvMatrix: {
          value: new THREE.Matrix3(),
        },
      },
      vertexShader: `
varying vec2 v_uv;
uniform mat3 uvMatrix;
void main() {
  float r = length(position.xz);
  float u = (atan(position.x, -position.z) / 3.1416 / 2.0) + 0.5;
  float v = (atan(position.y, r) / 3.1416 / 2.0) + 0.5;
  vec3 uv = uvMatrix * vec3(u, v, 1.0);

  v_uv = (uv.xy / uv.z);
  v_uv.y = (v_uv.y - 0.375) * 4.0;

  gl_Position = projectionMatrix * modelViewMatrix * 
    vec4(position, 1.0);
}`,
      fragmentShader: `
varying vec2 v_uv;
uniform sampler2D gridTexture;
uniform sampler2D panelTexture;
uniform sampler2D imgTexture;
void main() {
  vec4 gridColor = texture2D(gridTexture, v_uv);
  vec4 panelColor = texture2D(panelTexture, v_uv);
  vec4 imageColor = texture2D(imgTexture, v_uv);
 
  gl_FragColor = mix(mix(gridColor, panelColor, panelColor.w), 
      imageColor, imageColor.w);
}`
    });

    this.tmpTexture.needsUpdate = true;

    return material;
  }

  public getXY(uv: THREE.Vector2): THREE.Vector2 {
    const tx = new THREE.Vector2();
    tx.copy(uv);
    tx.applyMatrix3(this.finalizedInverseMatrix);
    return new THREE.Vector2(
      this.tmpCanvas.width * tx.x,
      this.tmpCanvas.height * (2.5 - (tx.y * 4.0)));
  }

  private timeout: NodeJS.Timeout = null;
  private updateSaveUrl() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      console.log('Saving...');
      const link = document.getElementById('download') as HTMLAnchorElement;
      link.href = this.undoCanvas.toDataURL("image/png");
    }, 500);
  }
}