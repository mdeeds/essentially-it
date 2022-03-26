import * as THREE from "three";

import { TactileProvider, TactileSink } from "./tactileProvider";

export type ButtonCallback = () => void;

export class Button implements TactileSink {
  private isPressed = false;
  constructor(private model: THREE.Object3D, tactileProvider: TactileProvider,
    private callback: ButtonCallback) {
    tactileProvider.addSink(this);
  }

  private p = new THREE.Vector3();
  start(ray: THREE.Ray, id: number): void {
    this.model.getWorldPosition(this.p);
    this.p.sub(ray.origin);
    console.log(`Distance: ${this.p.length()}`);
    if (!this.isPressed && this.p.length() < 0.1) {
      this.isPressed = true;
      this.callback();
    } else {
      this.isPressed = false;
    }
  }
  move(ray: THREE.Ray, id: number): void { }
  end(id: number): void { }
}