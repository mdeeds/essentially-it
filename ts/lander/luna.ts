import * as THREE from "three";
import { Object3D } from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";
import { ThirdPersonCamera } from "./thirdPersonCamera";
import { Zoa } from "./zoa";

export class Luna extends THREE.Object3D implements World, Ticker {
  private cameraPos = new Object3D();
  private zoa = new Zoa();
  constructor(private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer) {
    super();
    camera.add(this.cameraPos);
    const light = new THREE.HemisphereLight('#fff', '#222');
    this.add(light);
    this.zoa.position.set(0, 0.9, -2.0);
    const tpc = new ThirdPersonCamera(this.zoa);
    this.add(this.zoa);
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => {
      // TODO: wire up exit button...?
    });
  }

  private spacePressed = false;
  private previousY = undefined;
  private currentCameraPosition = new THREE.Vector3();
  tick(t: Tick) {
    this.cameraPos.getWorldPosition(this.currentCameraPosition);
    if (this.previousY) {
      const deltaY = this.currentCameraPosition.y - this.previousY;
      if (deltaY > 0) {
        this.zoa.position.y += 2.0 * deltaY;
      }
    }
    this.zoa.position.y -= 0.3 * t.deltaS;
    if (this.zoa.position.y < 0.0) {
      this.zoa.position.y = 0.0;
    }
    this.previousY = this.currentCameraPosition.y;
  }

}