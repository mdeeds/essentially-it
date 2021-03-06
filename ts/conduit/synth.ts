import { Knob } from "./knob";

export interface Synth {
  getKnobs(): Knob[];
  trigger(latencyS: number, velocity: number): void;
}