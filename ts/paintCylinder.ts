import * as THREE from "three";

export class PaintCylinder extends THREE.Object3D {
  private mesh: THREE.Mesh;
  private canvasTexture: THREE.CanvasTexture;
  // private panelMaterial: THREE.MeshStandardMaterial = null;
  constructor() {
    super();
    // this.panelMaterial = new THREE.MeshStandardMaterial(
    //   { color: '#8f8', emissive: 1.0, side: THREE.BackSide });

    const radius = 1.5;
    const circumfrence = 2 * Math.PI * radius;
    const height = circumfrence / 4;

    this.mesh = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(
        /*top=*/radius, /*bottom=*/radius,
        /*height=*/height,
        /*radial=*/32, /*vertical=*/8,
        /*open=*/true),
      this.getMaterial());
    this.mesh.position.set(0, 0, 0);

    this.add(this.mesh);
  }
  getMaterial0(): THREE.Material {
    return new THREE.MeshBasicMaterial(
      { color: '#8f8', side: THREE.DoubleSide });
  }


  getMaterial(): THREE.Material {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; ++i) {
      ctx.fillText('Hello, World!',
        Math.random() * canvas.width, Math.random() * canvas.height);
    }
    this.canvasTexture = new THREE.CanvasTexture(canvas);
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
  float u = (atan(position.z, position.x) / 3.14 / 2.0) + 0.5;
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