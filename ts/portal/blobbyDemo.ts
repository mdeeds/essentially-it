import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Debug } from '../debug';
import { Motion } from '../motion';
import { Tick, Ticker } from '../ticker';
import { World } from '../world';
import { Blobby } from './blobby';
import { Portal } from './portal';


export class BlobbyDemo extends THREE.Object3D implements World, Ticker {
  private leftPortal: Portal;
  private rightPortal: Portal;

  private cameraMaterial: THREE.ShaderMaterial;
  private cPos = new THREE.Object3D();

  private blobby: Blobby;

  constructor(private camera: THREE.PerspectiveCamera,
    private handMotions: Motion[],
    private renderer: THREE.WebGLRenderer) {
    super();
    this.init();
    this.camera.add(this.cPos);
  }
  async run(): Promise<string> {
    return new Promise<string>((resolve) => { });
  }

  private t = new THREE.Vector3();
  getBlend(a: THREE.Vector3, b: THREE.Vector3) {
    this.t.copy(a);
    this.t.sub(b);
    return 1.0 / this.t.length();
  }

  softMax(n: number[]): number[] {
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < n.length; ++i) {
      sum += n[i];
      result[i] = n[i];
    }
    for (let i = 0; i < n.length; ++i) {
      result[i] /= sum;
    }
    return result;
  }


  initBlobby() {
    const geometry = new THREE.IcosahedronBufferGeometry(0.3, 5);
    this.blobby = new Blobby(geometry);
    this.blobby.position.set(0, 0.5, 0);
    this.add(this.blobby);

    const blend: number[] = [];
    const positions = geometry.getAttribute('position');
    const geometryPosition = new THREE.Vector3();

    const naturalPositions = [
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(-0.5, 0.3, -0.1),
      new THREE.Vector3(0.5, 0.3, -0.1),
      new THREE.Vector3(0, -0.2, 0)
    ];

    naturalPositions[0].setLength(0.25);
    naturalPositions[1].setLength(0.3);
    naturalPositions[2].setLength(0.3);
    naturalPositions[3].setLength(0.2);

    for (let i = 0; i < positions.count; ++i) {
      geometryPosition.fromBufferAttribute(positions, i);
      const a = [
        this.getBlend(geometryPosition, naturalPositions[0]),
        this.getBlend(geometryPosition, naturalPositions[1]),
        this.getBlend(geometryPosition, naturalPositions[2]),
        this.getBlend(geometryPosition, naturalPositions[3])
      ];

      blend.push(...this.softMax(a));
    }
    geometry.setAttribute('blend', new THREE.BufferAttribute(
      new Float32Array(blend), 4));
  }

  init() {
    console.log('Init');
    const container = document.body;
    this.initBlobby();

    const debugConsole = new Debug();
    debugConsole.position.set(0, 1.0, 2.0);
    debugConsole.rotateY(Math.PI);
    this.add(debugConsole);

    Debug.log('Initializing');

    container.appendChild(this.renderer.domElement);
    container.appendChild(VRButton.createButton(this.renderer));

    // renderer.localClippingEnabled = true;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshPhongMaterial({ color: '#66f' })
    );
    floor.rotateX(-Math.PI / 2);
    this.add(floor);

    this.cameraMaterial = this.makeCameraMaterial(new THREE.Color('pink'));

    for (let i = 0; i < 20; ++i) {
      const color = new THREE.Color(
        Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5);
      const ball = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(0.2, 3),
        this.cameraMaterial
      );
      ball.position.set(
        Math.random() * 4 - 2, Math.random(), Math.random() * 4 - 2);
      this.add(ball);
    }

    this.leftPortal = new Portal(2, 2);
    this.leftPortal.position.set(-1, 1.5, -2);
    this.leftPortal.rotateY(Math.PI / 4);
    this.add(this.leftPortal);

    this.rightPortal = new Portal(1, 1);
    this.rightPortal.position.set(1, 1.5, -2);
    this.rightPortal.rotateY(-Math.PI / 4)
    this.add(this.rightPortal);

    // lights
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 200);
    mainLight.position.y = 60;
    this.add(mainLight);

    window.addEventListener('resize', () => { this.onWindowResize(); });
  }

  makeCameraMaterial(color: THREE.Color): THREE.ShaderMaterial {

    Debug.log(`Color: ${color.r}, ${color.g}, ${color.b}`);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        'rightCameraPosition': { value: new THREE.Vector3() },
      },
      vertexShader: `
        uniform vec3 rightCameraPosition;
        varying vec3 vColor;
        void main() {
          vColor = vec3(${color.r.toFixed(3)}, ${color.g.toFixed(3)}, ${color.b.toFixed(3)});

          float d = length(rightCameraPosition - cameraPosition);
          if (d > 0.02) {
            vColor = 1.0 - vColor;
          }

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1.0);
      }`,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      // vertexColors: true,
    });
    return material;
  }


  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private p1 = new THREE.Vector3();
  private p2 = new THREE.Vector3();
  private p3 = new THREE.Vector3();
  private p4 = new THREE.Vector3();

  tick(t: Tick) {
    // save the original camera properties
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    const currentShadowAutoUpdate = this.renderer.shadowMap.autoUpdate;
    this.renderer.xr.enabled = false; // Avoid camera modification
    this.renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    this.leftPortal.render(this.rightPortal, this.camera, this.renderer, this);
    this.rightPortal.render(this.leftPortal, this.camera, this.renderer, this);

    // restore the original rendering properties
    this.renderer.xr.enabled = currentXrEnabled;
    this.renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    this.renderer.setRenderTarget(currentRenderTarget);

    const rcp = this.cameraMaterial.uniforms['rightCameraPosition']
      .value as THREE.Vector3;
    this.cPos.getWorldPosition(rcp);
    this.cameraMaterial.uniformsNeedUpdate = true;

    this.cPos.getWorldPosition(this.p1);
    this.blobby.setLimbs(
      this.p1, this.handMotions[0].p, this.handMotions[1].p, this.p4);
  }

}