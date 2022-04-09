import * as THREE from "three";

import { TactileProvider, TactileSink } from "./tactileProvider";

export type ButtonCallback = () => void;

export class Button implements TactileSink {
  private isPressed = false;
  constructor(private model: THREE.Object3D, tactileProvider: TactileProvider,
    private callback: ButtonCallback) {
    tactileProvider.addSink(this);
  }

  isEnabled(): boolean {
    return this.modelIsVisible(this.model);
  }

  private p = new THREE.Vector3();
  start(ray: THREE.Ray, id: number): void {
    this.model.getWorldPosition(this.p);
    this.p.sub(ray.origin);
    if (!this.isPressed && this.p.length() < 0.1) {
      this.isPressed = true;
      this.callback();
    } else {
      this.isPressed = false;
    }
  }
  move(ray: THREE.Ray, id: number): void { }
  end(id: number): void { }

  private modelIsVisible(o: THREE.Object3D) {
    while (o !== null && o !== undefined) {
      if (!o.visible) {
        return false;
      }
      if (o instanceof THREE.Scene) {
        return true;
      }
      o = o.parent;
    }
    return false;
  }
}