import * as THREE from "three";

import { StarField } from "./starField";

export class Home extends THREE.Object3D {
  private nextWorld: (world: string) => void;
  constructor() {
    super();
    this.name = 'Home';
    const starField = new StarField();
    this.add(starField);
    this.makePerimeter();
  }

  private makePerimeter() {
    for (let theta = -Math.PI; theta < Math.PI; theta += 0.02) {
      const x = Math.cos(theta) * 2;
      const z = Math.sin(theta) * 2;
      const y = 1.1 * Math.random();
      const sphere = new THREE.Mesh(
        new THREE.IcosahedronBufferGeometry(0.1, 3),
        new THREE.MeshStandardMaterial({ color: '#09f' }));
      sphere.position.set(x, y, z);
      this.add(sphere);
    }

  }

  async run(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.nextWorld = resolve;
    });
  }
}