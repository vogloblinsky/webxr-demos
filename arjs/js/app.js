let aframeScene;
let selectedModel;

document.addEventListener('DOMContentLoaded', function() {
    aframeScene = document.querySelector('a-scene');
    document.querySelector('body').addEventListener('modelSelected', (e) => {
        selectedModel = e.detail.model;
        clearScene();
        addElementOnScene();
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

    assets.addEventListener('loaded', () => {
        let model = document.createElement('a-gltf-model');
        model.setAttribute('src', `#${selectedModel.id}`);
        model.setAttribute('position', '0 0 0');
        if (typeof selectedModel.animated !== 'undefined') {
            model.setAttribute('animation-mixer', null);
        }
        model.setAttribute('scale', `${selectedModel.scale} ${selectedModel.scale} ${selectedModel.scale}`);
        aframeScene.prepend(model);
        updateCopyright(selectedModel);
    });

    aframeScene.prepend(assets);
}