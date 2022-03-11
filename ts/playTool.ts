import * as THREE from "three";

import { Tool } from "./tool";

export class PlayTool implements Tool {
  private audio: HTMLAudioElement = null;
  private isPlaying = false;
  constructor(url: string) {
    this.audio = document.createElement('audio');
    this.audio.src = url;
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (this.isPlaying) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
    } else {
      this.audio.play();
      this.isPlaying = true;

    }
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
  }

  end(): boolean {
    return false;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = new THREE.Mesh(
      new THREE.ConeBufferGeometry(0.05, 0.1),
      new THREE.MeshStandardMaterial({ color: 'green', emissive: 0.4 }));
    this.icon.rotateZ(-Math.PI / 2);
    return this.icon;
  }
}