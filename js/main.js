let allProducts = [];
let allCollections = [];
let filteredProducts = [];
let currentCollection = null;
let currentSearch = '';
let productsGrid = null;
let searchInput = null;
let searchCloseButton = null;
let revealObserver = null;

function debounce(fn, wait = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

function formatPrice(price) {
    if (price == null || Number.isNaN(Number(price))) return '';
    return `€${Number(price).toFixed(2).replace('.00', '')}`;
}

function normalizeSearchText(value) {
    return (value || '').toString().trim().toLowerCase();
}

function getDashboardProducts() {
    return allProducts.filter((product) => product.showOnDashboard !== false);
}

function getActiveCollection() {
    if (!currentCollection) return null;
    return allCollections.find((collection) => collection.id === currentCollection) || null;
}

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = `product-card clickable${product.featured ? ' featured' : ''}`;

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-image';

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.name;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    imageWrapper.appendChild(image);

    if (product.soldOut) {
        imageWrapper.appendChild(createTextElement('div', 'sold-out-badge', 'Agotado'));
    }

    const info = document.createElement('div');
    info.className = 'product-info';

    info.appendChild(createTextElement('div', 'product-material', product.material || ''));
    info.appendChild(createTextElement('div', 'product-name', product.name));

    const price = formatPrice(product.price);
    if (price) {
        info.appendChild(createTextElement('div', 'product-price-preview', price));
    }

    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-card-btn';
    addToCartButton.type = 'button';
    addToCartButton.disabled = product.soldOut === true;
    addToCartButton.textContent = product.soldOut ? 'Agotado' : 'Añadir al Carrito';
    info.appendChild(addToCartButton);

    card.appendChild(imageWrapper);
    card.appendChild(info);

    const goToProduct = () => {
        window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
    };

    imageWrapper.addEventListener('click', goToProduct);
    info.querySelector('.product-material')?.addEventListener('click', goToProduct);
    info.querySelector('.product-name')?.addEventListener('click', goToProduct);
    info.querySelector('.product-price-preview')?.addEventListener('click', goToProduct);

    addToCartButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (product.soldOut) {
            window.cart?.showNotification('Este producto está agotado', 'error');
            return;
        }

        if (!window.cart) {
            showNotification('El carrito no está disponible', 'error');
            return;
        }

        window.cart.addItem(product, 1);
    });

    return card;
}

function renderEmptyState() {
    if (!productsGrid) return;

    const empty = document.createElement('div');
    empty.className = 'no-products';

    empty.appendChild(createTextElement('h3', '', 'No se encontraron productos'));
    empty.appendChild(createTextElement('p', '', 'Prueba con otra búsqueda o limpia los filtros.'));

    const clearButton = document.createElement('button');
    clearButton.className = 'clear-filters-btn';
    clearButton.type = 'button';
    clearButton.textContent = 'Limpiar filtros';
    clearButton.addEventListener('click', clearAllFilters);
    empty.appendChild(clearButton);

    productsGrid.replaceChildren(empty);
}

function renderProducts(products) {
    if (!productsGrid) return;

    if (!Array.isArray(products) || products.length === 0) {
        renderEmptyState();
        updateProductCount(0);
        window.dispatchEvent(new CustomEvent('products:rendered', { detail: { count: 0 } }));
        return;
    }

    const fragment = document.createDocumentFragment();
    products.forEach((product, index) => {
        const card = createProductCard(product);
        card.style.animationDelay = `${index * 0.06}s`;
        card.classList.add('fade-in');
        fragment.appendChild(card);
    });

    productsGrid.replaceChildren(fragment);
    updateProductCount(products.length);

    window.dispatchEvent(new CustomEvent('products:rendered', {
        detail: { count: products.length }
    }));
}

function createCollectionCard(collection) {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.dataset.collection = collection.id;

    const imageWrapper = createTextElement('div', 'collection-image', '');
    const image = document.createElement('img');
    image.src = collection.image || 'images/hero-background.jpg';
    image.alt = `Colección ${collection.name}`;
    image.loading = 'lazy';
    image.onerror = function onImageError() {
        this.src = 'images/hero-background.jpg';
    };
    imageWrapper.appendChild(image);

    const content = createTextElement('div', 'collection-content', '');
    content.appendChild(createTextElement('h3', '', collection.name));
    content.appendChild(createTextElement('p', '', collection.description || 'Colección única de joyería artesanal'));

    card.appendChild(imageWrapper);
    card.appendChild(content);

    card.addEventListener('click', () => {
        filterByCollection(collection.id);
    });

    return card;
}

function renderCollections() {
    const collectionsGrid = document.querySelector('.collections-grid');
    if (!collectionsGrid || allCollections.length === 0) return;

    const fragment = document.createDocumentFragment();
    allCollections.forEach((collection) => {
        fragment.appendChild(createCollectionCard(collection));
    });

    collectionsGrid.replaceChildren(fragment);
    updateCollectionActiveState();
}

function ensureCollectionDescriptionElement() {
    const productsContainer = document.querySelector('.products .container');
    if (!productsContainer) return null;

    let description = productsContainer.querySelector('.collection-description');
    if (!description) {
        description = document.createElement('p');
        description.className = 'collection-description';
        description.style.textAlign = 'center';
        description.style.marginBottom = '1.5rem';
        description.style.color = '#6b6b6b';
        description.style.maxWidth = '700px';
        description.style.marginLeft = 'auto';
        description.style.marginRight = 'auto';
        productsContainer.insertBefore(description, productsContainer.firstChild);
    }

    return description;
}

function updateCollectionDescription() {
    const descriptionElement = ensureCollectionDescriptionElement();
    if (!descriptionElement) return;

    const collection = getActiveCollection();
    if (!collection) {
        descriptionElement.textContent = '';
        return;
    }

    descriptionElement.textContent = collection.description || '';
}

function updateCollectionActiveState() {
    const collectionCards = document.querySelectorAll('.collection-card');
    collectionCards.forEach((card) => {
        card.classList.toggle('active', card.dataset.collection === currentCollection);
    });
}

function updatePageHeading() {
    const title = getActiveCollection();
    const heading = document.querySelector('.products h2');

    if (!title) {
        document.title = 'Iuvene - Joyería y Accesorios Artesanales';
        if (heading) heading.textContent = 'Nuestra Colección';
        return;
    }

    document.title = `Colección ${title.name} - Iuvene`;
    if (heading) heading.textContent = `Colección ${title.name}`;
}

function updateProductCount(count) {
    const productsContainer = document.querySelector('.products .container');
    if (!productsContainer) return;

    let countElement = document.getElementById('product-count');
    if (!countElement) {
        countElement = document.createElement('p');
        countElement.id = 'product-count';
        countElement.className = 'product-count-compact';

        if (productsGrid) {
            productsContainer.insertBefore(countElement, productsGrid);
        } else {
            productsContainer.appendChild(countElement);
        }
    }

    countElement.textContent = `Mostrando ${count} producto${count === 1 ? '' : 's'}`;
}

function showViewAllButton() {
    const productsContainer = document.querySelector('.products .container');
    if (!productsContainer) return;

    let button = document.querySelector('.view-all-btn');
    if (!button) {
        button = document.createElement('button');
        button.className = 'view-all-btn';
        button.type = 'button';
        button.textContent = '← Ver todas las colecciones';
        button.addEventListener('click', viewAllProducts);
        productsContainer.appendChild(button);
    }
}

function hideViewAllButton() {
    const button = document.querySelector('.view-all-btn');
    if (button) button.remove();
}

function updateViewAllButton() {
    if (currentCollection) {
        showViewAllButton();
    } else {
        hideViewAllButton();
    }
}

function applyFilters({ scrollToProducts = false } = {}) {
    const searchValue = normalizeSearchText(currentSearch);

    let visible = currentCollection
        ? allProducts.filter((product) => product.collection === currentCollection)
        : getDashboardProducts();

    if (searchValue) {
        visible = visible.filter((product) => {
            const name = normalizeSearchText(product.name);
            const material = normalizeSearchText(product.material);
            const description = normalizeSearchText(product.description);

            return name.includes(searchValue) || material.includes(searchValue) || description.includes(searchValue);
        });
    }

    filteredProducts = visible;

    renderProducts(visible);
    updatePageHeading();
    updateCollectionDescription();
    updateCollectionActiveState();
    updateViewAllButton();

    if (scrollToProducts) {
        document.querySelector('.products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filterByCollection(collectionId) {
    currentCollection = collectionId;
    applyFilters({ scrollToProducts: true });
}

function viewAllProducts() {
    currentCollection = null;
    applyFilters({ scrollToProducts: false });
}

function clearAllFilters() {
    currentCollection = null;
    currentSearch = '';

    if (searchInput) searchInput.value = '';
    if (searchInput) searchInput.style.display = 'none';
    if (searchCloseButton) searchCloseButton.style.display = 'none';

    applyFilters();
}

function setupSearch() {
    const searchButton = document.querySelector('.search-btn');
    if (!searchButton || !searchButton.parentNode) return;

    const existingContainer = document.querySelector('.search-container');
    if (existingContainer) existingContainer.remove();

    const container = document.createElement('div');
    container.className = 'search-container';

    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-input';
    searchInput.placeholder = 'Buscar productos...';
    searchInput.style.display = 'none';

    searchCloseButton = document.createElement('button');
    searchCloseButton.type = 'button';
    searchCloseButton.className = 'search-close-btn';
    searchCloseButton.textContent = '×';
    searchCloseButton.style.display = 'none';

    container.appendChild(searchInput);
    container.appendChild(searchCloseButton);

    searchButton.parentNode.appendChild(container);

    const updateSearch = debounce((value) => {
        currentSearch = value;
        applyFilters();
    }, 220);

    searchButton.addEventListener('click', () => {
        const visible = searchInput.style.display !== 'none';
        searchInput.style.display = visible ? 'none' : 'block';
        searchCloseButton.style.display = visible ? 'none' : 'block';

        if (visible) {
            searchInput.value = '';
            currentSearch = '';
            applyFilters();
        } else {
            searchInput.focus();
        }
    });

    searchCloseButton.addEventListener('click', clearAllFilters);

    searchInput.addEventListener('input', (event) => {
        updateSearch(event.target.value || '');
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            clearAllFilters();
        }
    });
}

function setupSmoothAnchorNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const href = anchor.getAttribute('href');
            if (!href || href.length < 2) return;

            const target = document.querySelector(href);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

function observeRevealElements() {
    if (!revealObserver) return;

    const targets = document.querySelectorAll('.product-card, .collection-card, .section-title, .hero-content');
    targets.forEach((target) => {
        target.classList.add('reveal');
        revealObserver.observe(target);
    });
}

function setupRevealObserver() {
    if (!('IntersectionObserver' in window)) return;

    revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    observeRevealElements();
    window.addEventListener('products:rendered', () => setTimeout(observeRevealElements, 80));
}

async function loadProducts() {
    try {
        if (!window.productManager) {
            throw new Error('ProductManager not initialized');
        }

        await window.productManager.init();

        allProducts = window.productManager.getAllProducts();
        allCollections = window.productManager.getAllCollections();

        renderCollections();
        applyFilters();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error cargando productos. Recarga la página.', 'error');

        if (productsGrid) {
            productsGrid.innerHTML = '<div class="error-message">Error cargando productos. Por favor recarga la página.</div>';
        }
    }
}

function initializePage() {
    productsGrid = document.getElementById('products-grid');
    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }

    setupSearch();
    setupSmoothAnchorNavigation();
    setupRevealObserver();
    loadProducts();
}

window.clearAllFilters = clearAllFilters;
window.filterByCollection = filterByCollection;
window.viewAllProducts = viewAllProducts;
window.toggleFilters = () => {};

document.addEventListener('DOMContentLoaded', initializePage);
