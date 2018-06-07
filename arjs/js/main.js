let addButton;
let modal;
let modalBackground;
let aframeScene;
let MODELS;
let selectedModel;

document.addEventListener('DOMContentLoaded', function() {
    registerUI();
    registerListeners();
    loadModelsData();
});

let registerUI = () => {
    addButton = document.querySelector('footer .add-button');
    modal = document.querySelector('.modal');
    modalBackground = document.querySelector('.modal .background');
    aframeScene = document.querySelector('a-scene');
}

let registerListeners = () => {
    modalBackground.addEventListener('click', () => {
        hideModal();
    });
    addButton.addEventListener('click', () => {
        showModal();
    });
}

let loadModelsData = () => {
    fetch('../3d-models/models.json')
        .then(response => response.json())
        .then(data => {
            MODELS = data;
            console.log(MODELS);
            renderModelsPreview();
        });
}

let renderModelsPreview = () => {
    let productsContainer = document.querySelector('.products');

    MODELS.forEach((model, index) => {
        let productPreview = document.createElement('div');
        productPreview.classList.add('product');
        productPreview.setAttribute('data-index', index);
        let productPic = document.createElement('img');
        productPic.setAttribute('src', `../3d-models/sketchfab-${model.id}/pic.png`);
        productPreview.appendChild(productPic);
        let productName = document.createElement('span');
        productName.classList.add('name');
        productName.innerText = model.name.toUpperCase();
        productPreview.appendChild(productName);
        let productPrice = document.createElement('span');
        productPrice.classList.add('price');
        productPrice.innerHTML = model.price + '&euro;';
        productPreview.appendChild(productPrice);
        productsContainer.appendChild(productPreview);

        productPreview.addEventListener('click', (e) => {
            addElementOnScene(e);
            hideModal();
        })
    });
}

let hideModal = () => {
    document.querySelector('.modal').classList.remove('show');
    document.querySelector('.modal').classList.add('hide');
}

let showModal = () => {
    document.querySelector('.modal').classList.remove('hide');
    document.querySelector('.modal').classList.add('show');
}

let addElementOnScene = (e) => {
    let modelIndex = e.currentTarget.getAttribute('data-index');
    selectedModel = MODELS[modelIndex];

    let assets = document.createElement('a-assets');
    let asset = document.createElement('a-asset-item');
    asset.setAttribute('id', selectedModel.id);
    asset.setAttribute('src', `../3d-models/sketchfab-${selectedModel.id}/scene.gltf`);
    assets.appendChild(asset);

    assets.addEventListener('loaded', () => {
        console.log('loaded');
        let model = document.createElement('a-gltf-model');
        model.setAttribute('src', `#${selectedModel.id}`);
        model.setAttribute('position', '0 0 0');
        if (typeof selectedModel.animated !== 'undefined') {
            model.setAttribute('animation-mixer', null);
        }
        model.setAttribute('scale', `${selectedModel.scale} ${selectedModel.scale} ${selectedModel.scale}`);
        aframeScene.prepend(model);
    });

    aframeScene.prepend(assets);
}