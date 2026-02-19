let allProducts = [];
let filteredProducts = [];
let currentSearch = '';
let productsRoot = null;
let searchInput = null;
let searchCloseButton = null;
let revealObserver = null;

const PRODUCT_GROUPS = [
    { id: 'chockers', title: 'Chockers' },
    { id: 'collares', title: 'Collares' }
];

function debounce(fn, wait = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

function normalizeText(value) {
    return (value || '').toString().trim().toLowerCase();
}

function formatPrice(price) {
    if (price == null || Number.isNaN(Number(price))) return '';
    return `€${Number(price).toFixed(2).replace('.00', '')}`;
}

function normalizeStatus(status, soldOut = false) {
    if (soldOut) return 'agotado';

    const normalized = normalizeText(status);
    if (normalized.includes('nuevo')) return 'nuevo';
    if (normalized.includes('promo')) return 'promocion';
    if (normalized.includes('agotado')) return 'agotado';
    return '';
}

function normalizeProductType(product) {
    const type = normalizeText(product.type);
    const name = normalizeText(product.name);

    if (type.includes('chocker') || name.startsWith('chocker')) return 'chockers';
    if (type.includes('collar') || type.includes('necklace') || name.startsWith('collar')) return 'collares';

    return 'chockers';
}

function prepareProducts(rawProducts) {
    return rawProducts
        .filter((product) => product.showOnDashboard !== false)
        .map((product) => ({
            ...product,
            typeGroup: normalizeProductType(product),
            statusNormalized: normalizeStatus(product.status, product.soldOut)
        }))
        .filter((product) => PRODUCT_GROUPS.some((group) => group.id === product.typeGroup));
}

function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
}

function createStatusBadge(product) {
    if (product.soldOut) {
        return createTextElement('div', 'sold-out-badge', 'Agotado');
    }

    if (!product.statusNormalized) return null;

    const labelMap = {
        nuevo: 'Nuevo',
        promocion: 'Promoción'
    };

    const badge = createTextElement('div', `product-status-badge status-${product.statusNormalized}`, labelMap[product.statusNormalized] || '');
    return badge;
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = `product-card clickable${product.featured ? ' featured' : ''}`;

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'product-image';

    const image = document.createElement('img');
    image.src = product.image || 'images/hero-background.jpg';
    image.alt = product.name;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.fetchPriority = 'low';
    image.onerror = function onImageError() {
        this.src = 'images/hero-background.jpg';
    };

    imageWrapper.appendChild(image);

    const badge = createStatusBadge(product);
    if (badge) {
        imageWrapper.appendChild(badge);
    }

    const info = document.createElement('div');
    info.className = 'product-info';

    info.appendChild(createTextElement('div', 'product-name', product.name));

    const price = formatPrice(product.price);
    if (price) {
        info.appendChild(createTextElement('div', 'product-price-preview', price));
    }

    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-card-btn';
    addToCartButton.type = 'button';
    addToCartButton.disabled = product.soldOut === true;
    addToCartButton.textContent = product.soldOut ? 'Agotado' : 'Añadir al carrito';
    info.appendChild(addToCartButton);

    card.appendChild(imageWrapper);
    card.appendChild(info);

    const goToProduct = () => {
        window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
    };

    imageWrapper.addEventListener('click', goToProduct);
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
    if (!productsRoot) return;

    const empty = document.createElement('div');
    empty.className = 'no-products';

    empty.appendChild(createTextElement('h3', '', 'No se encontraron productos'));
    empty.appendChild(createTextElement('p', '', 'Prueba con otra búsqueda o limpia los filtros.'));

    const clearButton = document.createElement('button');
    clearButton.className = 'clear-filters-btn';
    clearButton.type = 'button';
    clearButton.textContent = 'Limpiar búsqueda';
    clearButton.addEventListener('click', clearAllFilters);

    empty.appendChild(clearButton);
    productsRoot.replaceChildren(empty);
}

function renderGroupedProducts(products) {
    if (!productsRoot) return;

    if (!Array.isArray(products) || products.length === 0) {
        renderEmptyState();
        updateProductCount(0);
        window.dispatchEvent(new CustomEvent('products:rendered', { detail: { count: 0 } }));
        return;
    }

    const fragment = document.createDocumentFragment();

    PRODUCT_GROUPS.forEach((group) => {
        const groupProducts = products.filter((product) => product.typeGroup === group.id);
        if (groupProducts.length === 0) return;

        const groupBlock = document.createElement('section');
        groupBlock.className = 'product-group';

        const title = createTextElement('h3', 'product-group-title', group.title);
        const grid = document.createElement('div');
        grid.className = 'products-grid';

        groupProducts.forEach((product, index) => {
            const card = createProductCard(product);
            card.style.animationDelay = `${index * 0.05}s`;
            card.classList.add('fade-in');
            grid.appendChild(card);
        });

        groupBlock.appendChild(title);
        groupBlock.appendChild(grid);
        fragment.appendChild(groupBlock);
    });

    productsRoot.replaceChildren(fragment);
    window.dispatchEvent(new CustomEvent('products:rendered', {
        detail: { count: products.length }
    }));
}

function applyFilters() {
    const searchValue = normalizeText(currentSearch);

    if (!searchValue) {
        filteredProducts = [...allProducts];
        renderGroupedProducts(filteredProducts);
        return;
    }

    filteredProducts = allProducts.filter((product) => {
        const haystack = [
            product.name,
            product.description,
            product.type,
            product.status,
            product.tags && Array.isArray(product.tags) ? product.tags.join(' ') : ''
        ].map(normalizeText).join(' ');

        return haystack.includes(searchValue);
    });

    renderGroupedProducts(filteredProducts);
}

function clearAllFilters() {
    currentSearch = '';

    if (searchInput) {
        searchInput.value = '';
        searchInput.style.display = 'none';
    }

    if (searchCloseButton) {
        searchCloseButton.style.display = 'none';
    }

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
    searchInput.placeholder = 'Buscar chockers o collares...';
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
    }, 200);

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

    const targets = document.querySelectorAll('.product-card, .section-title, .hero-content, .atelier-content, .contact-section .container');
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

        const rawProducts = window.productManager.getAllProducts();
        allProducts = prepareProducts(rawProducts);

        applyFilters();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error cargando productos. Recarga la página.', 'error');

        if (productsRoot) {
            productsRoot.innerHTML = '<div class="error-message">Error cargando productos. Por favor recarga la página.</div>';
        }
    }
}

function initializePage() {
    productsRoot = document.getElementById('products-grid');
    if (!productsRoot) {
        console.error('Products container not found');
        return;
    }

    setupSearch();
    setupSmoothAnchorNavigation();
    setupRevealObserver();
    setupAtelierForm();
    loadProducts();
}

function setupAtelierForm() {
    const form = document.getElementById('atelier-form') || document.querySelector('.atelier-form');
    if (!form) return;

    const productSelect = document.getElementById('atelier-product');
    const optionalWrap = document.getElementById('atelier-optional-wrap');
    const toggleOptionalBtn = document.getElementById('atelier-toggle-optional');
    const addOptionalRowBtn = document.getElementById('atelier-add-row');
    const optionalRows = document.getElementById('atelier-extra-rows');

    const defaultToggleText = 'Añadir campos opcionales';
    const openedToggleText = 'Ocultar campos opcionales';

    const createOptionalRow = (label = '', value = '') => {
        const row = document.createElement('div');
        row.className = 'atelier-extra-row';
        row.innerHTML = `
            <input type="text" name="extra_label[]" placeholder="Nombre del campo (ej. Color)" value="${label}">
            <input type="text" name="extra_value[]" placeholder="Valor" value="${value}">
            <button type="button" class="atelier-remove-row" aria-label="Eliminar campo">×</button>
        `;
        return row;
    };

    const ensureSupabaseClient = () => {
        if (window.supabaseClient) return window.supabaseClient;
        if (window.productManager && window.productManager.supabaseClient) {
            window.supabaseClient = window.productManager.supabaseClient;
        }
        return window.supabaseClient || null;
    };

    if (toggleOptionalBtn && optionalWrap) {
        toggleOptionalBtn.addEventListener('click', () => {
            const isOpen = !optionalWrap.hidden;
            optionalWrap.hidden = isOpen;
            toggleOptionalBtn.classList.toggle('is-open', !isOpen);
            toggleOptionalBtn.innerHTML = `<span aria-hidden="true">+</span> ${isOpen ? defaultToggleText : openedToggleText}`;
        });
    }

    if (addOptionalRowBtn && optionalRows) {
        addOptionalRowBtn.addEventListener('click', () => {
            optionalRows.appendChild(createOptionalRow());
        });
        optionalRows.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('.atelier-remove-row');
            if (!removeBtn) return;
            const row = removeBtn.closest('.atelier-extra-row');
            if (row) row.remove();
        });
    }

    if (productSelect && window.productManager) {
        const populate = () => {
            const initialOption = productSelect.querySelector('option');
            productSelect.innerHTML = '';
            if (initialOption) {
                productSelect.appendChild(initialOption);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '-- Selecciona un producto (opcional) --';
                productSelect.appendChild(option);
            }

            const products = window.productManager.getAllProducts();
            const names = Array.from(new Set(products.map((product) => product.name).filter(Boolean)))
                .sort((a, b) => a.localeCompare(b, 'es'));

            names.forEach((name) => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                productSelect.appendChild(option);
            });
        };

        if (window.productManager.isLoaded) {
            populate();
        } else {
            window.addEventListener('products:ready', populate, { once: true });
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        const formData = new FormData(form);
        const name = (formData.get('nombre_apellidos') || '').toString().trim();
        const preferredContact = (formData.get('contact_preference') || '').toString().trim();
        const email = (formData.get('email') || '').toString().trim();
        const phone = (formData.get('phone') || '').toString().trim();

        if (!name || !preferredContact) {
            showNotification('Completa nombre y contacto preferido.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

        const extraLabels = formData.getAll('extra_label[]');
        const extraValues = formData.getAll('extra_value[]');
        const extraDetails = [];

        for (let i = 0; i < Math.max(extraLabels.length, extraValues.length); i += 1) {
            const label = (extraLabels[i] || '').toString().trim();
            const value = (extraValues[i] || '').toString().trim();
            if (!label && !value) continue;
            if (label && value) {
                extraDetails.push(`${label}: ${value}`);
            } else if (value) {
                extraDetails.push(value);
            } else {
                extraDetails.push(label);
            }
        }

        const detailsParts = [];
        const baseDetails = (formData.get('details') || '').toString().trim();
        if (baseDetails) detailsParts.push(baseDetails);
        if (extraDetails.length > 0) {
            detailsParts.push(`Campos opcionales:\n${extraDetails.join('\n')}`);
        }

        const fullPayload = {
            name,
            contact: preferredContact,
            email: email || null,
            phone: phone || null,
            event_date: (formData.get('fecha_evento') || '').toString() || null,
            related_product: (formData.get('related_product') || '').toString() || null,
            details: detailsParts.join('\n\n') || null,
            status: 'new'
        };

        try {
            const supabase = ensureSupabaseClient();
            if (!supabase) {
                console.error('Supabase client not ready');
                showNotification('Error de conexión. Inténtalo más tarde.', 'error');
                return;
            }

            let insertError = null;
            const payloadVariants = [
                fullPayload,
                {
                    name: fullPayload.name,
                    contact: fullPayload.contact,
                    event_date: fullPayload.event_date,
                    related_product: fullPayload.related_product,
                    details: fullPayload.details,
                    status: fullPayload.status
                },
                {
                    name: fullPayload.name,
                    contact: fullPayload.contact,
                    details: fullPayload.details,
                    status: fullPayload.status
                }
            ];

            for (const payload of payloadVariants) {
                const { error } = await supabase.from('atelier_requests').insert(payload);
                if (!error) {
                    insertError = null;
                    break;
                }
                insertError = error;
            }

            if (insertError) {
                throw insertError;
            }

            showNotification('¡Solicitud enviada! Te contactaremos pronto.', 'success');
            form.reset();
            if (optionalRows) optionalRows.innerHTML = '';
            if (optionalWrap && toggleOptionalBtn) {
                optionalWrap.hidden = true;
                toggleOptionalBtn.classList.remove('is-open');
                toggleOptionalBtn.innerHTML = `<span aria-hidden="true">+</span> ${defaultToggleText}`;
            }
        } catch (error) {
            console.error('Atelier error:', error);
            showNotification('Error al enviar la solicitud. Inténtalo de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

window.clearAllFilters = clearAllFilters;

document.addEventListener('DOMContentLoaded', initializePage);
