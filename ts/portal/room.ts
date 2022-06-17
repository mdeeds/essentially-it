import * as THREE from 'three';
import Ammo from "ammojs-typed";
import { StaticObject } from '../gym/staticObject';
import { PhysicsObject } from '../gym/physicsObject';
import { Volume } from './volume';
import { RewindWorld } from './rewindWorld';

export class Room extends THREE.Object3D {
  constructor(private ammo: typeof Ammo,
    private physicsWorld: RewindWorld) {
    super();
    this.buildRoom();
  }

  private makePanel(nx: number, ny: number, nz: number): StaticObject {
    const halfSize = new this.ammo.btVector3(1, 1, 0.01);
    const shape = new this.ammo.btBoxShape(halfSize);
    shape.setMargin(0.01);
    const body =
      PhysicsObject.makeRigidBody(this.ammo, shape, /*mass=*/0);
    const color = new THREE.Color('#ddf');
    color.r -= Math.random() * 0.1;
    color.g -= Math.random() * 0.1;
    color.b -= Math.random() * 0.1;
    const obj = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(halfSize.x() * 2, halfSize.y() * 2),
      new THREE.MeshPhongMaterial({ color: color }));
    const physicalObject = new StaticObject(
      this.ammo, body, this);
    physicalObject.add(obj);
    this.physicsWorld.addRigidBody(body);

    if (nx > 0) {
      physicalObject.rotateY(Math.PI / 2);
    } else if (nx < 0) {
      physicalObject.rotateY(-Math.PI / 2);
    } else if (nz > 0) {
      // Nothing to do
    } else if (nz < 0) {
      physicalObject.rotateY(Math.PI);
    } else if (ny > 0) {
      physicalObject.rotateX(-Math.PI / 2);
    } else { // ny < 0
      physicalObject.rotateX(Math.PI / 2);
    }
    return physicalObject;
  }

  private scanVolume(volume: Volume, direction: THREE.Vector3,
    d1: THREE.Vector3, d2: THREE.Vector3) {
    const tmp = new THREE.Vector3();
    const roomRadius = volume.radius;
    const cursor = new THREE.Vector3(0, 0, 0);
    let previousIsOpen = false;
    for (let i = -roomRadius; i <= roomRadius; ++i) {
      for (let j = -roomRadius; j <= roomRadius; ++j) {
        for (let k = -roomRadius; k <= roomRadius; ++k) {
          tmp.copy(direction);
          tmp.multiplyScalar(k);
          cursor.copy(tmp);
          tmp.copy(d1);
          tmp.multiplyScalar(i);
          cursor.add(tmp);
          tmp.copy(d2);
          tmp.multiplyScalar(j);
          cursor.add(tmp);

          const isOpen = volume.isOpen(cursor.x, cursor.y, cursor.z);
          let panel: StaticObject;
          if (previousIsOpen && !isOpen) {
            panel = this.makePanel(-direction.x, -direction.y, -direction.z);
          } else if (!previousIsOpen && isOpen) {
            panel = this.makePanel(direction.x, direction.y, direction.z);
          }
          previousIsOpen = isOpen;
          if (!panel) continue;
          // Panel is half way between previous position and this position.
          panel.position.copy(direction);
          panel.position.multiplyScalar(-0.5);
          panel.position.add(cursor);
          panel.position.multiplyScalar(2.0);  // Panel size
          panel.setPhysicsPosition();
          this.add(panel);
        }
      }
    }
  }

  private buildRoom() {
    const volume = new Volume(10);

    const roomRadius = 2;
    for (let x = -roomRadius; x <= roomRadius; ++x) {
      for (let y = 0; y < 2; ++y) {
        for (let z = -roomRadius; z < roomRadius; ++z) {
          volume.set(x, y, z, true);
        }
      }
    }

    let xUnit = new THREE.Vector3(1, 0, 0);
    let yUnit = new THREE.Vector3(0, 1, 0);
    let zUnit = new THREE.Vector3(0, 0, 1);
    this.scanVolume(volume, xUnit, yUnit, zUnit);
    this.scanVolume(volume, yUnit, xUnit, zUnit);
    this.scanVolume(volume, zUnit, xUnit, yUnit);
  }

}