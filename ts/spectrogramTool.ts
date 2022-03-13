import * as THREE from "three";
import { BufferGeometry, Sphere } from "three";
import { SampleSource } from "./sampleSource";

import { Tool } from "./tool";

export class SpectrogramTool implements Tool {
  private sampleSource: SampleSource = null;
  private material: THREE.ShaderMaterial;
  constructor(private scene: THREE.Object3D,
    private audioCtx: AudioContext) {
    SampleSource.make(audioCtx).then((source) => {
      this.sampleSource = source;
      this.sampleSource.setListener((samples: Float32Array) => {
        if (this.material) {
          const sampleUniform: Float32Array =
            this.material.uniforms['samples'].value;
          for (let i = 0; i < 128; ++i) {
            sampleUniform[i] = samples[i];
          }
          this.material.uniformsNeedUpdate = true;
        }
      });
    });
  }

  private worldObject: THREE.Object3D;

  public makeObject(): THREE.Object3D {
    let planeGeometry: BufferGeometry =
      new THREE.PlaneBufferGeometry(1, 1);
    return new THREE.Mesh(planeGeometry, this.getMaterial());
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(1);
    this.worldObject.position.add(ray.origin);
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (!this.worldObject) {
      this.worldObject = this.makeObject();
      this.scene.add(this.worldObject);
    }
    this.worldObject.position.copy(ray.direction);
    this.worldObject.position.multiplyScalar(1);
    this.worldObject.position.add(ray.origin);
    const theta = Math.atan2(
      ray.direction.x, ray.direction.z);
    this.worldObject.rotation.y = theta + Math.PI;
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
    this.icon = this.makeObject();
    this.icon.scale.setLength(0.1);
    return this.icon;
  }

  private getMaterial(): THREE.ShaderMaterial {
    if (this.material) {
      return this.material;
    }

    const material = new THREE.ShaderMaterial({
      uniforms: {
        samples: {
          value: new Float32Array(128),
        }
      },
      vertexShader: `
      varying vec2 vUV;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vUV = uv;
      }`,
      fragmentShader: `
      varying vec2 vUV;
      uniform float samples[128];
      void main() {
        int i = clamp(int(128.0 * ((vUV.x / 2.0) + 0.5)), 0, 127);
        float s = samples[i];
        gl_FragColor = vec4(
          vUV.x,  // red
          vUV.y,  // green
          s / 2.0 + 0.5,  // blue
          1.0);  // alpha
      }`,
    });
    const sampleUniform: Float32Array =
      material.uniforms['samples'].value;
    for (let i = 0; i < 128; ++i) {
      sampleUniform[i] = Math.random() * 2 - 1;
    }
    material.uniformsNeedUpdate = true;
    this.material = material;
    return material;
  }
}