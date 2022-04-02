import { Knob } from "./knob";

export interface Synth {
  getKnobs(): Knob[];
}