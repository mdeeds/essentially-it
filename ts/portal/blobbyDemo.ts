import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils.js';


export class BlobbyDemo {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private smallSphereOne: THREE.Object3D;
  private smallSphereTwo: THREE.Object3D;

  private portalCamera: THREE.Camera;
  private leftPortal: THREE.Object3D;
  private rightPortal: THREE.Object3D;
  private leftPortalTexture: THREE.WebGLRenderTarget;
  private reflectedPosition: THREE.Vector3;
  private rightPortalTexture: THREE.WebGLRenderTarget;
  private bottomLeftCorner: THREE.Vector3;
  private bottomRightCorner: THREE.Vector3;
  private topLeftCorner: THREE.Vector3;

  constructor() {
    this.init();
    this.animate();
  }

  init() {
    console.log('Init');
    const container = document.body;

    // renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;

    this.renderer.setAnimationLoop(() => { this.animate() });

    container.appendChild(this.renderer.domElement);
    container.appendChild(VRButton.createButton(this.renderer));

    // renderer.localClippingEnabled = true;

    // scene
    this.scene = new THREE.Scene();
    this.scene.position.set(0, -15, -50);

    // camera
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    this.camera.position.set(0, 1.3, 0);

    //

    const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);

    // bouncing icosphere
    const portalPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.0);
    const geometry = new THREE.IcosahedronGeometry(5, 0);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff, emissive: 0x333333, flatShading: true,
      clippingPlanes: [portalPlane], clipShadows: true
    });
    this.smallSphereOne = new THREE.Mesh(geometry, material);
    this.scene.add(this.smallSphereOne);
    this.smallSphereTwo = new THREE.Mesh(geometry, material);
    this.scene.add(this.smallSphereTwo);

    // portals
    this.portalCamera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 500.0);
    this.scene.add(this.portalCamera);
    //frustumHelper = new THREE.CameraHelper( portalCamera );
    //scene.add( frustumHelper );
    this.bottomLeftCorner = new THREE.Vector3();
    this.bottomRightCorner = new THREE.Vector3();
    this.topLeftCorner = new THREE.Vector3();
    this.reflectedPosition = new THREE.Vector3();

    this.leftPortalTexture = new THREE.WebGLRenderTarget(256, 256);
    this.leftPortal = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
      map: this.leftPortalTexture.texture
    }));
    this.leftPortal.position.x = - 30;
    this.leftPortal.position.y = 20;
    this.leftPortal.scale.set(0.35, 0.35, 0.35);
    this.scene.add(this.leftPortal);

    this.rightPortalTexture = new THREE.WebGLRenderTarget(256, 256);
    this.rightPortal = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
      map: this.rightPortalTexture.texture
    }));
    this.rightPortal.position.x = 30;
    this.rightPortal.position.y = 20;
    this.rightPortal.scale.set(0.35, 0.35, 0.35);
    this.scene.add(this.rightPortal);

    // walls
    const planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#fef' }));
    planeTop.position.y = 100;
    planeTop.rotateX(Math.PI / 2);
    this.scene.add(planeTop);

    const planeBottom = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#fef' }));
    planeBottom.rotateX(- Math.PI / 2);
    this.scene.add(planeBottom);

    const planeFront = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#88f' }));
    planeFront.position.z = 50;
    planeFront.position.y = 50;
    planeFront.rotateY(Math.PI);
    this.scene.add(planeFront);

    const planeBack = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#8f8' }));
    planeBack.position.z = - 50;
    planeBack.position.y = 50;
    //planeBack.rotateY( Math.PI );
    this.scene.add(planeBack);

    const planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#808' }));
    planeRight.position.x = 50;
    planeRight.position.y = 50;
    planeRight.rotateY(- Math.PI / 2);
    this.scene.add(planeRight);

    const planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: '#088' }));
    planeLeft.position.x = - 50;
    planeLeft.position.y = 50;
    planeLeft.rotateY(Math.PI / 2);
    this.scene.add(planeLeft);

    // lights
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
    mainLight.position.y = 60;
    this.scene.add(mainLight);

    const greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
    greenLight.position.set(550, 50, 0);
    this.scene.add(greenLight);

    const redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
    redLight.position.set(- 550, 50, 0);
    this.scene.add(redLight);

    const blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
    blueLight.position.set(0, 50, 550);
    this.scene.add(blueLight);

    window.addEventListener('resize', () => { this.onWindowResize(); });

  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  renderPortal(thisPortalMesh, otherPortalMesh, thisPortalTexture) {

    // set the portal camera position to be reflected about the portal plane
    thisPortalMesh.worldToLocal(this.reflectedPosition.copy(this.camera.position));
    this.reflectedPosition.x *= - 1.0; this.reflectedPosition.z *= - 1.0;
    otherPortalMesh.localToWorld(this.reflectedPosition);
    this.portalCamera.position.copy(this.reflectedPosition);

    // grab the corners of the other portal
    // - note: the portal is viewed backwards; flip the left/right coordinates
    otherPortalMesh.localToWorld(this.bottomLeftCorner.set(50.05, - 50.05, 0.0));
    otherPortalMesh.localToWorld(this.bottomRightCorner.set(- 50.05, - 50.05, 0.0));
    otherPortalMesh.localToWorld(this.topLeftCorner.set(50.05, 50.05, 0.0));
    // set the projection matrix to encompass the portal's frame
    (CameraUtils as any).frameCorners(this.portalCamera, this.bottomLeftCorner,
      this.bottomRightCorner, this.topLeftCorner, false);

    // render the portal
    thisPortalTexture.texture.encoding = this.renderer.outputEncoding;
    this.renderer.setRenderTarget(thisPortalTexture);
    this.renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897
    if (this.renderer.autoClear === false) this.renderer.clear();
    thisPortalMesh.visible = false; // hide this portal from its own rendering
    this.renderer.render(this.scene, this.portalCamera);
    thisPortalMesh.visible = true; // re-enable this portal's visibility for general rendering

  }

  animate() {
    // move the bouncing sphere(s)
    const timerOne = Date.now() * 0.01;
    const timerTwo = timerOne + Math.PI * 10.0;

    this.smallSphereOne.position.set(
      Math.cos(timerOne * 0.1) * 30,
      Math.abs(Math.cos(timerOne * 0.2)) * 20 + 5,
      Math.sin(timerOne * 0.1) * 30
    );
    this.smallSphereOne.rotation.y = (Math.PI / 2) - timerOne * 0.1;
    this.smallSphereOne.rotation.z = timerOne * 0.8;

    this.smallSphereTwo.position.set(
      Math.cos(timerTwo * 0.1) * 30,
      Math.abs(Math.cos(timerTwo * 0.2)) * 20 + 5,
      Math.sin(timerTwo * 0.1) * 30
    );
    this.smallSphereTwo.rotation.y = (Math.PI / 2) - timerTwo * 0.1;
    this.smallSphereTwo.rotation.z = timerTwo * 0.8;

    // save the original camera properties
    const currentRenderTarget = this.renderer.getRenderTarget();
    const currentXrEnabled = this.renderer.xr.enabled;
    const currentShadowAutoUpdate = this.renderer.shadowMap.autoUpdate;
    this.renderer.xr.enabled = false; // Avoid camera modification
    this.renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    // render the portal effect
    this.renderPortal(this.leftPortal, this.rightPortal, this.leftPortalTexture);
    this.renderPortal(this.rightPortal, this.leftPortal, this.rightPortalTexture);

    // restore the original rendering properties
    this.renderer.xr.enabled = currentXrEnabled;
    this.renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
    this.renderer.setRenderTarget(currentRenderTarget);

    // render the main scene
    this.renderer.render(this.scene, this.camera);

  }

}