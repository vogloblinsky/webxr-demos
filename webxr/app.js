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

const clock = new THREE.Clock();
let mixer = null; // updated in utils.js

let selectedModel;

const modelScale = 0.25;

let clearScene = () => {
    window.app.clearScene();
};

// Create an audio context
const audioCtx = new AudioContext();

let ModelPlaybackRate = 0;

let listenMicrophone = false;

let data = new Uint8Array(2);
const analyserNode = new AnalyserNode(audioCtx, {
    fftSize: 256, // default value : 2048
    maxDecibels: -10, // default value : -30
    minDecibels: -90, // default value : -100
    smoothingTimeConstant: 0.9 // default value : 0.8
});

function getAnalyserData() {
    requestAnimationFrame(getAnalyserData);
    analyserNode.getByteFrequencyData(data);
    console.log(data[0]);
    let currentLevel = data[0];
    if (currentLevel > 75) {
        ModelPlaybackRate = 1;
    } else if (currentLevel >= 50 && currentLevel <= 75) {
        ModelPlaybackRate = 0.5;
    } else if (currentLevel >= 25 && currentLevel < 50) {
        ModelPlaybackRate = 0.25;
    } else {
        ModelPlaybackRate = 0;
    }
}

function getStreamData() {
    return navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(stream => audioCtx.createMediaStreamSource(stream))
        .then(source => {
            source.connect(analyserNode);
        });
}

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */
class App {
    constructor() {
        this.onXRFrame = this.onXRFrame.bind(this);
        this.onEnterAR = this.onEnterAR.bind(this);

        this.init();

        document.addEventListener('DOMContentLoaded', () => {
            document
                .querySelector('body')
                .addEventListener('modelSelected', e => {
                    selectedModel = e.detail.model;
                    document.querySelector('#info').style.display = 'block';
                    this.addElementOnScene();
                });
        });
    }

    clearScene() {}

    addElementOnScene() {
        DemoUtils.loadGltfModel(
            `../3d-models/${selectedModel.id}/scene.gltf`
        ).then(model => {
            if (this.model) {
                this.scene.remove(this.model);
            }
            this.model = model;
            this.model.scale.set(modelScale, modelScale, modelScale);
        });
    }

    /**
     * Fetches the XRDevice, if available.
     */
    async init() {
        // The entry point of the WebXR Device API is on `navigator.xr`.
        // We also want to ensure that `XRSession` has `requestHitTestSource`,
        // indicating that the #webxr-hit-test flag is enabled.
        if (navigator.xr && XRSession.prototype.requestHitTestSource) {
            console.log(
                'navigator.xr && XRSession.prototype.requestHitTestSource ok'
            );
            navigator.xr.isSessionSupported('immersive-ar').then(
                () => {
                    console.log('supportsSession immersive-ar ok');
                },
                () => {
                    this.onNoXRDevice();
                }
            );
        } else {
            // If `navigator.xr` or `XRSession.prototype.requestHitTest`
            // does not exist, we must display a message indicating there
            // are no valid devices.
            this.onNoXRDevice();
            return;
        }

        // We found an XRDevice! Bind a click listener on our "Enter AR" button
        // since the spec requires calling `device.requestSession()` within a
        // user gesture.
        document
            .querySelector('#enter-ar')
            .addEventListener('click', this.onEnterAR);
    }

    /**
     * Handle a click event on the '#enter-ar' button and attempt to
     * start an XRSession.
     */
    async onEnterAR() {
        // Now that we have an XRDevice, and are responding to a user
        // gesture, we must create an XRPresentationContext on a
        // canvas element.
        const outputCanvas = document.createElement('canvas');

        // sound demo purpose
        // start audio analysis
        audioCtx.resume();
        getStreamData().then(getAnalyserData);

        // requestSession with { optionalFeatures: ['dom-overlay-for-handheld-ar'] }, breaks XRInputs

        // Request a session
        navigator.xr
            .requestSession('immersive-ar')
            .then(xrSession => {
                this.session = xrSession;
                console.log('requestSession immersive-ar ok');
                xrSession.addEventListener(
                    'end',
                    this.onXRSessionEnded.bind(this)
                );
                // If `requestSession` is successful, add the canvas to the
                // DOM since we know it will now be used.
                document.body.appendChild(outputCanvas);
                // Do necessary session setup here.
                this.onSessionStarted();
            })
            .catch(error => {
                // "immersive-ar" sessions are not supported
                console.warn('requestSession immersive-ar error: ', error);
                this.onNoXRDevice();
            });
    }

    /**
     * Toggle on a class on the page to disable the "Enter AR"
     * button and display the unsupported browser message.
     */
    onNoXRDevice() {
        document.body.classList.add('unsupported');
    }

    onXRSessionEnded() {
        console.log('onXRSessionEnded');
        document.body.classList.remove('ar');
        document.body.classList.remove('stabilized');
        if (this.renderer) {
            this.renderer.vr.setSession(null);
            this.stabilized = false;
        }
        if (audioCtx) {
            audioCtx.close();
        }
    }

    /**
     * Called when the XRSession has begun. Here we set up our three.js
     * renderer, scene, and camera and attach our XRWebGLLayer to the
     * XRSession and kick off the render loop.
     */
    async onSessionStarted() {
        // Add the `ar` class to our body, which will hide our 2D components
        document.body.classList.add('ar');

        // To help with working with 3D on the web, we'll use three.js. Set up
        // the WebGLRenderer, which handles rendering to our session's base layer.
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            preserveDrawingBuffer: true
        });
        this.renderer.autoClear = false;

        this.gl = this.renderer.getContext();

        this.renderer.vr.enabled = true;

        this.XRReferenceSpaceType = 'local';

        this.renderer.vr.setReferenceSpaceType(this.XRReferenceSpaceType);
        this.renderer.vr.setSession(this.session);

        // Set our session's baseLayer to an XRWebGLLayer
        // using our new renderer's context
        this.session.baseLayer = new XRWebGLLayer(this.session, this.gl);

        // A THREE.Scene contains the scene graph for all objects in the
        // render scene. Call our utility which gives us a THREE.Scene
        // with a few lights and meshes already in the scene.
        this.scene = DemoUtils.createLitScene();

        // Current spec doesn't allow to touch and display DOM overlay on top of WebXR content
        // dispatch event for demo

        var event = new CustomEvent('modelSelected', {
            detail: {
                model: {
                    name: 'Dancing stormtrooper',
                    price: 0,
                    id: 'stormtrooper',
                    author: 'StrykerDoesAnimation',
                    scaleARjs: 0.75,
                    scaleAframear: 0.3,
                    animated: true,
                    sketchfabid: '12bd08d66fe04a84be446e583d6663ac'
                }
            },
            bubbles: true,
            cancelable: true
        });
        document.querySelector('body').dispatchEvent(event);

        // We'll update the camera matrices directly from API, so
        // disable matrix auto updates so three.js doesn't attempt
        // to handle the matrices independently.
        this.camera = new THREE.PerspectiveCamera();
        this.camera.matrixAutoUpdate = false;

        // Add a Reticle object, which will help us find surfaces by drawing
        // a ring shape onto found surfaces. See source code
        // of Reticle in shared/utils.js for more details.
        this.reticle = new Reticle(this.camera);
        this.scene.add(this.reticle);

        this.frameOfRef = await this.session.requestReferenceSpace('local');

        this.tick();
    }

    tick() {
        this.rafId = this.session.requestAnimationFrame(this.onXRFrame);
    }

    /**
     * Called on the XRSession's requestAnimationFrame.
     * Called with the time and XRPresentationFrame.
     */
    onXRFrame(time, frame) {
        const { session } = frame;

        const pose =
            'getDevicePose' in frame
                ? frame.getDevicePose(this.frameOfRef)
                : frame.getViewerPose(this.frameOfRef);

        // Queue up the next frame
        this.tick();

        if (pose == null) {
            return;
        }

        if (mixer) {
            let delta = clock.getDelta();
            mixer.timeScale = ModelPlaybackRate; // very slow : 0.1; slow : 0.5; normal : 1;
            mixer.update(delta);
        }

        for (const view of frame.getViewerPose(this.frameOfRef).views) {
            const viewport = session.renderState.baseLayer.getViewport(view);
            this.renderer.setViewport(
                viewport.x,
                viewport.y,
                viewport.width,
                viewport.height
            );
            this.camera.projectionMatrix.fromArray(view.projectionMatrix);
            const viewMatrix = new THREE.Matrix4().fromArray(
                view.transform.inverse.matrix
            );

            this.camera.matrix.getInverse(viewMatrix);
            this.camera.updateMatrixWorld(true);

            // NOTE: Updating input or the reticle is dependent on the camera's
            // pose, hence updating these elements after camera update but
            // before render.
            this.reticle.update(this.session, this.frameOfRef);
            this.processXRInput(frame);

            // NOTE: Clearing depth caused issues on Samsung devices
            // @see https://github.com/googlecodelabs/ar-with-webxr/issues/8
            // this.renderer.clearDepth();
            this.renderer.render(this.scene, this.camera);
        }

        // If the reticle has found a hit (is visible) and we have
        // not yet marked our app as stabilized, do so
        if (this.reticle.visible && !this.stabilized) {
            this.stabilized = true;
            document.body.classList.add('stabilized');
        }
    }

    processXRInput(frame) {
        const { session } = frame;

        const sources = Array.from(session.inputSources).filter(
            input => input.targetRayMode === 'screen'
        );

        if (sources.length === 0) {
            return;
        }

        const pose = frame.getPose(sources[0].targetRaySpace, this.frameOfRef);
        if (pose) {
            this.placeModel();
        }
    }

    async placeModel() {
        // The requestHitTest function takes an x and y coordinate in
        // Normalized Device Coordinates, where the upper left is (-1, 1)
        // and the bottom right is (1, -1). This makes (0, 0) our center.
        const x = 0;
        const y = 0;

        if (this.session == null) {
            return;
        }
        this.raycaster = this.raycaster || new THREE.Raycaster();
        this.raycaster.setFromCamera(
            {
                x,
                y
            },
            this.camera
        );
        const ray = this.raycaster.ray;
        let xrray = new XRRay(ray.origin, ray.direction);

        let hits;
        try {
            hits = await this.session.requestHitTest(xrray, this.frameOfRef);
        } catch (e) {
            // Spec says this should no longer throw on invalid requests:
            // https://github.com/immersive-web/hit-test/issues/24
            // But in practice, it will still happen, so just ignore:
            // https://github.com/immersive-web/hit-test/issues/37
            console.log(e);
        }

        if (hits && hits.length) {
            const presentedScene = this.scene;
            // We can have multiple collisions per hit test. Let's just take the
            // first hit, the nearest, for now.
            const hit = hits[0];

            // Our XRHitResult object has one property, `hitMatrix`, a
            // Float32Array(16) representing a 4x4 Matrix encoding position where
            // the ray hit an object, and the orientation has a Y-axis that corresponds
            // with the normal of the object at that location.
            // Turn this matrix into a THREE.Matrix4().
            const hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);

            // Now apply the position from the hitMatrix onto our model.
            this.model.position.setFromMatrixPosition(hitMatrix);

            // Ensure our model has been added to the scene.
            this.scene.add(this.model);

            // Orient the dolly/model to face the camera
            const camPosition = new THREE.Vector3().setFromMatrixPosition(
                this.camera.matrix
            );
            this.model.lookAt(
                camPosition.x,
                this.model.position.y,
                camPosition.z
            );
            if (presentedScene.pivot) {
                this.model.rotateY(-presentedScene.pivot.rotation.y);
            }
        }
    }
}

window.app = new App();
