export interface Tool {
  start(xy: THREE.Vector2, ray: THREE.Ray): void;
  move(xy: THREE.Vector2, ray: THREE.Ray): void;
  end(): void;

  getIconObject(): THREE.Object3D;
}