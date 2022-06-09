import * as THREE from 'three';
import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils.js';

// A rectangular portal which renders the view looking through another
// sibling portal.

export class Portal extends THREE.Mesh {
  private bottomLeftCorner = new THREE.Vector3();
  private bottomRightCorner = new THREE.Vector3();
  private topLeftCorner = new THREE.Vector3();
  private reflectedPosition = new THREE.Vector3();

  private portalTexture: THREE.WebGLRenderTarget;
  private portalCamera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 500.0);

  constructor(private width: number, private height: number) {
    const planeGeo = new THREE.PlaneGeometry(width, height);
    const portalTexture = new THREE.WebGLRenderTarget(256, 1024);
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
}