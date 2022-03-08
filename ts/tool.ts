export interface Tool {
  start(xy: THREE.Vector2, ray: THREE.Ray): void;
  move(xy: THREE.Vector2, ray: THREE.Ray): void;

  // Returns true if the work should be committed.
  end(): boolean;

  getIconObject(): THREE.Object3D;
}