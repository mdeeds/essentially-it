import * as THREE from "three";

export interface World extends THREE.Object3D {
  run(): Promise<string>;
}