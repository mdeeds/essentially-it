import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Debug } from '../debug';
import { Motion } from '../motion';
import { Tick, Ticker } from '../ticker';
import { World } from '../world';
import { Blobby } from './blobby';
import { Portal } from './portal';
import { PortalPanel } from './portalPanel';


export class BlobbyDemo extends THREE.Object3D implements World, Ticker {
  private leftPortal: Portal;
  private rightPortal: Portal;

  private cameraMaterial: THREE.ShaderMaterial;
  private cPos = new THREE.Object3D();

  private blobby: Blobby;

  private universe = new THREE.Group();

  constructor(private camera: THREE.PerspectiveCamera,
    private handMotions: Motion[],
    private renderer: THREE.WebGLRenderer) {
    super();
    this.init();
    this.add(this.universe);
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
    const initialRadius = 0.3;
    const geometry = new THREE.IcosahedronBufferGeometry(initialRadius, 5);
    this.blobby = new Blobby(geometry);
    this.blobby.position.set(0, 0.5, 0);
    this.add(this.blobby);

    const blend: number[] = [];
    const positions = geometry.getAttribute('position');
    const geometryPosition = new THREE.Vector3();

    const naturalPositions = [
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(-0.5, 0.5, -0.1),
      new THREE.Vector3(0.5, 0.5, -0.1),
      new THREE.Vector3(0, -0.2, 0)
    ];

    naturalPositions[0].setLength(0.8 * initialRadius);
    naturalPositions[1].setLength(1.1 * initialRadius);
    naturalPositions[2].setLength(1.1 * initialRadius);
    naturalPositions[3].setLength(0.99 * initialRadius);

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

  private buildRoom() {
    const roomRadius = 2;
    for (let i = -roomRadius; i <= roomRadius; ++i) {
      const p1 = new PortalPanel();
      p1.position.set(i * 2, 1.0, -roomRadius * 2 - 1);
      this.universe.add(p1);
      const p2 = new PortalPanel();
      p2.position.set(roomRadius * 2 + 1, 1.0, i * 2);
      p2.rotateY(-Math.PI / 2);
      this.universe.add(p2);
      const p3 = new PortalPanel();
      p3.position.set(i * 2, 1.0, roomRadius * 2 + 1);
      p3.rotateY(Math.PI);
      this.universe.add(p3);
      const p4 = new PortalPanel();
      p4.position.set(-roomRadius * 2 - 1, 1.0, i * 2);
      p4.rotateY(Math.PI / 2);
      this.universe.add(p4);
    }
  }

  init() {
    console.log('Init');
    const container = document.body;
    this.initBlobby();

    const debugConsole = new Debug();
    debugConsole.position.set(0, 1.0, 2.0);
    debugConsole.rotateY(Math.PI);
    this.universe.add(debugConsole);

    this.buildRoom();

    Debug.log('Initializing');

    container.appendChild(this.renderer.domElement);
    container.appendChild(VRButton.createButton(this.renderer));

    // renderer.localClippingEnabled = true;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshPhongMaterial({ color: '#66f' })
    );
    floor.rotateX(-Math.PI / 2);
    this.universe.add(floor);

    this.cameraMaterial = this.makeCameraMaterial(new THREE.Color('pink'));

    for (let i = 0; i < 20; ++i) {
      const color = new THREE.Color(
        Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5);
      const ball = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(0.2, 3),
        new THREE.MeshPhongMaterial({ color: color })
      );
      ball.position.set(
        Math.random() * 4 - 2, Math.random(), Math.random() * 4 - 2);
      this.universe.add(ball);
    }

    this.leftPortal = new Portal(1, 2);
    this.leftPortal.position.set(-1, 1.0, -2);
    this.leftPortal.rotateY(Math.PI / 4);
    this.universe.add(this.leftPortal);

    this.rightPortal = new Portal(0.5, 1);
    this.rightPortal.position.set(1, 0.5, -2);
    this.rightPortal.rotateY(-Math.PI / 4)
    this.universe.add(this.rightPortal);

    // lights
    const mainLight = new THREE.DirectionalLight(new THREE.Color('white'), 1.0);
    mainLight.position.y = 60;
    this.universe.add(mainLight);
    const upLight = new THREE.DirectionalLight(new THREE.Color('#acf'), 0.1);
    upLight.position.y = -60;
    this.universe.add(upLight);

    window.addEventListener('resize', () => { this.onWindowResize(); });
  }

  makeCameraMaterial(color: THREE.Color): THREE.ShaderMaterial {
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

  private renderPortals() {
    // save the original camera properties
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    const currentShadowAutoUpdate = this.renderer.shadowMap.autoUpdate;
    this.renderer.xr.enabled = false; // Avoid camera modification
    this.renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    this.blobby.visible = true;
    this.leftPortal.render(this.rightPortal, this.camera, this.renderer, this);
    this.rightPortal.render(this.leftPortal, this.camera, this.renderer, this);
    this.blobby.visible = false;

    // restore the original rendering properties
    this.renderer.xr.enabled = currentXrEnabled;
    this.renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    this.renderer.setRenderTarget(currentRenderTarget);
  }

  private updateCameraMaterial() {
    const rcp = this.cameraMaterial.uniforms['rightCameraPosition']
      .value as THREE.Vector3;
    this.cPos.getWorldPosition(rcp);
    this.cameraMaterial.uniformsNeedUpdate = true;
  }

  private updateBlobby() {
    this.cPos.getWorldQuaternion(this.blobby.quaternion);
    this.blobby.updateMatrixWorld(true);
    this.cPos.getWorldPosition(this.p1);
    this.p2.copy(this.handMotions[0].p);
    this.p3.copy(this.handMotions[1].p);
    this.p4.copy(this.p1);
    this.p4.y = 0;

    this.blobby.worldToLocal(this.p1);
    this.blobby.worldToLocal(this.p2);
    this.blobby.worldToLocal(this.p3);
    this.blobby.worldToLocal(this.p4);
    this.blobby.setLimbs(
      this.p1, this.handMotions[0].p, this.handMotions[1].p, this.p4);
  }

  private session: THREE.XRSession = undefined;
  private getSession() {
    if (!!this.session) {
      return;
    }
    const session = this.renderer.xr.getSession();
    if (session) {
      Debug.log('Session aquired.');
      this.session = session;
    }
  }

  private previousButtons: number[][] = undefined;
  private currentButtons: number[][] = undefined;

  private updateButtons() {
    if (!this.session) {
      return;
    }
    this.previousButtons = this.currentButtons;
    this.currentButtons = [];
    for (const source of this.session.inputSources) {
      this.currentButtons.push(source.gamepad.buttons.map((b) => b.value));
    }
  }

  private moveBlobby(t: Tick) {
    if (!this.currentButtons || !(this.currentButtons.length < 2)) {
      if (Math.random() < 0.01) {
        Debug.log(`No controllers.`);
      }
      // We don't have a pair of controllers yet.
      return;
    }
    if (this.currentButtons[0][1] !== this.previousButtons[0][1]) {
      Debug.log('Grip 0 changed.');
    }

    if (this.currentButtons[0][1] && this.currentButtons[1][1]) {
      // Hold both grips to move.
      this.p1.copy(this.handMotions[0].velocity);
      this.p2.copy(this.handMotions[1].velocity);
      // Remove vertical component.
      this.p1.y = 0;
      this.p2.y = 0;
      const xzDot = this.p1.dot(this.p2);
      if (Math.random() < 0.01) {
        Debug.log(`Dot: ${xzDot.toFixed(3)}`);
      }
      if (xzDot > 0) {
        // Hands are stationary or moving in the same direction;
        return;
      }
      this.cPos.getWorldDirection(this.p1);
      this.p1.y = 0;  // Remove vertical component.
      this.p1.setLength(Math.sqrt(Math.abs(xzDot)) * 0.1);
      if (this.p1.length() > t.elapsedS) {
        // For now, cap speed to 1 m/s
        this.p1.setLength(t.elapsedS);
      }
      this.universe.position.add(this.p1);
    }
  }

  tick(t: Tick) {
    this.getSession();
    this.renderPortals();
    this.updateCameraMaterial();
    this.updateBlobby();
    this.updateButtons();
    this.moveBlobby(t);
  }
}