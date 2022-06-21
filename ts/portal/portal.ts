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
  private previousSide = new Map<THREE.Object3D, number>();

  private tmp = new THREE.Vector3();
  private side(position: THREE.Vector3) {
    this.tmp.copy(position);
    this.tmp.sub(this.worldPosition);
    const dot = this.normalDirection.dot(this.tmp);
    return Math.sign(dot);
  }

  private tmpNormal = new THREE.Vector3();
  private oldOffset = new THREE.Vector3();
  private newOffset = new THREE.Vector3();
  private transitTranslation = new THREE.Vector3();
  private transitRotation = new THREE.Quaternion();
  private transitScale = new THREE.Vector3();
  private otherWorldPosition = new THREE.Vector3();
  private newWorldPosition = new THREE.Vector3();

  // Sets the Matrix4 with the portal transforms. Returns false if this
  // object did not transit through a portal.
  updatePosition(o: THREE.Object3D, sibling: Portal,
    portalTransform: THREE.Matrix4): boolean {
    let moved = false;
    o.getWorldPosition(this.otherWorldPosition);
    const currentSide = this.side(this.otherWorldPosition);
    if (currentSide === 0) {
      // On the edge of the portal. Just ignore this frame.
      portalTransform.identity();
      return false;
    }
    if (this.previousSide.has(o)) {
      const previousSide = this.previousSide.get(o);
      if (currentSide < 0 && previousSide >= 0) {
        // TODO check height and width

        // Mirror to other portal
        this.tmpNormal.copy(this.normalDirection);
        this.tmpNormal.multiplyScalar(-1);
        this.transitRotation.setFromUnitVectors(this.tmpNormal, sibling.normalDirection);
        const scaleFactor = sibling.width / this.width;
        this.transitScale.set(scaleFactor, scaleFactor, scaleFactor);

        this.oldOffset.copy(this.otherWorldPosition);
        this.oldOffset.sub(this.worldPosition);
        this.newOffset.copy(this.oldOffset);
        this.newOffset.applyQuaternion(this.transitRotation);
        this.newOffset.multiplyScalar(scaleFactor);
        // Now add the portal to portal translation
        this.transitTranslation.copy(sibling.worldPosition);
        this.transitTranslation.sub(this.worldPosition);
        this.transitTranslation.sub(this.oldOffset);
        this.transitTranslation.add(this.newOffset);
        portalTransform.compose(
          this.transitTranslation, this.transitRotation, this.transitScale);
        moved = true;
        const siblingSide = sibling.side(this.newWorldPosition);
        sibling.previousSide.set(o, siblingSide);
        console.log(`Zoop: ${siblingSide}`);
      }
    }
    if (!moved) {
      portalTransform.identity();
    }
    this.previousSide.set(o, currentSide);
    return moved;
  }

  tick(t: Tick) {
    this.getWorldPosition(this.worldPosition);
    this.getWorldDirection(this.normalDirection);
  }

}