import * as THREE from "three";
import { BufferGeometry, NearestMipmapLinearFilter, Sphere } from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

import { SelectionSphere } from "./conduit/selectionSphere";

import { Tool } from "./tool";
import { NiceLineMaterial } from "./niceLineMaterial";

class SphereTool implements Tool {
  constructor(private scene: THREE.Object3D,
    private objectFactory: () => THREE.Object3D,
    private reach: number) { }

  private worldObject: THREE.Object3D;

  public static makeSphere(material: THREE.Material,
    smooth: boolean): THREE.Object3D {
    let sphereGeometry: BufferGeometry =
      new THREE.IcosahedronBufferGeometry(0.5, 1);
    sphereGeometry.computeVertexNormals();
    if (smooth) {
      sphereGeometry.deleteAttribute('normal');
      sphereGeometry.deleteAttribute('uv');
      sphereGeometry = BufferGeometryUtils.mergeVertices(sphereGeometry, 0.01);
      sphereGeometry.computeVertexNormals();
    }
    return new THREE.Mesh(sphereGeometry, material);
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.objectFactory();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(this.reach);
    this.worldObject.position.add(ray.origin);
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.objectFactory();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(this.reach);
    this.worldObject.position.add(ray.origin);
    const theta = -Math.atan2(
      ray.direction.x, ray.direction.z);
    this.worldObject.rotation.y = theta;
    this.worldObject.updateMatrix();
  }

  end(): boolean {
    return false;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = this.objectFactory();
    this.icon.scale.setLength(0.1);
    return this.icon;
  }
}

export class StandardSphereTool extends SphereTool {
  constructor(scene: THREE.Object3D, smooth: boolean) {
    super(scene, () => {
      return SphereTool.makeSphere(
        new THREE.MeshStandardMaterial({ color: '#fff' }),
        smooth);
    }, 2.0);
  }
}

export class ShaderSphereTool1 extends SphereTool {
  constructor(scene: THREE.Object3D) {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
      fragmentShader: `
      void main() {
        gl_FragColor = vec4(
          0.9,  // red
          0.5,  // green
          1.0,  // blue
          1.0);  // alpha
      }`,
    });

    super(scene, () => {
      return SphereTool.makeSphere(material, true);
    }, 2.0);
  }
}

export class ShaderSphereTool2 extends SphereTool {
  constructor(scene: THREE.Object3D) {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vNormal;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;
      }`,
      fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = (0.2 + clamp(vNormal.y, 0.0, 1.0));
        gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
      }`,
    })

    super(scene, () => {
      return SphereTool.makeSphere(material, true);
    }, 2.0);
  }
}

export class ShaderSphereTool3 extends SphereTool {
  constructor(scene: THREE.Object3D) {
    super(scene, () => {
      return new SelectionSphere(1, new THREE.Color(0.1, 0.0, 1.0));
    }, 0.5);
  }
}

export class ShaderSphereTool4 extends SphereTool {
  constructor(scene: THREE.Object3D) {
    super(scene, () => {
      return new SelectionSphere(2, new THREE.Color(0.1, 0.0, 1.0));
    }, 0.5);
  }
}

export class LineSphereTool extends SphereTool {
  constructor(scene: THREE.Object3D) {
    super(scene, () => {
      const geometry = new THREE.IcosahedronBufferGeometry(0.13, 3);
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges, new THREE.LineBasicMaterial({ color: 'blue' }));
      return line;
    }, 0.5);
  }
}

export class StringSphere extends SphereTool {
  constructor(scene: THREE.Object3D) {
    // const material = new LineMaterial({
    //   color: 0x0000ff,
    //   worldUnits: true,
    //   linewidth: 0.005,
    //   dashed: false,
    //   alphaToCoverage: true,
    // });

    const material = new NiceLineMaterial();

    material.resolution.set(1024, 512);

    const positions: number[] = [];
    for (let i = 0; i < 100; ++i) {
      const p = new THREE.Vector3(
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      p.normalize();
      positions.push(0, 0, 0);
      positions.push(p.x, p.y, p.z);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    // geometry.setColors(colors);

    const line = new Line2(geometry, material);
    line.name = 'StringSphere';

    super(scene, () => {
      return line;
    }, 0.5)
  }
}