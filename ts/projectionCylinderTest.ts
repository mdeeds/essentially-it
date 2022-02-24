import * as THREE from "three";
import { ProjectionCylinder } from "./projectionCylinder";

const o = new THREE.Object3D();

const pc = new ProjectionCylinder(o, 1.5);

{
  const r = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
  const uv = pc.getUV(r);

  console.assert(uv.x == 0.5, 'x', uv.x, 0.5);
  console.assert(uv.y == 0.5, 'y', uv.y, 0.5);
}

{
  const r = new THREE.Ray(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1));
  const uv = pc.getUV(r);

  console.assert(uv.x == 0.5, 'x', uv.x, 0.5);
  console.assert(uv.y > 0.59, 'y', uv.y, 0.6);
}

{
  const r = new THREE.Ray(new THREE.Vector3(0.5, 0, 0), new THREE.Vector3(0, 0, -1));
  const uv = pc.getUV(r);

  console.assert(uv.x > 0.5, 'x', uv.x, 0.51);
  console.assert(uv.y == 0.5, 'y', uv.y, 0.5);
}