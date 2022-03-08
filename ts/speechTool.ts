import * as THREE from "three";

import { Tool } from "./tool";

export class SpeechTool implements Tool {
  private recognition: any;

  private text = "";
  private isFinal = false;
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.ctx.font = 'bold 64px monospace';
    this.recognition = new (window as any).webkitSpeechRecognition();
    this.recognition.lang = "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    console.log('Building recognition');
    console.log(this.recognition);

    this.recognition.onresult =
      (event: any) => {
        for (var i = event.resultIndex; i < event.results.length; i++) {
          const result: SpeechRecognitionResult = event.results[i];
          this.text = result[0].transcript.toLowerCase();
          this.isFinal = result.isFinal;
          console.log(
            (result.isFinal ? '*' : ' ') +
            event.results[i][0].transcript);
        }
      };
    for (const type of ['start', 'error', 'end', 'audiostart', 'audioend', 'nomatch']) {
      this.recognition[`on${type}`] =
        (event: any) => {
          this.logType(event as Event);
        };
    }
    this.recognition.start();
  }

  private logType(event: Event) {
    console.log(`Event: ${event.type}`);
  }

  start(xy: THREE.Vector2, ray: THREE.Ray): void {
    console.log('Start method');
    try {
      this.recognition.stop();
      this.recognition.start();
    } catch (e) { }
  }

  move(xy: THREE.Vector2, ray: THREE.Ray): void {
    console.log('Move method');
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