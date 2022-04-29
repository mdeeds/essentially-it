import * as THREE from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";

export class Gymnasium extends THREE.Object3D implements World, Ticker {
  private universe = new THREE.Object3D();
  constructor(private camera: THREE.Object3D) {
    super();
    this.add(this.universe);
    this.previousY = camera.position.y;
    const sky = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(20, 1),
      new THREE.MeshBasicMaterial({ color: '#bbb', side: THREE.BackSide })
    );
    this.universe.add(sky);

    const light1 = new THREE.DirectionalLight('white', 0.6);
    light1.position.set(20, 2, 5);
    this.add(light1);
    const light2 = new THREE.DirectionalLight('white', 0.6);
    light2.position.set(-20, 2, 5);
    this.add(light2);

    for (let i = 0; i < 20; ++i) {
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * 5;
      const z = Math.sin(theta) * 5;

      const pillar = new THREE.Mesh(
        new THREE.CylinderBufferGeometry(0.08, 0.10, 2),
        new THREE.MeshStandardMaterial({ color: '#333' }));
      pillar.position.set(x, 1, z);
      this.universe.add(pillar);
    }
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private cameraNormalMatrix = new THREE.Matrix3();
  private previousY = 0;
  private velocity = new THREE.Vector3();
  private targetVelocity = new THREE.Vector3();
  private velocityDelta = new THREE.Vector3();
  private maxAcceleration = 5;  // m/s/s
  tick(t: Tick) {
    const deltaY = Math.abs(this.camera.position.y - this.previousY);
    if (deltaY > 0) {
      this.cameraNormalMatrix.getNormalMatrix(this.camera.matrixWorld);
      this.targetVelocity.set(0, 0, -1);
      this.targetVelocity.applyMatrix3(this.cameraNormalMatrix);
      this.targetVelocity.y = 0;
      this.targetVelocity.setLength(3 * deltaY / t.deltaS);

      this.velocityDelta.copy(this.targetVelocity);
      this.velocityDelta.sub(this.velocity);
      this.velocityDelta.multiplyScalar(1 / t.deltaS);
      const maxVelocityDelta = this.maxAcceleration * t.deltaS;
      if (this.velocityDelta.length() > maxVelocityDelta) {
        this.velocityDelta.setLength(maxVelocityDelta);
      }
      this.velocity.add(this.velocityDelta);
    }

    this.previousY = this.camera.position.y;
    this.velocityDelta.copy(this.velocity);
    this.velocityDelta.multiplyScalar(t.deltaS);
    this.universe.position.sub(this.velocityDelta);;
  }
}