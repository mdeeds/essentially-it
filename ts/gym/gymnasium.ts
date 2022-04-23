import * as THREE from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";

export class Gymnasium extends THREE.Object3D implements World, Ticker {
  private universe = new THREE.Object3D();
  constructor(private camera: THREE.Object3D) {
    super();
    this.add(this.universe);
    this.previousZ = camera.position.z;
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

  private previousZ = 0;
  tick(t: Tick) {
    const deltaZ = Math.abs(this.camera.position.z - this.previousZ);
    this.previousZ = this.camera.position.z;

    this.universe.position.z += deltaZ;
  }


}