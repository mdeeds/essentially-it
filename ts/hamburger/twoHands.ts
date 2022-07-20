import * as THREE from "three";

export class TwoHands {
  private leftGrip: THREE.Object3D;
  private rightGrip: THREE.Object3D;
  private leftSource: THREE.XRInputSource;
  private rightSource: THREE.XRInputSource;
  private numHands = 0;

  constructor(xr: THREE.WebXRManager) {
    this.registerConnection(xr.getControllerGrip(0));
    this.registerConnection(xr.getControllerGrip(1));
  }

  private registerConnection(grip: THREE.Object3D) {
    grip.addEventListener('connected', (ev) => {
      const data: THREE.XRInputSource = ev.data;
      if (data.handedness == 'left') {
        this.leftGrip = grip;
        this.leftSource = data;
        this.leftGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#88f' })));
        ++this.numHands;
      } else {
        this.rightGrip = grip;
        this.rightSource = data;
        this.rightGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#f88' })));
        ++this.numHands;
      }
    });
  }

  public isInitialized() {
    return this.numHands === 2;
  }

  public getLeftPosition(target: THREE.Vector3) {
    if (this.leftGrip) {
      this.leftGrip.getWorldPosition(target);
    }
  }

  public getRightPosition(target: THREE.Vector3) {
    if (this.rightGrip) {
      this.rightGrip.getWorldPosition(target);
    }
  }

}