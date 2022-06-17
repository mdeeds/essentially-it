import * as THREE from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import Ammo from "ammojs-typed";
import { Player } from "./player";
import { Shaders } from "./shaders";
import { S } from "../settings";
import { Column } from "./column";
import { Motion } from "../motion";
import { RewindWorld } from "../portal/rewindWorld";

export class Gymnasium extends THREE.Object3D implements World, Ticker {
  private universe = new THREE.Object3D();
  constructor(private camera: THREE.Object3D,
    private ammo: typeof Ammo,
    private physicsWorld: RewindWorld,
    private keysDown: Set<string>, private motions: Motion[]) {
    super();
    this.add(this.universe);
    const sky = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 1),
      Shaders.makeSkyMaterial());
    this.universe.add(sky);

    const light1 = new THREE.DirectionalLight('white', 0.6);
    light1.position.set(20, 2, 5);
    this.add(light1);
    const light2 = new THREE.DirectionalLight('white', 0.6);
    light2.position.set(-20, 2, 5);
    this.add(light2);

    for (let i = 0; i < 100; ++i) {
      const theta = (i / 100) * Math.PI * 2;
      const x = Math.cos(theta) * 5;
      const z = Math.sin(theta) * 5;

      const pillar = new Column(ammo, physicsWorld, 0.10, 0.10);
      pillar.position.set(x, 0.10, z);
      this.universe.add(pillar);
      pillar.setPhysicsPosition();
    }

    this.setUpGround();

    const player = new Player(ammo, physicsWorld, this.camera, this.motions);
    this.universe.add(player);

    // if (!!speechSynthesis) {
    //   let utterance = new SpeechSynthesisUtterance("Ready to go.");
    //   speechSynthesis.speak(utterance);
    // }
  }

  private setUpGround() {
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

    const colorMatrix = new THREE.Matrix3();
    colorMatrix.set(
      0.8, 0.8, 0.8,
      0.3, 0.4, 0.3,
      0.1, 0.1, 0.2);
    const box = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      Shaders.makeSimplexShader(colorMatrix));

    box.rotateX(-Math.PI / 2);
    this.universe.add(box);
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private spacePressed = false;
  tick(t: Tick) {
    this.universe.quaternion.identity();
    this.universe.rotateX(this.camera.position.z * S.float('dr'));
    this.universe.rotateZ(this.camera.position.x * S.float('dr'));

    if (this.keysDown.has('Space')) {
      this.spacePressed = true;
      this.camera.position.y += (2 - this.camera.position.y) * t.deltaS;
    } else if (this.spacePressed) {
      this.spacePressed = false;
      this.camera.position.y = 1.7;
    }
  }
}