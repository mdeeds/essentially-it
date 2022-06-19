import * as THREE from 'three';
import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils.js';
import { PhysicsObject } from '../gym/physicsObject';
import { Tick, Ticker } from '../ticker';

// A rectangular portal which renders the view looking through another
// sibling portal.

export class Portal extends THREE.Mesh implements Ticker {
  private bottomLeftCorner = new THREE.Vector3();
  private bottomRightCorner = new THREE.Vector3();
  private topLeftCorner = new THREE.Vector3();
  private reflectedPosition = new THREE.Vector3();

  private portalTexture: THREE.WebGLRenderTarget;
  private portalCamera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 500.0);

  constructor(private width: number, private height: number) {
    const planeGeo = new THREE.PlaneGeometry(width, height);
    const portalTexture = new THREE.WebGLRenderTarget(512, 1024);
    super(planeGeo, new THREE.MeshBasicMaterial({
      map: portalTexture.texture
      // color: '#0ff'
    }));
    this.portalTexture = portalTexture;
  }

  render(sibling: Portal, camera: THREE.Camera, renderer: THREE.WebGLRenderer,
    scene: THREE.Object3D) {
    // set the portal camera position to be reflected about the portal plane
    this.worldToLocal(this.reflectedPosition.copy(camera.position));
    this.reflectedPosition.x *= - 1.0; this.reflectedPosition.z *= - 1.0;
    sibling.localToWorld(this.reflectedPosition);
    this.portalCamera.position.copy(this.reflectedPosition);

    // grab the corners of the other portal
    // - note: the portal is viewed backwards; flip the left/right coordinates
    sibling.localToWorld(this.bottomLeftCorner.set(
      sibling.width / 2, - sibling.height / 2, 0.0));
    sibling.localToWorld(this.bottomRightCorner.set(
      -sibling.width / 2, -sibling.height / 2, 0.0));
    sibling.localToWorld(this.topLeftCorner.set(
      sibling.width / 2, sibling.height / 2, 0.0));
    // set the projection matrix to encompass the portal's frame
    (CameraUtils as any).frameCorners(this.portalCamera, this.bottomLeftCorner,
      this.bottomRightCorner, this.topLeftCorner, false);

    // render the portal
    this.portalTexture.texture.encoding = renderer.outputEncoding;
    renderer.setRenderTarget(this.portalTexture);
    renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    if (renderer.autoClear === false) renderer.clear();
    this.visible = false; // hide this portal from its own rendering
    renderer.render(scene, this.portalCamera);
    this.visible = true; // re-enable this portal's visibility for general rendering
  }

  private normalDirection = new THREE.Vector3();
  private worldPosition = new THREE.Vector3();
  private previousSide = new Map<PhysicsObject, number>();

  private tmp = new THREE.Vector3();
  private side(position: THREE.Vector3) {
    this.tmp.copy(position);
    this.tmp.sub(this.worldPosition);
    const dot = this.normalDirection.dot(this.tmp);
    return Math.sign(dot);
  }

  private tmp2 = new THREE.Vector3();
  private tmpQ = new THREE.Quaternion();
  private otherWorldPosition = new THREE.Vector3();
  private newWorldPosition = new THREE.Vector3();
  updatePosition(o: PhysicsObject, sibling: Portal) {
    o.getWorldPosition(this.otherWorldPosition);
    const currentSide = this.side(this.otherWorldPosition);
    if (this.previousSide.has(o)) {
      const previousSide = this.previousSide.get(o);
      if (currentSide < 0 && previousSide >= 0) {
        // TODO check height and width

        // Mirror to other portal
        this.tmpQ.setFromUnitVectors(this.normalDirection, sibling.normalDirection);
        this.tmp2.copy(this.worldPosition);  // Now tmp2 has the relative position to this portal.
        this.tmp2.sub(this.otherWorldPosition);
        this.tmp2.applyQuaternion(this.tmpQ);  // Now relative position to sibling portal
        // TODO: Apply scale

        this.newWorldPosition.copy(sibling.worldPosition);
        this.newWorldPosition.add(this.tmp2);
        o.quaternion.multiply(this.tmpQ);  // Rotate based on portal positioning
        o.position.copy(this.newWorldPosition);
        o.worldToLocal(o.position);
        o.setPhysicsPosition();
        const siblingSide = sibling.side(this.newWorldPosition);
        sibling.previousSide.set(o, siblingSide);
        console.log(`Zoop: ${siblingSide}`);
      }
    }
    this.previousSide.set(o, currentSide);
  }

  tick(t: Tick) {
    this.getWorldPosition(this.worldPosition);
    this.getWorldDirection(this.normalDirection);
  }

}