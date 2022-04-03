import * as THREE from "three";
import { Knob } from "./knob";
import { SelectionSphere } from "./selectionSphere";

export class KnobAction extends THREE.Object3D {
  constructor(knob: Knob) {
    super();
    const highlight = new SelectionSphere(2);
    this.add(highlight);
  }
}