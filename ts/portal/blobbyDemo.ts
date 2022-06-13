import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Debug } from '../debug';
import { Motion } from '../motion';
import { Tick, Ticker } from '../ticker';
import { World } from '../world';
import { Blobby } from './blobby';
import { Portal } from './portal';
import { PortalPanel } from './portalPanel';
import { PhysicsObject } from '../gym/physicsObject';
import { KinematicObject } from '../gym/kinematicObject';


export class BlobbyDemo extends THREE.Object3D implements World, Ticker {
  private leftPortal: Portal;
  private rightPortal: Portal;

  private cameraMaterial: THREE.ShaderMaterial;
  private cPos = new THREE.Object3D();

  private blobby: Blobby;
  private blobbyBall: PhysicsObject;

  private universe = new THREE.Group();

  constructor(private camera: THREE.PerspectiveCamera,
    private handMotions: Motion[],
    private renderer: THREE.WebGLRenderer,
    private ammo: typeof Ammo,
    private physicsWorld: Ammo.btDiscreteDynamicsWorld,) {
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
    for (const hm of this.handMotions) {
      hm.add(this.makeKinematicBall(hm.p, new THREE.Color('red'), 0.1));
    }

    const initialRadius = 0.3;
    const geometry = new THREE.IcosahedronBufferGeometry(initialRadius, 5);
    this.blobby = new Blobby(geometry);
    this.blobby.position.set(0, 0.5, 0);
    this.add(this.blobby);
    this.blobbyBall =
      this.makePhysicalBall(this.blobby.position, new THREE.Color('black'), 0.5);
    this.universe.add(this.blobbyBall);

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

    const groundPlane = new this.ammo.btStaticPlaneShape(
      new this.ammo.btVector3(0, 1, 0), 0);
    groundPlane.setMargin(0.01);
    const btTx = new this.ammo.btTransform();
    btTx.setIdentity();
    const btPosition = new this.ammo.btVector3(0, 0, 0);
    const motionState = new this.ammo.btDefaultMotionState(btTx);
    const body = new this.ammo.btRigidBody(
      new this.ammo.btRigidBodyConstructionInfo(
      /*mass=*/0, motionState, groundPlane, btPosition));
    body.setFriction(0.5);
    this.physicsWorld.addRigidBody(body);
  }

  makePhysicalBall(position: THREE.Vector3, color: THREE.Color, sphereRadius: number): PhysicsObject {
    const sphereMass = 1.0;
    const shape = new this.ammo.btSphereShape(sphereRadius);
    shape.setMargin(0.01);
    const body =
      PhysicsObject.makeRigidBody(this.ammo, shape, sphereMass);
    const obj = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(sphereRadius, 3),
      new THREE.MeshPhongMaterial({ color: color }));
    const physicalObject = new PhysicsObject(this.ammo, sphereMass, body);
    physicalObject.add(obj);
    physicalObject.position.copy(position);
    physicalObject.setPhysicsPosition();
    this.physicsWorld.addRigidBody(body);
    return physicalObject;
  }

  makeKinematicBall(position: THREE.Vector3, color: THREE.Color, sphereRadius: number): KinematicObject {
    const sphereMass = 0.0;  // Kinematic
    const shape = new this.ammo.btSphereShape(sphereRadius);
    shape.setMargin(0.01);
    const body =
      PhysicsObject.makeRigidBody(this.ammo, shape, sphereMass);
    const obj = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(sphereRadius, 3),
      new THREE.MeshPhongMaterial({ color: color }));
    const physicalObject = new KinematicObject(
      this.ammo, sphereMass, body, this.universe);
    physicalObject.add(obj);
    physicalObject.position.copy(position);
    physicalObject.setPhysicsPosition();
    this.physicsWorld.addRigidBody(body);
    return physicalObject;
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

    for (let i = 0; i < 30; ++i) {
      const color = new THREE.Color(
        Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5);
      const position = new THREE.Vector3(
        Math.random() * 4 - 2, Math.random() + 0.2, Math.random() * 4 - 2);
      const ball = this.makePhysicalBall(position, color, 0.2);
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

  private previousButtons: GamepadButton[][] = undefined;
  private currentButtons: GamepadButton[][] = undefined;

  private updateButtons() {
    if (!this.session) {
      return;
    }
    this.previousButtons = this.currentButtons;
    this.currentButtons = [];
    for (const source of this.session.inputSources) {
      const bs: GamepadButton[] = [];
      this.currentButtons.push(bs);
      let i = 0;
      for (const b of source.gamepad.buttons) {
        bs.push(b);
        ++i;
      }
    }
  }

  private moveBlobby(t: Tick) {
    if (!this.currentButtons || this.currentButtons.length < 2) {
      // We don't have a pair of controllers yet.
      return;
    }
    if (!this.previousButtons || this.previousButtons.length < 2) {
      return;
    }

    if (this.currentButtons[0][1].pressed &&
      this.currentButtons[1][1].pressed) {
      // Hold both grips to move.
      this.p1.copy(this.handMotions[0].velocity);
      this.p2.copy(this.handMotions[1].velocity);
      // Remove vertical component.
      this.p1.y = 0;
      this.p2.y = 0;
      const xzDot = this.p1.dot(this.p2);
      if (xzDot > 0) {
        // Hands are stationary or moving in the same direction;
        return;
      }
      this.cPos.getWorldDirection(this.p1);
      this.p1.y = 0;  // Remove vertical component.
      this.p1.setLength(Math.sqrt(Math.abs(xzDot)));
      this.blobbyBall.setVelocity(this.p1);
      if (Math.random() < 0.05) {
        Debug.log(`Acc: ${this.p1.length()}`);
      }
    }
    this.universe.position.set(
      -this.blobbyBall.position.x,
      -this.blobbyBall.position.y,
      -this.blobbyBall.position.z);
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