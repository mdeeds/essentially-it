import * as THREE from 'three';

export class PortalPanel extends THREE.Mesh {
  static makePanelMaterial(): THREE.Material {
    return new THREE.MeshBasicMaterial({ color: '#bbb' });
  }

  constructor() {
    super(new THREE.PlaneGeometry(2.0, 2.0),
      PortalPanel.makePanelMaterial());
  }
}