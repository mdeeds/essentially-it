import * as THREE from "three";
import { Tick, Ticker } from "../ticker";
import { World } from "../world";

export class EatingHamburgers extends THREE.Object3D implements World, Ticker {
  private upcoming = new Set<THREE.Object3D>();
  private lastSpawn: number = undefined;

  private leftGrip: THREE.Object3D;
  private rightGrip: THREE.Object3D;
  private leftSource: THREE.XRInputSource;
  private rightSource: THREE.XRInputSource;

  constructor(private camera: THREE.Object3D,
    private renderer: THREE.WebGLRenderer) {
    super();

    const light = new THREE.HemisphereLight('#fff', '#112');
    this.add(light);

    this.registerConnection(renderer.xr.getControllerGrip(0));
    this.registerConnection(renderer.xr.getControllerGrip(1));
  }

  private registerConnection(grip: THREE.Object3D) {
    grip.addEventListener('connected', (ev) => {
      const data: THREE.XRInputSource = ev.data;
      if (data.handedness == 'left') {
        this.leftGrip = grip;
        this.leftSource = data;
        this.leftGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#88f' })));
      } else {
        this.rightGrip = grip;
        this.rightSource = data;
        this.rightGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#f88' })));
      }
    });
  }

  private spawn() {
    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshPhongMaterial;
    if (Math.random() < 0.5) {
      geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    } else {
      geometry = new THREE.TetrahedronBufferGeometry(0.35, 0);
    }
    if (Math.random() < 0.5) {
      material = new THREE.MeshPhongMaterial({ color: '#13f' });
    } else {
      material = new THREE.MeshPhongMaterial({ color: '#f13' });
    }
    const mesh = new THREE.Mesh(geometry, material);
    this.upcoming.add(mesh);
    this.add(mesh);
    mesh.position.set(
      Math.random() * 2 - 1.0,
      Math.random() + 0.75,
      -15);
  }

  private tmp1 = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  isHit(o: THREE.Object3D): boolean {
    o.getWorldPosition(this.tmp1);
    this.leftGrip.getWorldPosition(this.tmp2);
    this.tmp2.sub(this.tmp1);
    if (this.tmp2.length() < 0.4) {
      return true;
    }
    this.rightGrip.getWorldPosition(this.tmp2);
    this.tmp2.sub(this.tmp1);
    if (this.tmp2.length() < 0.4) {
      return true;
    }
    return false;
  }

  private toDelete = new Set<THREE.Object3D>();
  tick(t: Tick) {



    if (this.lastSpawn === undefined) {
      this.lastSpawn = t.elapsedS;
    }
    if (t.elapsedS - this.lastSpawn > 0.5) {
      this.spawn();
      this.lastSpawn += 0.5;
    }
    this.toDelete.clear();
    for (const m of this.upcoming) {
      if (this.isHit(m)) {
        this.remove(m);
        this.toDelete.add(m);
      } else {
        m.position.z += 3.0 * t.deltaS;
        m.rotateZ(1.4 * t.deltaS);
        m.rotateX(0.3 * m.position.z * t.deltaS);
        if (m.position.z >= 1.0) {
          this.remove(m);
          this.toDelete.add(m);
        }
      }
    }
    for (const m of this.toDelete) {
      this.upcoming.delete(m);
    }
  }

  run(): Promise<string> {
    return new Promise<string>((resolve) => { });
  }

}