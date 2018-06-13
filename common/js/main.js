let addButton;
let copyright;
let modal;
let modalBackground;
let MODELS;

document.addEventListener('DOMContentLoaded', function() {
    registerUI();
    registerListeners();
    loadModelsData();
});

let registerUI = () => {
    addButton = document.querySelector('footer .add-button');
    modal = document.querySelector('.modal');
    modalBackground = document.querySelector('.modal .background');
    copyright = document.querySelector('#info');
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
        productPic.setAttribute('src', `../3d-models/${model.id}/pic.png`);
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
            clearScene();
            
            let modelIndex = e.currentTarget.getAttribute('data-index');
            selectedModel = MODELS[modelIndex];
            
            var event = new CustomEvent(
                'modelSelected', 
                {
                    detail: {
                        model: selectedModel
                    },
                    bubbles: true,
                    cancelable: true
                }
            );
            document.querySelector('body').dispatchEvent(event);
            
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

let updateCopyright = (model) => {
    copyright.style.display = 'block';
    let links = copyright.querySelectorAll('a');
    links[0].setAttribute('href', `https://sketchfab.com/models/${model.sketchfabid}`);
    links[1].innerHTML = model.author;
}