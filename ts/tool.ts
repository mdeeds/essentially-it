export interface Tool {
  paintDown(xy: THREE.Vector2): void;
  paintMove(xy: THREE.Vector2): void;
  paintEnd(): void;

}