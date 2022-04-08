import * as THREE from "three";

import { Tool } from "./tool";

export class SpeechTool implements Tool {
  private recognition: any;

  private text = "";
  private isFinal = false;
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.ctx.font = '64px "SedgwickAve"';
    this.recognition = new (window as any).webkitSpeechRecognition();
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onresult =
      (event: any) => {
        for (var i = event.resultIndex; i < event.results.length; i++) {
          const result: SpeechRecognitionResult = event.results[i];
          this.text = result[0].transcript.toLowerCase();
          this.isFinal = result.isFinal;
        }
      };
    this.recognition.start();
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    try {
      this.recognition.stop();
      this.recognition.start();
    } catch (e) { }
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    if (this.text) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = this.isFinal ? 'black' : 'turquoise';
      this.ctx.fillText(this.text, xy.x, xy.y);
    }
  }

  end(): boolean {
    try {
      this.recognition.stop();
    } catch (e) { }
    return true;
  }

  private icon: THREE.Object3D = null;
  getIconObject(): THREE.Object3D {
    if (this.icon != null) {
      return this.icon;
    }
    this.icon = new THREE.Mesh(
      new THREE.TetrahedronBufferGeometry(0.1),
      new THREE.MeshStandardMaterial({ color: 'pink' }));
    return this.icon;
  }
}