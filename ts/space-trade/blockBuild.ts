import * as THREE from "three";
import { World } from "../world";

export class Hand extends THREE.Object3D {
  constructor(grip: THREE.Object3D) {
    super();
    grip.add(this);

    const cube = new THREE.Mesh(
      new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: '#987' }));
    cube.position.z = -0.2;
    this.add(cube);

    const lineMaterial = new THREE.LineBasicMaterial({ color: '#def' });
    const lineGeometry = new THREE.BufferGeometry()
      .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0)]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.add(line);

    grip.addEventListener('selectstart', () => {
      const o = cube.clone();
      const p = o.position;
      grip.getWorldPosition(p);
      p.x = Math.round(p.x * 10) / 10;
      p.y = Math.round(p.y * 10) / 10;
      p.z = Math.round(p.z * 10) / 10;
      grip.parent.add(o);
    });

    grip.addEventListener('selectend', () => {

    });
  }
}

export class BlockBuild extends THREE.Object3D implements World {

  private cubes = new Map<string, THREE.Object3D>();

  constructor(
    private camera: THREE.PerspectiveCamera,
    private renderer: THREE.WebGLRenderer) {
    super();
    this.setScene();
    this.getGrips();
  }

  run(): Promise<string> {
    return new Promise((resolve) => {
      // TODO: Actually resolve...
    });
  }

  setScene() {
    document.body.innerHTML = "";
    const light = new THREE.AmbientLight(0x404040); // soft white light
    this.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 40, 10);
    this.add(directionalLight);

    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.target.set(0, 0, 0);
    // controls.update();

    const tetra = new THREE.Mesh(
      new THREE.TetrahedronBufferGeometry(0.5),
      new THREE.MeshStandardMaterial({ color: 'yellow' }));
    tetra.position.set(0, -1.5, 0);
    tetra.onBeforeRender = () => {
      tetra.rotateX(0.01);
      tetra.rotateY(0.0231);
      tetra.rotateZ(0.00512);
    };
    this.add(tetra);
  }

  getGrips() {
    throw new Error("Not implemented: instantiate hands.");
  }
}