import * as THREE from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import { ThirdPersonCamera } from "./thirdPersonCamera";
import { Zoa } from "./zoa";

export class Luna extends THREE.Object3D implements World, Ticker {
  constructor(private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer) {
    super();

    const light = new THREE.HemisphereLight('#fff', '#222');
    this.add(light);

    const zoa = new Zoa();
    zoa.position.set(0, 0.9, -2.0);
    const tpc = new ThirdPersonCamera(zoa);
    this.add(zoa);
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private spacePressed = false;
  tick(t: Tick) {
  }

}