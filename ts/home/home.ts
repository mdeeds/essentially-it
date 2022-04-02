import * as THREE from "three";

import { StarField } from "./starField";

export class Home extends THREE.Object3D {
  private nextWorld: (world: string) => void;
  constructor() {
    super();
    const starField = new StarField();
    this.add(starField);
  }

  async run(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.nextWorld = resolve;
    });
  }
}