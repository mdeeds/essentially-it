import * as THREE from "three";

export interface Tool {

}

export class TactileInterface {
  private activeHands = new Set<number>();

  constructor() {

  }

  public start(tool: Tool, ray: THREE.Ray, handIndex: number) {
    this.activeHands.add(handIndex);
    if (this.activeHands.size > 1) {

    }
  }

  public move(tool: Tool, ray: THREE.Ray, handIndex: number) {

  }

  public end(tool: Tool, ray: THREE.Ray, handIndex: number) {
    this.activeHands.delete(handIndex);
  }


}