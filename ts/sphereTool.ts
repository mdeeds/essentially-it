import * as THREE from "three";
import { BufferGeometry, Sphere } from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { Tool } from "./tool";

export class SphereTool implements Tool {
  constructor(private scene: THREE.Object3D,
    private objectFactory: () => THREE.Object3D) { }

  private worldObject: THREE.Object3D;

  public static makeSphere(material: THREE.Material,
    smooth: boolean): THREE.Object3D {
    let sphereGeometry: BufferGeometry =
      new THREE.IcosahedronBufferGeometry(0.5, 0);
    if (smooth) {
      console.log('smoothing...');
      sphereGeometry.deleteAttribute('normal');
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
    this.worldObject.position.multiplyScalar(2);
    this.worldObject.position.add(ray.origin);
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.objectFactory();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(2);
    this.worldObject.position.add(ray.origin);
  }

  end(): void {
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
      return SphereTool.makeSphere(new THREE.MeshStandardMaterial({ color: '#fff' }),
        smooth);
    });
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
      varying vec3 vNormal;
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
    });
  }
}

export class ShaderSphereTool2 extends SphereTool {
  constructor(scene: THREE.Object3D) {
    const material = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vNormal;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vNormal = normal;
      }`,
      fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = vNormal.y;
        gl_FragColor = vec4(intensity, intensity, intensity, 1.0);
      }`,
    })

    super(scene, () => {
      return SphereTool.makeSphere(material, true);
    });
  }
}