import * as THREE from "three";

export interface TactileSink {
  start(ray: THREE.Ray, id: number): void;
  move(ray: THREE.Ray, id: number): void;
  end(id: number): void;
  isEnabled(): boolean;
}

export class TactileProvider {
  private sinks: TactileSink[] = [];

  addSink(sink: TactileSink) {
    this.sinks.push(sink);
  }

  start(ray: THREE.Ray, id: number): void {
    for (const sink of this.sinks) {
      if (sink.isEnabled()) {
        sink.start(ray, id);
      }
    }
  }

  move(ray: THREE.Ray, id: number): void {
    for (const sink of this.sinks) {
      if (sink.isEnabled()) {
        sink.move(ray, id);
      }
    }
  }

  end(id: number): void {
    for (const sink of this.sinks) {
      if (sink.isEnabled()) {
        sink.end(id);
      }
    }
  }
}