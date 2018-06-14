/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// remaps opacity from 0 to 1
const opacityRemap = mat => {
  if (mat.opacity === 0) {
    mat.opacity = 1;
  }
};

/**
 * The Reticle class creates an object that repeatedly calls
 * `xrSession.requestHitTest()` to render a ring along a found
 * horizontal surface.
 */
class Reticle extends THREE.Object3D {
  /**
   * @param {XRSession} xrSession
   * @param {THREE.Camera} camera
   */
  constructor(xrSession, camera) {
    super();

    this.loader = new THREE.TextureLoader();

    let geometry = new THREE.RingGeometry(0.1, 0.11, 24, 1);
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    // Orient the geometry so its position is flat on a horizontal surface
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));

    this.ring = new THREE.Mesh(geometry, material);

    geometry = new THREE.PlaneBufferGeometry(0.15, 0.15);
    // Orient the geometry so its position is flat on a horizontal surface,
    // as well as rotate the image so the anchor is facing the user
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(-90)));
    geometry.applyMatrix(new THREE.Matrix4().makeRotationY(THREE.Math.degToRad(0)));
    material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });
    this.icon = new THREE.Mesh(geometry, material);

    // Load the anchor texture and apply it to our material
    // once loaded
    this.loader.load('../common/Anchor.png', texture => {
      this.icon.material.opacity = 1;
      this.icon.material.map = texture;
    });

    this.add(this.ring);
    this.add(this.icon);

    this.session = xrSession;
    this.visible = false;
    this.camera = camera;
  }

  /**
   * Fires a hit test in the middle of the screen and places the reticle
   * upon the surface if found.
   *
   * @param {XRCoordinateSystem} frameOfRef
   */
  async update(frameOfRef) {
    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera({
      x: 0,
      y: 0
    }, this.camera);
    const ray = this.raycaster.ray;

    const origin = new Float32Array(ray.origin.toArray());
    const direction = new Float32Array(ray.direction.toArray());
    

    try {
      const hits = await this.session.requestHitTest(origin,
        direction,
        frameOfRef);
      if (hits.length) {
        const hit = hits[0];
        const hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);
  
        // Now apply the position from the hitMatrix onto our model
        this.position.setFromMatrixPosition(hitMatrix);
  
        DemoUtils.lookAtOnY(this, this.camera);
  
        this.visible = true;
      }
    } catch(e) {
      console.log(e)
    }
    
  }
}

window.DemoUtils = {
  /**
   * Creates a THREE.Scene containing lights that case shadows,
   * and a mesh that will receive shadows.
   *
   * @return {THREE.Scene}
   */
  createLitScene() {
    const scene = new THREE.Scene();

    // The materials will render as a black mesh
    // without lights in our scenes. Let's add an ambient light
    // so our material can be visible, as well as a directional light
    // for the shadow.
    const light = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);

    // We want this light to cast shadow.
    directionalLight.castShadow = true;

    // Make a large plane to receive our shadows
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    // Rotate our plane to be parallel to the floor
    planeGeometry.rotateX(-Math.PI / 2);

    // Create a mesh with a shadow material, resulting in a mesh
    // that only renders shadows once we flip the `receiveShadow` property.
    const shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
      color: 0x111111,
      opacity: 0.2,
    }));

    // Give it a name so we can reference it later, and set `receiveShadow`
    // to true so that it can render our model's shadow.
    shadowMesh.name = 'shadowMesh';
    shadowMesh.receiveShadow = true;
    shadowMesh.position.y = 10000;

    // Add lights and shadow material to scene.
    scene.add(shadowMesh);
    scene.add(light);
    scene.add(directionalLight);

    return scene;
  },

  loadGltfModel(url) {
    const gltfLoader = new THREE.GLTFLoader();

    return new Promise((resolve, reject) => {
      gltfLoader.load(url, function (data) {

        gltf = data;

        let object = gltf.scene;

        let animations = gltf.animations;

					if ( animations && animations.length ) {

						mixer = new THREE.AnimationMixer( object );

						for ( let i = 0; i < animations.length; i ++ ) {

							let animation = animations[ i ];

							animation.duration = 3;

							mixer.clipAction( animation ).play();

						}

					}

        resolve(gltf.scene);
      }, undefined, function (error) {

        console.error(error);
        reject(error);

      });
    });
  },

  /**
   * Similar to THREE.Object3D's `lookAt` function, except we only
   * want to rotate on the Y axis. In our AR use case, we don't want
   * our model rotating in all axes, instead just on the Y.
   *
   * @param {THREE.Object3D} looker
   * @param {THREE.Object3D} target
   */
  lookAtOnY(looker, target) {
    const targetPos = new THREE.Vector3().setFromMatrixPosition(target.matrixWorld);

    const angle = Math.atan2(targetPos.x - looker.position.x,
      targetPos.z - looker.position.z);
    looker.rotation.set(0, angle, 0);
  }
};