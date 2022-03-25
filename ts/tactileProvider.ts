import * as THREE from "three";

export interface TactileSink {
  start(ray: THREE.Ray, id: number): void;
  move(ray: THREE.Ray, id: number): void;
  end(id: number): void;
}

export class TactileProvider {
  private sinks: TactileSink[] = [];

  addSink(sink: TactileSink) {
    this.sinks.push(sink);
  }

  start(ray: THREE.Ray, id: number): void {
    for (const sink of this.sinks) {
      sink.start(ray, id);
    }
  }

  move(ray: THREE.Ray, id: number): void {
    for (const sink of this.sinks) {
      sink.move(ray, id);
    }
  }

  end(id: number): void {
    for (const sink of this.sinks) {
      sink.end(id);
    }
  }
}