import * as THREE from 'three';
import { PhysicsObject } from '../gym/physicsObject';
import { S } from '../settings';
import { Tick, Ticker } from '../ticker';

export class Grabber extends THREE.Object3D implements Ticker {

  private lowPass: BiquadFilterNode;
  private gain: GainNode;
  private static oscillator: AudioNode;
  private isOn = false;

  constructor(private audioCtx: AudioContext, private keysDown: Set<String>) {
    super();
    if (!Grabber.oscillator) {
      const oscillator = audioCtx.createOscillator();
      const wave = audioCtx.createPeriodicWave(
        [0, 0, 0, 0, 0, 0], [0, 0.5, 0.33, 0.25, 0.2, 0.167],
        { disableNormalization: false });
      oscillator.setPeriodicWave(wave);
      oscillator.frequency.setValueAtTime(60, audioCtx.currentTime);
      oscillator.start();
      Grabber.oscillator = oscillator;
    }

    this.lowPass = audioCtx.createBiquadFilter();
    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.setValueAtTime(200, audioCtx.currentTime);

    this.gain = audioCtx.createGain();
    this.gain.gain.setValueAtTime(0, audioCtx.currentTime);

    Grabber.oscillator.connect(this.lowPass);
    this.lowPass.connect(this.gain);
    // TODO: Use THREE audio sink.
    this.gain.connect(audioCtx.destination);
    this.off();
  }

  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  public updateNearest(
    targetObject: PhysicsObject, bodyObject: PhysicsObject) {
    const k = S.float('ga');
    const c = S.float('ga');
    const epsilon = 0.2;

    const m = targetObject.getMass();
    targetObject.getWorldPosition(this.v1);
    this.getWorldPosition(this.v2);
    this.v1.sub(this.v2);
    const x = this.v1.length();
    const den = (x * x + epsilon);
    const Fs = (k * x) / (den * den);

    // v1 is the vector from this to target.
    this.v1.setLength(-Fs);

    targetObject.getVelocity(this.v2);
    // Friction always opposes the direction of motion
    this.v2.multiplyScalar(-c);
    this.v1.add(this.v2);

    targetObject.applyForce(this.v1);
    this.v1.multiplyScalar(-1);  // Equal and opposite force
    bodyObject.applyForce(this.v1);

    this.setDistance(x);
    this.setForce(Fs);
  }

  private setDistance(x: number) {
    const speedOfSound = 343; /*m/s*/
    const resonantFrequency = speedOfSound / x;
    this.lowPass.frequency.exponentialRampToValueAtTime(
      resonantFrequency, this.audioCtx.currentTime + 0.005);
  }
  private setForce(f: number) {
    this.gain.gain.linearRampToValueAtTime(
      f * 0.1, this.audioCtx.currentTime + 0.005);
    if (f > 0) {
      this.isOn = true;
    }
  }

  public off() {
    if (this.isOn) {
      this.gain.gain.linearRampToValueAtTime(
        0, this.audioCtx.currentTime + 0.5)
    }
    this.isOn = false;
  }

  public tick(t: Tick) {
  }
}