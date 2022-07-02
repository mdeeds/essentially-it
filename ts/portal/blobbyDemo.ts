import * as THREE from 'three';
import Ammo from "ammojs-typed";

import { Debug } from '../debug';
import { Motion } from '../motion';
import { Tick, Ticker } from '../ticker';
import { World } from '../world';
import { Blobby } from './blobby';
import { Portal } from './portal';
import { PhysicsObject } from '../gym/physicsObject';
import { KinematicObject } from '../gym/kinematicObject';
import { S } from '../settings';
import { Room } from './room';
import { Ball, CubeFactory, SphereFactory } from './ball';
import { RewindWorld } from './rewindWorld';
import { Grabber } from './grabber';
import { PortalPanels } from './portalPanel';

export class BlobbyDemo extends THREE.Object3D implements World, Ticker {
  private leftPortal: Portal;
  private rightPortal: Portal;

  private cameraMaterial: THREE.ShaderMaterial;
  private cPos = new THREE.Object3D();

  private blobby: Blobby;
  private blobbyBall: PhysicsObject;

  private universe = new THREE.Group();

  private allBalls: PhysicsObject[] = [];

  private grabbers: Grabber[] = [];

  constructor(private camera: THREE.PerspectiveCamera,
    private grips: THREE.Object3D[],
    private renderer: THREE.WebGLRenderer,
    private ammo: typeof Ammo,
    private physicsWorld: RewindWorld,
    private audioCtx: AudioContext,
    private keysDown: Set<string>) {
    super();
    this.init();
    this.add(this.universe);
    this.camera.add(this.cPos);
    for (const g of grips) {
      const grabber = new Grabber(this.audioCtx, keysDown);
      this.grabbers.push(grabber);
      g.add(grabber);
    }
  }
  async run(): Promise<string> {
    return new Promise<string>((resolve) => { });
  }

  // makeKinematicBall(position: THREE.Vector3, color: THREE.Color, sphereRadius: number): KinematicObject {
  //   const sphereMass = 0.0;  // Kinematic
  //   const shape = new this.ammo.btSphereShape(sphereRadius);
  //   shape.setMargin(0.01);
  //   const body =
  //     PhysicsObject.makeRigidBody(this.ammo, shape, sphereMass);
  //   const obj = new THREE.Mesh(
  //     new THREE.IcosahedronBufferGeometry(sphereRadius, 3),
  //     new THREE.MeshPhongMaterial({ color: color }));
  //   const physicalObject = new KinematicObject(
  //     this.ammo, body, this.universe);
  //   physicalObject.add(obj);
  //   physicalObject.position.copy(position);
  //   physicalObject.setPhysicsPosition();
  //   this.physicsWorld.addRigidBody(body);
  //   return physicalObject;
  // }

  init() {
    console.log('Init');
    this.blobby = new Blobby();
    this.blobby.position.set(0, 0, 0);
    this.add(this.blobby);

    const shape = new this.ammo.btCylinderShape(new this.ammo.btVector3(
      0.25, 0.10, 0.25));
    // shape.setMargin(0.01);

    this.blobbyBall = new PhysicsObject(this.ammo, 50/*kg*/,
      (radius: number) => new this.ammo.btCylinderShape(
        new this.ammo.btVector3(radius, 0.4 * radius, radius)), 0.25);

    const body = this.blobbyBall.getBody();
    body.setFriction(S.float('bf'));
    body.setRestitution(0.1);  // Blobby doesn't bounce.

    this.blobbyBall.add(new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.25, 0.25, 0.10),
      new THREE.MeshStandardMaterial({ color: '#f0f' })));
    this.universe.add(this.blobbyBall);
    this.physicsWorld.addRigidBody(body);

    const debugConsole = new Debug();
    debugConsole.position.set(0, 1.0, 2.0);
    debugConsole.rotateY(Math.PI);
    this.universe.add(debugConsole);
    const panels = new PortalPanels();
    const room = new Room(this.ammo, this.physicsWorld, panels);
    this.universe.add(room);

    Debug.log('Initializing');

    // renderer.localClippingEnabled = true;

    this.cameraMaterial = this.makeCameraMaterial(new THREE.Color('pink'));

    const cubeFactory = new CubeFactory(this.ammo);
    const sphereFactory = new SphereFactory(this.ammo);

    for (let i = 0; i < 30; ++i) {
      const color = new THREE.Color(
        Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5);
      const position = new THREE.Vector3(
        Math.random() * 4 - 2, Math.random() + 0.2, Math.random() * 4 - 2);
      const ball = new Ball(this.ammo, position,
        i === 0 ? 'orange' : 'red',
        this.physicsWorld, Ball.keyBallMass,
        Math.random() < 0.5 ? cubeFactory : sphereFactory);
      this.allBalls.push(ball);
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
    const mainLight = new THREE.HemisphereLight(new THREE.Color('white'),
      new THREE.Color('#445'));
    mainLight.position.y = 60;
    this.universe.add(mainLight);
    const ambient = new THREE.AmbientLight(new THREE.Color('#acf'), 0.1);
    this.universe.add(ambient);

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
    this.grips[0].getWorldPosition(this.p2);
    this.grips[1].getWorldPosition(this.p3);
    this.p4.copy(this.p1);
    this.p4.y = 0;

    this.blobby.worldToLocal(this.p1);
    this.blobby.worldToLocal(this.p2);
    this.blobby.worldToLocal(this.p3);
    this.blobby.worldToLocal(this.p4);
    this.blobby.setLimbs(this.p1, this.p2, this.p3, this.p4);
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
  private stick = new THREE.Vector2();

  private updateButtons() {
    if (!this.session) {
      return;
    }
    this.previousButtons = this.currentButtons;
    this.currentButtons = [];
    this.stick.set(0, 0);
    for (const source of this.session.inputSources) {
      const bs: GamepadButton[] = [];
      this.currentButtons.push(bs);
      let i = 0;
      for (const b of source.gamepad.buttons) {
        bs.push(b);
        ++i;
      }
      const axes = source.gamepad.axes;
      if (axes.length >= 4) {
        this.stick.x += axes[2];
        this.stick.y += axes[3];
      }
    }
  }

  private findClosestBall(handPosition: THREE.Vector3): PhysicsObject {
    let closest: PhysicsObject = undefined;
    let closestDistance = 2; /*m*/
    for (const b of this.allBalls) {
      b.getWorldPosition(this.p2);
      this.p2.sub(handPosition);
      if (this.p2.length() < closestDistance) {
        closestDistance = this.p2.length();
        closest = b;
      }
    }
    return closest;
  }

  private m3 = new THREE.Matrix3();
  private moveBlobby(t: Tick) {
    this.universe.position.set(
      -this.blobbyBall.position.x,
      -this.blobbyBall.position.y,
      -this.blobbyBall.position.z);
    if (!this.currentButtons || this.currentButtons.length < 2) {
      // We don't have a pair of controllers yet.
      return;
    }
    if (!this.previousButtons || this.previousButtons.length < 2) {
      Debug.log(`Zero is ${this.session.inputSources[0].handedness}`);
      return;
    }

    if (this.stick.x != 0 || this.stick.y != 0) {
      this.p1.set(this.stick.x, 0, this.stick.y);
      this.p1.multiplyScalar(S.float('ba'));
      const msg = `Preforce: ${this.p1.length()}`;
      this.p1.y = 4.9 * this.blobbyBall.getMass();
      this.cPos.updateMatrixWorld();
      this.m3.getNormalMatrix(this.cPos.matrixWorld);
      this.p1.applyMatrix3(this.m3);
      Debug.log(msg + ` post: ${this.p1.length()}`);
      this.blobbyBall.applyForce(this.p1);
    }

    let isRewinding = false;
    for (let i = 0; i < this.currentButtons.length; ++i) {
      const bs = this.currentButtons[i];
      this.grabbers[i].getWorldPosition(this.p1);
      if (bs[1].value || bs[0].value) {
        const ball = this.findClosestBall(this.p1);
        if (ball) {
          this.grabbers[i].updateNearest(ball, this.blobbyBall);
        }
      } else {
        this.grabbers[i].off();
      }
      if (bs[2].value || bs[3].value) {
        isRewinding = true;
        Debug.log('Rewind!');
      }
    }
    this.physicsWorld.setRewind(isRewinding);
  }

  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();

  tick(t: Tick) {
    this.getSession();
    this.renderPortals();
    this.updateCameraMaterial();
    this.updateBlobby();
    this.updateButtons();
    this.moveBlobby(t);

    for (const b of this.allBalls) {
      if (this.leftPortal.updatePosition(b, this.rightPortal, this.m4)) {
        b.applyMatrixToPhysics(this.m4);
      } else if (this.rightPortal.updatePosition(b, this.leftPortal, this.m4)) {
        b.applyMatrixToPhysics(this.m4);
      }
    }
  }
}