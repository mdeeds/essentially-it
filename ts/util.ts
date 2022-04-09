import * as THREE from "three";

export class Util {
  public static isModelVisible(o: THREE.Object3D) {
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