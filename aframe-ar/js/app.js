let aframeScene;
let selectedModel;
let hidePlanes = false;

document.addEventListener('DOMContentLoaded', function() {
    aframeScene = document.querySelector('a-scene');
    document.querySelector('body').addEventListener('modelSelected', (e) => {
        selectedModel = e.detail.model;
        clearScene();
        addElementOnScene();
    });

    document.querySelector('body').addEventListener('modalOpened', () => {
        hidePlanes = true;
    });
});

let clearScene = () => {
    let agltfmodel = aframeScene.querySelector('a-gltf-model');
    if (agltfmodel) {
        aframeScene.removeChild(agltfmodel);
    }
    let aassetsmodel = aframeScene.querySelector('a-assets');
    if (aassetsmodel) {
        aframeScene.removeChild(aassetsmodel);
    }
}

let addElementOnScene = (data) => {
    let assets = document.createElement('a-assets');
    let asset = document.createElement('a-asset-item');
    asset.setAttribute('id', selectedModel.id);
    asset.setAttribute('src', `../3d-models/${selectedModel.id}/scene.gltf`);
    assets.appendChild(asset);
    aframeScene.prepend(assets);
}