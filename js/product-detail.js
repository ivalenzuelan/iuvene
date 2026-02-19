let products = [];
let currentProduct = null;
let productImages = [];
let currentImageIndex = 0;

let keydownHandler = null;
let touchStartHandler = null;
let touchEndHandler = null;

function toText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeProductId(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const num = Number(raw);
    return Number.isFinite(num) ? num : raw;
}

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return normalizeProductId(params.get('id'));
}

function findProductById(productId) {
    if (productId == null) return null;

    const asString = String(productId);
    return products.find((product) => String(product.id) === asString) || null;
}

function formatPrice(product) {
    if (product.soldOut) return 'Agotado';
    if (product.price == null || Number.isNaN(Number(product.price))) return 'Precio bajo consulta';

    return `€${Number(product.price).toFixed(2).replace('.00', '')}`;
}

function showErrorMessage(message, redirectToHome = false) {
    const existing = document.querySelector('.error-message-floating');
    if (existing) existing.remove();

    const error = document.createElement('div');
    error.className = 'error-message error-message-floating';
    error.textContent = message;
    error.style.position = 'fixed';
    error.style.top = '100px';
    error.style.right = '20px';
    error.style.background = '#dc3545';
    error.style.color = '#fff';
    error.style.padding = '1rem 1.25rem';
    error.style.borderRadius = '8px';
    error.style.zIndex = '2000';

    document.body.appendChild(error);

    setTimeout(() => {
        error.remove();
        if (redirectToHome) {
            window.location.href = 'index.html';
        }
    }, 2600);
}

function preloadImages(images) {
    images.forEach((src) => {
        if (!src) return;
        const img = new Image();
        img.src = src;
    });
}

function updateMainImage() {
    const mainImage = document.getElementById('product-main-image');
    if (!mainImage) return;

    const imageSrc = productImages[currentImageIndex];
    if (!imageSrc) return;

    mainImage.style.opacity = '0.6';

    const testImage = new Image();
    testImage.onload = () => {
        mainImage.src = imageSrc;
        mainImage.alt = `${currentProduct?.name || 'Producto'} - imagen ${currentImageIndex + 1}`;
        mainImage.style.opacity = '1';
    };

    testImage.onerror = () => {
        mainImage.style.opacity = '1';
        console.warn('ProductDetail: failed to load image', imageSrc);
    };

    testImage.src = imageSrc;
}

function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');

    if (!prevButton || !nextButton) return;

    const atFirst = currentImageIndex <= 0;
    const atLast = currentImageIndex >= productImages.length - 1;

    prevButton.disabled = atFirst;
    nextButton.disabled = atLast;

    prevButton.style.opacity = atFirst ? '0.5' : '1';
    nextButton.style.opacity = atLast ? '0.5' : '1';
    prevButton.style.pointerEvents = atFirst ? 'none' : 'auto';
    nextButton.style.pointerEvents = atLast ? 'none' : 'auto';
}

function updateThumbnails() {
    document.querySelectorAll('.thumbnail').forEach((thumbnail, index) => {
        thumbnail.classList.toggle('active', index === currentImageIndex);
    });
}

function setImageIndex(index) {
    if (index < 0 || index >= productImages.length) return;
    currentImageIndex = index;
    updateMainImage();
    updateThumbnails();
    updateNavigationButtons();
}

function renderThumbnails() {
    const gallery = document.getElementById('thumbnail-gallery');
    if (!gallery) return;

    const fragment = document.createDocumentFragment();

    productImages.forEach((src, index) => {
        const thumbnail = document.createElement('button');
        thumbnail.type = 'button';
        thumbnail.className = `thumbnail${index === currentImageIndex ? ' active' : ''}`;
        thumbnail.setAttribute('aria-label', `Ver imagen ${index + 1}`);

        const image = document.createElement('img');
        image.src = src;
        image.alt = `Miniatura ${index + 1}`;
        image.loading = 'lazy';

        thumbnail.appendChild(image);
        thumbnail.addEventListener('click', () => setImageIndex(index));

        thumbnail.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            setImageIndex(index);
        });

        fragment.appendChild(thumbnail);
    });

    gallery.replaceChildren(fragment);
}

function bindGalleryButtons() {
    const previousButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');

    if (!previousButton || !nextButton) return;

    const newPrev = previousButton.cloneNode(true);
    const newNext = nextButton.cloneNode(true);

    previousButton.parentNode.replaceChild(newPrev, previousButton);
    nextButton.parentNode.replaceChild(newNext, nextButton);

    newPrev.addEventListener('click', (event) => {
        event.preventDefault();
        setImageIndex(currentImageIndex - 1);
    });

    newNext.addEventListener('click', (event) => {
        event.preventDefault();
        setImageIndex(currentImageIndex + 1);
    });
}

function bindKeyboardNavigation() {
    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler);
    }

    keydownHandler = (event) => {
        if (event.key === 'ArrowLeft') {
            if (currentImageIndex <= 0) return;
            event.preventDefault();
            setImageIndex(currentImageIndex - 1);
            return;
        }

        if (event.key === 'ArrowRight') {
            if (currentImageIndex >= productImages.length - 1) return;
            event.preventDefault();
            setImageIndex(currentImageIndex + 1);
        }
    };

    document.addEventListener('keydown', keydownHandler);
}

function bindTouchNavigation() {
    const mainImage = document.getElementById('product-main-image');
    if (!mainImage) return;

    if (touchStartHandler) {
        mainImage.removeEventListener('touchstart', touchStartHandler);
    }
    if (touchEndHandler) {
        mainImage.removeEventListener('touchend', touchEndHandler);
    }

    let startX = 0;
    let startY = 0;

    touchStartHandler = (event) => {
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
    };

    touchEndHandler = (event) => {
        const endX = event.changedTouches[0].clientX;
        const endY = event.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        if (Math.abs(deltaX) <= 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

        if (deltaX < 0) {
            setImageIndex(currentImageIndex + 1);
        } else {
            setImageIndex(currentImageIndex - 1);
        }
    };

    mainImage.addEventListener('touchstart', touchStartHandler, { passive: true });
    mainImage.addEventListener('touchend', touchEndHandler, { passive: true });
}

function setupImageGallery(product) {
    const imageCandidates = [];
    if (Array.isArray(product.images)) imageCandidates.push(...product.images);
    if (product.image) imageCandidates.unshift(product.image);

    productImages = Array.from(new Set(imageCandidates.filter(Boolean)));
    if (productImages.length === 0) {
        productImages = ['images/hero-background.jpg'];
    }

    currentImageIndex = 0;

    preloadImages(productImages);
    renderThumbnails();
    bindGalleryButtons();
    bindKeyboardNavigation();
    bindTouchNavigation();

    updateMainImage();
    updateNavigationButtons();
}

function updateMetaTags(product) {
    const materialText = toText(product.material, '');
    const description = materialText
        ? `${product.name} - ${materialText}. ${toText(product.description, 'Joyería artesanal diseñada en Madrid.')}`
        : `${product.name}. ${toText(product.description, 'Joyería artesanal diseñada en Madrid.')}`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    const ogTags = [
        ['og:title', `${product.name} - Iuvene`],
        ['og:description', description],
        ['og:image', new URL(product.image, window.location.href).href],
        ['og:url', window.location.href],
        ['og:type', 'product']
    ];

    ogTags.forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    });
}

function addStructuredData(product) {
    const scriptId = 'product-structured-data';

    let script = document.getElementById(scriptId);
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = scriptId;
        document.head.appendChild(script);
    }

    const schema = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: product.name,
        description: toText(product.description, 'Joyería artesanal diseñada en Madrid.'),
        image: new URL(product.image, window.location.href).href,
        brand: {
            '@type': 'Brand',
            name: 'Iuvene'
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'EUR',
            price: product.price ?? 0,
            availability: product.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
        }
    };

    script.textContent = JSON.stringify(schema);
}

function addBreadcrumb(product) {
    const productDetailSection = document.querySelector('.product-detail .container');
    if (!productDetailSection) return;

    const existing = productDetailSection.querySelector('.breadcrumb');
    if (existing) existing.remove();

    const nav = document.createElement('nav');
    nav.className = 'breadcrumb';

    const home = document.createElement('a');
    home.href = 'index.html';
    home.textContent = 'Inicio';

    const shop = document.createElement('a');
    shop.href = 'index.html#coleccion';
    shop.textContent = 'Productos';

    const separator1 = document.createElement('span');
    separator1.textContent = '›';

    const separator2 = document.createElement('span');
    separator2.textContent = '›';

    const current = document.createElement('span');
    current.textContent = product.name;

    nav.appendChild(home);
    nav.appendChild(separator1);
    nav.appendChild(shop);
    nav.appendChild(separator2);
    nav.appendChild(current);

    productDetailSection.insertBefore(nav, productDetailSection.firstChild);
}

function renderRelatedProducts(product) {
    const existing = document.querySelector('.related-products');
    if (existing) existing.remove();

    const productId = String(product.id);
    const related = products
        .filter((candidate) => String(candidate.id) !== productId)
        .filter((candidate) => candidate.collection === product.collection || candidate.type === product.type)
        .slice(0, 3);

    if (related.length === 0) return;

    const section = document.createElement('section');
    section.className = 'related-products';

    const container = document.createElement('div');
    container.className = 'container';

    const title = document.createElement('h3');
    title.textContent = 'Productos relacionados';

    const grid = document.createElement('div');
    grid.className = 'related-products-grid';

    related.forEach((relatedProduct) => {
        const card = document.createElement('article');
        card.className = 'related-product-card';
        card.tabIndex = 0;

        const img = document.createElement('img');
        img.src = relatedProduct.image;
        img.alt = relatedProduct.name;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'related-product-info';

        const name = document.createElement('div');
        name.className = 'related-product-name';
        name.textContent = relatedProduct.name;

        const relatedMaterial = toText(relatedProduct.material, '');
        if (relatedMaterial) {
            const material = document.createElement('div');
            material.className = 'related-product-material';
            material.textContent = relatedMaterial;
            info.appendChild(material);
        }

        info.appendChild(name);

        if (relatedProduct.price != null && !Number.isNaN(Number(relatedProduct.price))) {
            const price = document.createElement('div');
            price.className = 'related-product-price';
            price.textContent = `€${Number(relatedProduct.price).toFixed(2).replace('.00', '')}`;
            info.appendChild(price);
        }

        const navigate = () => {
            window.location.href = `product-detail.html?id=${encodeURIComponent(relatedProduct.id)}`;
        };

        card.addEventListener('click', navigate);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate();
            }
        });

        card.appendChild(img);
        card.appendChild(info);
        grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
    section.appendChild(container);

    const backSection = document.querySelector('.back-to-products');
    if (backSection && backSection.parentNode) {
        backSection.parentNode.insertBefore(section, backSection);
    }
}

function setupWhatsAppLink(product) {
    const link = document.getElementById('whatsapp-link');
    if (!link) return;

    const phoneNumber = link.dataset.phone || '34633479785';
    const messageParts = [`Hola, me interesa ${product.name}.`];
    const materialText = toText(product.material, '');
    if (materialText) {
        messageParts.push(`Material: ${materialText}`);
    }
    messageParts.push(`Precio: ${formatPrice(product)}`);
    messageParts.push('¿Podrías darme más información sobre disponibilidad y envío?');

    const message = messageParts.join('\n');

    link.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

function setupAddToCart(product) {
    const button = document.getElementById('add-to-cart-btn');
    if (!button) return;

    const clone = button.cloneNode(true);
    button.parentNode.replaceChild(clone, button);

    const addToCartButton = document.getElementById('add-to-cart-btn');
    if (!addToCartButton) return;

    if (product.soldOut) {
        addToCartButton.disabled = true;
        addToCartButton.textContent = 'Agotado';
        addToCartButton.style.opacity = '0.65';
        addToCartButton.style.cursor = 'not-allowed';
        return;
    }

    addToCartButton.disabled = false;
    addToCartButton.textContent = 'Añadir al Carrito';
    addToCartButton.style.opacity = '';
    addToCartButton.style.cursor = '';

    addToCartButton.addEventListener('click', () => {
        if (!window.cart) {
            showErrorMessage('El carrito no está disponible ahora mismo.');
            return;
        }

        window.cart.addItem(product, 1);
    });
}

function updateProductInfo(product) {
    const material = document.getElementById('product-material');
    const title = document.getElementById('product-title');
    const description = document.getElementById('product-description');
    const price = document.getElementById('product-price');

    if (material) {
        const materialText = toText(product.material, '');
        material.textContent = materialText;
        material.style.display = materialText ? '' : 'none';
    }
    if (title) title.textContent = product.name;
    if (description) description.textContent = toText(product.description, 'Joyería artesanal diseñada en Madrid.');

    if (price) {
        price.textContent = formatPrice(product);
        price.className = product.soldOut ? 'product-price sold-out' : 'product-price';
    }
}

function renderProduct(product) {
    currentProduct = product;
    document.title = `${product.name} | Iuvene`;

    updateProductInfo(product);
    updateMetaTags(product);
    addStructuredData(product);
    setupImageGallery(product);
    setupWhatsAppLink(product);
    setupAddToCart(product);
    addBreadcrumb(product);
    renderRelatedProducts(product);
}

async function loadProducts() {
    if (!window.productManager) {
        throw new Error('ProductManager no está disponible');
    }

    await window.productManager.init();
    products = window.productManager.getAllProducts();
}

async function initializeProductPage() {
    try {
        await loadProducts();

        console.log('ProductDetail: Products loaded:', products.length);

        const productId = getProductIdFromUrl();
        console.log('ProductDetail: Looking for ID:', productId);

        const product = findProductById(productId);

        if (!product) {
            console.error('ProductDetail: Product not found. Available IDs:', products.map(p => p.id));
            showErrorMessage('Producto no encontrado. Redirigiendo...', true);
            return;
        }

        console.log('ProductDetail: Rendering product:', product);
        renderProduct(product);
    } catch (error) {
        console.error('ProductDetail: failed to initialize', error);
        showErrorMessage('Error cargando el producto. Inténtalo de nuevo.');
    }
}

document.addEventListener('DOMContentLoaded', initializeProductPage);
