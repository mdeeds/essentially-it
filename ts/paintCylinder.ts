import * as THREE from "three";
import { CylinderBufferGeometry } from "three";
import { Zoom } from "./zoom";

export class PaintCylinder extends THREE.Group {
  private mesh: THREE.Mesh;
  private canvasTexture: THREE.CanvasTexture;
  private renderCanvas: HTMLCanvasElement;

  private undoCanvas: HTMLCanvasElement;
  private tmpCanvas: HTMLCanvasElement;
  private gridCanvas: HTMLCanvasElement;

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

  public getContext(): CanvasRenderingContext2D {
    return this.tmpCtx;
  }

  private composite() {
    const renderCtx = this.renderCanvas.getContext('2d');
    renderCtx.clearRect(
      0, 0, this.renderCanvas.width, this.renderCanvas.height);
    renderCtx.drawImage(this.gridCanvas, 0, 0);
    renderCtx.drawImage(this.tmpCanvas, 0, 0);
  }

  public setNeedsUpdate() {
    this.composite();
    this.canvasTexture.needsUpdate = true;
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

  private makeCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1024 * 8;
    canvas.height = 1024 * 2;
    return canvas;
  }

  public commit() {
    const undoCtx = this.undoCanvas.getContext('2d');
    undoCtx.clearRect(0, 0, this.renderCanvas.width, this.renderCanvas.height);
    undoCtx.drawImage(this.renderCanvas, 0, 0);
    console.log('Commit.');
  }

  public cancel() {
    this.tmpCtx.clearRect(0, 0, this.renderCanvas.width, this.renderCanvas.height);
    this.tmpCtx.drawImage(this.undoCanvas, 0, 0);
    console.log('Cancel.');
  }

  private drawGrid() {
    const gridCtx = this.gridCanvas.getContext('2d');

    gridCtx.fillStyle = '#9af4';
    for (let x = 0; x < this.renderCanvas.width; x += 64) {
      for (let y = 0; y < this.renderCanvas.height; y += 64) {
        gridCtx.fillRect(x - 1, y - 3, 3, 7);
        gridCtx.fillRect(x - 3, y - 1, 7, 3);
      }
    }
    gridCtx.strokeStyle = '#9af';
    gridCtx.lineWidth = 2;
    gridCtx.beginPath();
    gridCtx.moveTo(0.5, 0.5);
    gridCtx.lineTo(this.renderCanvas.width - 0.5, 0.5);
    gridCtx.lineTo(this.renderCanvas.width - 0.5, this.renderCanvas.height - 0.5);
    gridCtx.lineTo(0.5, this.renderCanvas.height - 0.5);
    gridCtx.lineTo(0.5, 0.5);
    gridCtx.stroke();
  }

  private getMaterial(): THREE.ShaderMaterial {
    this.undoCanvas = this.makeCanvas();
    this.tmpCanvas = this.makeCanvas();
    this.renderCanvas = this.makeCanvas();
    this.gridCanvas = this.makeCanvas();
    this.tmpCtx = this.tmpCanvas.getContext('2d');

    this.drawGrid();

    this.commit();
    this.composite();

    this.canvasTexture = new THREE.CanvasTexture(this.renderCanvas);

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
uniform sampler2D panelTexture;
void main() {
  gl_FragColor = texture2D(panelTexture, v_uv);
}`
    });

    this.canvasTexture.needsUpdate = true;

    return material;
  }

  public getXY(uv: THREE.Vector2): THREE.Vector2 {
    const tx = new THREE.Vector2();
    tx.copy(uv);
    tx.applyMatrix3(this.finalizedInverseMatrix);
    return new THREE.Vector2(
      this.renderCanvas.width * tx.x,
      this.renderCanvas.height * (2.5 - (tx.y * 4.0)));
  }

  private timeout: NodeJS.Timeout = null;
  private updateSaveUrl() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      console.log('Saving...');
      const link = document.getElementById('download') as HTMLAnchorElement;
      link.href = this.renderCanvas.toDataURL("image/png");
    }, 500);
  }
}