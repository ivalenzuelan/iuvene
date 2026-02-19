// Iuvene Admin Panel - Supercharged edition

const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTk1NDksImV4cCI6MjA4NzAzNTU0OX0.iI2K0RY1s-tA3P2xu6IhmOch7YldfrTNw1wCzdE6o08';

const FALLBACK_COLLECTION = {
    id: 'coleccion-iuvene',
    name: 'Colección Iuvene'
};

const state = {
    products: [],
    filteredProducts: [],
    collections: [],
    editingId: null,
    saving: false,
    uploadingImages: false,
    modalBaseline: '',
    modalDirty: false,
    filters: {
        query: '',
        type: 'all',
        status: 'all',
        collection: 'all',
        sort: 'newest'
    },
    currentImages: []
};

const elements = {};
let supabaseClient = null;

function $(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value) {
    return (value || '').toString().trim().toLowerCase();
}

function debounce(fn, wait = 250) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), wait);
    };
}

function showToast(message, type = 'info') {
    const root = elements.toastRoot;
    if (!root) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    root.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3200);
}

function showLoginError(message) {
    if (!elements.loginError) return;
    elements.loginError.textContent = message;
    elements.loginError.classList.remove('hidden');
}

function clearLoginError() {
    if (!elements.loginError) return;
    elements.loginError.textContent = '';
    elements.loginError.classList.add('hidden');
}

function setLoadingProducts() {
    if (!elements.productsList) return;
    elements.productsList.innerHTML = '<div class="empty">Cargando productos...</div>';
}

function resolveImageSrc(path) {
    const value = (path || '').toString().trim();
    if (!value) return '../images/hero-background.jpg';

    if (/^https?:\/\//i.test(value) || /^data:/i.test(value)) {
        return value;
    }

    if (value.startsWith('../')) {
        return value;
    }

    if (value.startsWith('/')) {
        return `..${value}`;
    }

    return `../${value}`;
}

function getCollectionById(collectionId) {
    return state.collections.find((collection) => String(collection.id) === String(collectionId)) || null;
}

function getCollectionName(collectionId) {
    const match = getCollectionById(collectionId);
    return match ? match.name : collectionId;
}

function normalizeStatus(product) {
    if (product.sold_out) return 'sold';

    const status = normalizeText(product.status);
    if (status.includes('nuevo')) return 'new';
    if (status.includes('promo')) return 'promo';
    return 'normal';
}

function statusLabel(product) {
    if (product.sold_out) return 'AGOTADO';
    return product.status ? String(product.status).toUpperCase() : 'ACTIVO';
}

function formatPrice(value) {
    const price = Number(value);
    if (!Number.isFinite(price)) return '€0';
    return `€${price.toFixed(2).replace('.00', '')}`;
}

function parseImageList(value) {
    return (value || '')
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeStatusClass(value) {
    const cleaned = normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned || 'new';
}

function normalizeImageArray(images) {
    const list = Array.isArray(images) ? images : [];
    return Array.from(new Set(list.map((img) => String(img || '').trim()).filter(Boolean)));
}

function setFieldSelectValue(selectElement, value, fallback = '') {
    if (!selectElement) return;

    const normalized = String(value ?? '').trim();
    if (normalized && Array.from(selectElement.options).some((opt) => opt.value === normalized)) {
        selectElement.value = normalized;
        return;
    }

    if (fallback && Array.from(selectElement.options).some((opt) => opt.value === fallback)) {
        selectElement.value = fallback;
        return;
    }

    selectElement.value = selectElement.options[0]?.value ?? '';
}

function ensureSelectOption(selectElement, value, label = value) {
    if (!selectElement) return;
    const normalized = String(value ?? '').trim();
    if (!normalized) return;

    const exists = Array.from(selectElement.options).some((opt) => opt.value === normalized);
    if (exists) return;

    const option = document.createElement('option');
    option.value = normalized;
    option.textContent = String(label || normalized);
    option.dataset.dynamic = 'true';
    selectElement.appendChild(option);
}

// No-op: collection field removed from form
function syncCollectionValue(_collectionId) { }

function clearDynamicSelectOptions() {
    const selects = [elements.productStatus];
    selects.filter(Boolean).forEach((select) => {
        Array.from(select.querySelectorAll('option[data-dynamic="true"]')).forEach((option) => option.remove());
    });
}

function getModalSnapshot() {
    const payload = buildPayloadFromForm();
    return JSON.stringify(payload);
}

function setModalDirty(isDirty) {
    state.modalDirty = Boolean(isDirty);
    if (!elements.modalDirtyIndicator) return;
    elements.modalDirtyIndicator.classList.toggle('hidden', !state.modalDirty);
}

function updateModalPreview() {
    if (!elements.previewMainImage || !elements.previewGallery || !elements.previewMeta) return;

    const main = state.currentImages[0] || 'images/hero-background.jpg';
    elements.previewMainImage.src = resolveImageSrc(main);
    elements.previewMainImage.onerror = () => {
        elements.previewMainImage.src = '../images/hero-background.jpg';
    };

    const gallery = state.currentImages.slice(0, 4);
    elements.previewGallery.innerHTML = gallery.map((src) => (
        `<img src="${escapeHtml(resolveImageSrc(src))}" alt="Vista previa imagen">`
    )).join('');

    const name = elements.productName.value.trim() || 'Sin nombre';
    const price = Number(elements.productPrice.value);
    const status = elements.productSoldOut.checked
        ? 'AGOTADO'
        : (elements.productStatus.value || 'ACTIVO');

    elements.previewMeta.innerHTML = [
        `<div><strong>${escapeHtml(name)}</strong></div>`,
        `<div>${escapeHtml(Number.isFinite(price) ? formatPrice(price) : '€0')}</div>`,
        `<div>${escapeHtml(status)}</div>`,
        `<div>${state.currentImages.length} imagen${state.currentImages.length === 1 ? '' : 'es'}</div>`
    ].join('');
}

function refreshModalUiState() {
    if (!elements.saveBtn) return;

    const baseLabel = state.editingId != null ? 'Guardar cambios' : 'Guardar producto';
    elements.saveBtn.textContent = state.saving
        ? 'Guardando...'
        : state.uploadingImages
            ? 'Subiendo imágenes...'
            : baseLabel;

    const hasName = elements.productName.value.trim().length > 0;
    const price = Number(elements.productPrice.value);
    const hasValidPrice = Number.isFinite(price) && price >= 0;
    elements.saveBtn.disabled = state.saving || state.uploadingImages || !hasName || !hasValidPrice;
}

function markModalAsDirtyIfNeeded() {
    if (!isModalOpen()) return;
    const snapshot = getModalSnapshot();
    setModalDirty(snapshot !== state.modalBaseline);
    updateModalPreview();
    refreshModalUiState();
}

function isModalOpen() {
    return elements.modal?.classList.contains('active') === true;
}

function renderCollectionOptions() {
    const list = state.collections.length > 0 ? state.collections : [FALLBACK_COLLECTION];
    const currentFilterCollection = elements.filterCollection?.value || 'all';

    const optionsHtml = list
        .map((collection) => `<option value="${escapeHtml(collection.id)}">${escapeHtml(collection.name)}</option>`)
        .join('');

    // Update only the filter dropdown (product form no longer has a collection field)
    elements.filterCollection.innerHTML =
        '<option value="all">Todas</option>' + optionsHtml;

    setFieldSelectValue(elements.filterCollection, currentFilterCollection, 'all');
}

function renderTypeFilterOptions() {
    const staticTypes = ['chockers', 'collares'];
    const dynamic = Array.from(new Set(state.products.map((product) => String(product.type || '').trim()).filter(Boolean)));

    const allTypes = Array.from(new Set([...staticTypes, ...dynamic]));

    const currentValue = elements.filterType.value;

    elements.filterType.innerHTML = '<option value="all">Todos</option>' +
        allTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');

    if (allTypes.includes(currentValue)) {
        elements.filterType.value = currentValue;
    } else {
        elements.filterType.value = 'all';
    }
}

function renderStats() {
    const products = state.products;

    const visible = products.filter((product) => product.show_on_dashboard !== false).length;
    const sold = products.filter((product) => product.sold_out === true).length;
    const promo = products.filter((product) => normalizeStatus(product) === 'promo').length;

    elements.statTotal.textContent = String(products.length);
    elements.statVisible.textContent = String(visible);
    elements.statSold.textContent = String(sold);
    elements.statPromo.textContent = String(promo);
}

function productMatchesSearch(product, query) {
    if (!query) return true;

    const content = [
        product.name,
        product.description,
        product.type,
        product.category,
        product.collection_id,
        product.status,
        product.material
    ].map(normalizeText).join(' ');

    return content.includes(query);
}

function applyFilters() {
    const { query, type, status, collection, sort } = state.filters;

    let result = [...state.products];

    const normalizedQuery = normalizeText(query);

    if (normalizedQuery) {
        result = result.filter((product) => productMatchesSearch(product, normalizedQuery));
    }

    if (type !== 'all') {
        result = result.filter((product) => String(product.type) === type);
    }

    if (collection !== 'all') {
        result = result.filter((product) => String(product.collection_id) === collection);
    }

    if (status !== 'all') {
        result = result.filter((product) => {
            const normalized = normalizeStatus(product);

            if (status === 'new') return normalized === 'new';
            if (status === 'promo') return normalized === 'promo';
            if (status === 'sold') return normalized === 'sold';
            if (status === 'visible') return product.show_on_dashboard !== false;
            if (status === 'hidden') return product.show_on_dashboard === false;
            return true;
        });
    }

    if (sort === 'newest') {
        result.sort((a, b) => Number(b.id) - Number(a.id));
    } else if (sort === 'oldest') {
        result.sort((a, b) => Number(a.id) - Number(b.id));
    } else if (sort === 'price-asc') {
        result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === 'price-desc') {
        result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === 'name-asc') {
        result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
    }

    state.filteredProducts = result;
    renderProducts();
}

function renderProducts() {
    const list = state.filteredProducts;

    if (!Array.isArray(list) || list.length === 0) {
        elements.productsList.innerHTML = '<div class="empty">No hay productos con estos filtros.</div>';
        elements.productsSummary.textContent = '0 productos';
        return;
    }

    elements.productsSummary.textContent = `${list.length} producto${list.length === 1 ? '' : 's'}`;

    elements.productsList.innerHTML = list.map((product) => {
        const status = normalizeStatus(product);
        const mainBadge =
            status === 'sold'
                ? '<span class="badge badge-sold">Agotado</span>'
                : status === 'new'
                    ? '<span class="badge badge-new">Nuevo</span>'
                    : status === 'promo'
                        ? '<span class="badge badge-promo">Promoción</span>'
                        : '';

        const hiddenBadge = product.show_on_dashboard === false
            ? '<span class="badge badge-hidden">Oculto</span>'
            : '';

        const typeLabel = product.type || '-';
        const collectionLabel = getCollectionName(product.collection_id || '-');
        const description = (product.description || '').trim();

        return `
            <article class="product-card">
                <div class="product-image-wrap">
                    ${mainBadge}
                    ${hiddenBadge}
                    <img src="${escapeHtml(resolveImageSrc(product.image))}" class="product-img" alt="${escapeHtml(product.name || 'Producto')}" onerror="this.src='../images/hero-background.jpg'">
                </div>
                <div class="product-content">
                    <h3 class="product-name">${escapeHtml(product.name || 'Sin nombre')}</h3>
                    <div class="product-price">${escapeHtml(formatPrice(product.price))}</div>
                    <div class="product-meta">${escapeHtml(typeLabel)} · ${escapeHtml(collectionLabel)}</div>
                    <div class="product-meta">Estado: ${escapeHtml(statusLabel(product))}</div>
                    <p class="product-description">${escapeHtml(description || 'Sin descripción')}</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn-ghost" type="button" data-action="edit" data-id="${escapeHtml(product.id)}">Editar</button>
                    <button class="btn btn-ghost" type="button" data-action="duplicate" data-id="${escapeHtml(product.id)}">Duplicar</button>
                    <button class="btn ${product.sold_out ? 'btn-success' : 'btn-warning'}" type="button" data-action="toggle-sold" data-id="${escapeHtml(product.id)}">${product.sold_out ? 'Marcar disponible' : 'Marcar agotado'}</button>
                    <button class="btn ${product.show_on_dashboard === false ? 'btn-success' : 'btn-ghost'}" type="button" data-action="toggle-visibility" data-id="${escapeHtml(product.id)}">${product.show_on_dashboard === false ? 'Mostrar en web' : 'Ocultar en web'}</button>
                    <button class="btn btn-danger" type="button" data-action="delete" data-id="${escapeHtml(product.id)}">Borrar</button>
                </div>
            </article>
        `;
    }).join('');
}

function setModalOpen(isOpen) {
    elements.modal.classList.toggle('active', isOpen);
    elements.modal.setAttribute('aria-hidden', isOpen ? 'false' : 'true');

    if (isOpen) {
        document.body.style.overflow = 'hidden';
        refreshModalUiState();
        updateModalPreview();
    } else {
        document.body.style.overflow = '';
    }
}

// --- Image Manager Logic ---

function renderImageManagerGrid() {
    const container = elements.imageManagerGrid;
    if (!container) return;
    state.currentImages = normalizeImageArray(state.currentImages);

    if (state.currentImages.length === 0) {
        container.innerHTML = '<p class="empty" style="grid-column: 1/-1; padding: 1rem; font-size: 0.9rem;">No hay imágenes.</p>';
        elements.productImage.value = '';
        elements.productImages.value = '';
        updateModalPreview();
        return;
    }

    container.innerHTML = state.currentImages.map((src, index) => {
        const isCover = index === 0;
        return `
            <div class="img-thumbnail-card" draggable="true" data-index="${index}">
                <img src="${escapeHtml(resolveImageSrc(src))}" loading="lazy">
                <div class="cover-badge">PORTADA</div>
                <div class="img-actions">
                    ${!isCover ? `
                    <button type="button" class="action-btn move-btn" title="Mover a portada" data-image-action="move-cover" data-index="${index}">
                        ⬆
                    </button>
                    <button type="button" class="action-btn move-btn" title="Mover izquierda" data-image-action="move-left" data-index="${index}">
                        ⬅
                    </button>
                    ` : ''}
                    <button type="button" class="action-btn" title="Eliminar" data-image-action="remove" data-index="${index}">
                        🗑
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Sync to legacy hidden inputs for compatibility
    elements.productImage.value = state.currentImages[0] || '';
    elements.productImages.value = state.currentImages.join('\n');
    updateModalPreview();
}

async function uploadFileToSupabase(file) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeName = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'product';

    const filePath = `products/${Date.now()}-${safeName}.${ext}`;

    const { error } = await supabaseClient.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
        throw new Error(`Error subiendo ${file.name}: ${error.message}`);
    }

    const { data } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

function moveImagePosition(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= state.currentImages.length) return;
    if (toIndex < 0 || toIndex >= state.currentImages.length) return;
    if (fromIndex === toIndex) return;

    const item = state.currentImages.splice(fromIndex, 1)[0];
    state.currentImages.splice(toIndex, 0, item);
    renderImageManagerGrid();
    markModalAsDirtyIfNeeded();
}

function removeImageAt(index) {
    if (index < 0 || index >= state.currentImages.length) return;
    const confirmed = window.confirm('¿Eliminar esta imagen de la lista?');
    if (!confirmed) return;

    state.currentImages.splice(index, 1);
    renderImageManagerGrid();
    markModalAsDirtyIfNeeded();
}

function addImageByUrl(rawUrl) {
    const url = String(rawUrl || '').trim();
    if (!url) return false;

    const isValid = /^(https?:\/\/|\/|images\/|\.\.\/)/i.test(url);
    if (!isValid) {
        showToast('URL inválida. Usa https:// o una ruta local válida.', 'error');
        return false;
    }

    state.currentImages.push(url);
    state.currentImages = normalizeImageArray(state.currentImages);
    renderImageManagerGrid();
    markModalAsDirtyIfNeeded();
    return true;
}

async function handleImageFiles(files) {
    if (!files || files.length === 0) return;

    state.uploadingImages = true;
    refreshModalUiState();
    showToast(`Subiendo ${files.length} imágenes...`);

    let uploadedCount = 0;
    try {
        for (const file of files) {
            try {
                const url = await uploadFileToSupabase(file);
                if (url) {
                    state.currentImages.push(url);
                    uploadedCount++;
                    renderImageManagerGrid();
                }
            } catch (error) {
                console.error(error);
                showToast(`Error con ${file.name}`, 'error');
            }
        }

        if (uploadedCount > 0) {
            showToast(`Subidas ${uploadedCount} imágenes exitosamente.`, 'success');
            markModalAsDirtyIfNeeded();
        }
    } finally {
        state.uploadingImages = false;
        refreshModalUiState();
    }
}

function resetProductForm() {
    state.editingId = null;
    state.currentImages = [];
    state.currentProductCollectionId = null;
    state.modalBaseline = '';
    state.modalDirty = false;
    state.uploadingImages = false;

    elements.productForm.reset();
    elements.productId.value = '';
    elements.productStatus.value = '';
    elements.productDashboard.checked = true;
    elements.productFeatured.checked = false;
    elements.productSoldOut.checked = false;

    if (elements.imageUrlInput) {
        elements.imageUrlInput.value = '';
    }

    renderImageManagerGrid();
    setModalDirty(false);
    refreshModalUiState();
}

function openModal(product = null) {
    resetProductForm();

    if (product) {
        state.editingId = product.id;

        elements.modalTitle.textContent = 'Editar producto';
        elements.modalSubtitle.textContent = 'Ajusta los campos del producto y guarda cuando termines.';
        elements.productId.value = product.id;
        elements.productName.value = product.name || '';
        elements.productPrice.value = Number.isFinite(Number(product.price)) ? Number(product.price) : '';

        // Preserve collection_id silently (no UI field anymore)
        state.currentProductCollectionId = product.collection_id || product.collection || (state.collections[0]?.id || null);

        ensureSelectOption(elements.productStatus, product.status || '');
        setFieldSelectValue(elements.productStatus, product.status || '', '');
        elements.productDescription.value = product.description || '';

        elements.productSoldOut.checked = product.sold_out === true;
        elements.productDashboard.checked = product.show_on_dashboard !== false;
        elements.productFeatured.checked = product.featured === true;

        // Initialize image manager with cover first and deduplicated gallery
        const mainImage = product.image ? [product.image] : [];
        const gallery = Array.isArray(product.images) ? product.images : [];
        state.currentImages = normalizeImageArray([...mainImage, ...gallery]);

    } else {
        elements.modalTitle.textContent = 'Nuevo producto';
        elements.modalSubtitle.textContent = 'Crea un producto completo con portada, galería y estado comercial.';
    }

    renderImageManagerGrid();
    state.modalBaseline = getModalSnapshot();
    setModalDirty(false);
    refreshModalUiState();
    setModalOpen(true);
}

function closeModal({ force = false } = {}) {
    if (!force && state.uploadingImages) {
        showToast('Espera a que termine la subida de imágenes.', 'info');
        return false;
    }

    if (!force && state.modalDirty) {
        const confirmed = window.confirm('Hay cambios sin guardar. ¿Cerrar igualmente?');
        if (!confirmed) return false;
    }

    setModalOpen(false);
    resetProductForm();
    return true;
}

function buildPayloadFromForm() {
    const primaryImage = state.currentImages[0] || 'images/hero-background.jpg';
    const gallery = [...state.currentImages];
    if (gallery.length === 0) gallery.push(primaryImage);

    const payload = {
        name: elements.productName.value.trim(),
        price: Number(elements.productPrice.value),
        collection_id: state.editingId ? (state.currentProductCollectionId || null) : null,
        collection: state.editingId ? (state.currentProductCollectionId || null) : null,
        category: 'other',
        type: 'chockers',
        material: '',
        description: elements.productDescription.value.trim(),
        image: primaryImage,
        images: gallery,
        sold_out: elements.productSoldOut.checked,
        status: elements.productStatus.value,
        show_on_dashboard: elements.productDashboard.checked,
        featured: elements.productFeatured.checked,
        tags: []
    };

    return payload;
}

function validatePayload(payload) {
    if (!payload.name) {
        showToast('El nombre es obligatorio.', 'error');
        elements.productName.focus();
        return false;
    }

    if (!Number.isFinite(payload.price) || payload.price < 0) {
        showToast('El precio debe ser un número válido mayor o igual a 0.', 'error');
        elements.productPrice.focus();
        return false;
    }

    return true;
}

function createPayloadVariants(payload, includeId = false) {
    const full = { ...payload };

    const withoutLegacyCollection = { ...payload };
    delete withoutLegacyCollection.collection;

    const withoutModernCollection = { ...payload };
    delete withoutModernCollection.collection_id;

    const reducedOptional = { ...withoutLegacyCollection };
    delete reducedOptional.status;
    delete reducedOptional.show_on_dashboard;
    delete reducedOptional.featured;

    const minimal = {
        name: payload.name,
        price: payload.price,
        collection_id: payload.collection_id,
        category: payload.category,
        type: payload.type,
        description: payload.description,
        image: payload.image,
        sold_out: payload.sold_out
    };

    const variants = [full, withoutLegacyCollection, withoutModernCollection, reducedOptional, minimal]
        .map((variant) => {
            if (!includeId) return variant;
            return { ...variant, id: includeId };
        });

    const unique = [];
    const seen = new Set();
    for (const variant of variants) {
        const key = JSON.stringify(variant);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(variant);
    }

    return unique;
}

function getMissingColumnFromError(error) {
    const message = String(error?.message || '');
    const patterns = [
        /Could not find the '([^']+)' column/i,
        /column "([^"]+)" .* does not exist/i,
        /column ([a-zA-Z0-9_]+) does not exist/i
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match?.[1]) return match[1];
    }

    return null;
}

async function runWriteWithColumnFallback(initialPayload, writeFn) {
    const payload = { ...initialPayload };
    const removedColumns = new Set();
    let result = await writeFn(payload);

    while (result.error) {
        const missingColumn = getMissingColumnFromError(result.error);
        if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in payload)) {
            return result;
        }

        delete payload[missingColumn];
        removedColumns.add(missingColumn);
        result = await writeFn(payload);
    }

    return result;
}

async function saveProductToSupabase(payload) {
    const isEditing = state.editingId != null;
    const variants = createPayloadVariants(payload, isEditing ? false : Date.now());
    let lastError;

    for (const variant of variants) {
        const result = await runWriteWithColumnFallback(variant, (candidate) => {
            if (isEditing) {
                return supabaseClient
                    .from('products')
                    .update(candidate)
                    .eq('id', state.editingId);
            }

            return supabaseClient
                .from('products')
                .insert(candidate);
        });

        if (!result.error) {
            return;
        }

        lastError = result.error;
    }

    throw new Error(lastError?.message || (isEditing ? 'No se pudo actualizar el producto.' : 'No se pudo crear el producto.'));
}

async function handleSave(event) {
    event.preventDefault();

    if (state.saving || state.uploadingImages) return;
    const isEditing = state.editingId != null;

    try {
        state.saving = true;
        refreshModalUiState();

        // Images are already uploaded and in state.currentImages
        const payload = buildPayloadFromForm();
        if (!validatePayload(payload)) {
            return;
        }

        await saveProductToSupabase(payload);
        showToast(isEditing ? 'Producto actualizado.' : 'Producto creado.', 'success');
        state.modalBaseline = getModalSnapshot();
        setModalDirty(false);
        closeModal({ force: true });
        await loadProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Error guardando producto.', 'error');
    } finally {
        state.saving = false;
        refreshModalUiState();
    }
}

function getProductById(id) {
    return state.products.find((product) => String(product.id) === String(id)) || null;
}

async function handleDelete(id) {
    const product = getProductById(id);
    if (!product) return;

    const confirmed = window.confirm(`¿Borrar "${product.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const result = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

    if (result.error) {
        showToast(`Error borrando: ${result.error.message}`, 'error');
        return;
    }

    showToast('Producto borrado.', 'success');
    await loadProducts();
}

async function handleDuplicate(id) {
    const product = getProductById(id);
    if (!product) return;

    const payload = {
        name: `${product.name} (Copia)`,
        price: Number(product.price || 0),
        collection_id: product.collection_id || product.collection || (state.collections[0]?.id || FALLBACK_COLLECTION.id),
        collection: product.collection_id || product.collection || (state.collections[0]?.id || FALLBACK_COLLECTION.id),
        category: product.category || 'other',
        type: product.type || 'chockers',
        material: product.material || '',
        description: product.description || '',
        image: product.image || 'images/hero-background.jpg',
        images: normalizeImageArray(Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || 'images/hero-background.jpg']),
        sold_out: false,
        status: product.status || '',
        show_on_dashboard: product.show_on_dashboard !== false,
        featured: false,
        tags: Array.isArray(product.tags) ? product.tags : []
    };

    try {
        await saveProductToSupabase(payload);
        showToast('Producto duplicado.', 'success');
        await loadProducts();
    } catch (error) {
        showToast(error.message || 'No se pudo duplicar el producto.', 'error');
    }
}

async function quickUpdateProduct(id, patch) {
    const result = await supabaseClient
        .from('products')
        .update(patch)
        .eq('id', id);

    if (result.error) {
        showToast(`Error actualizando: ${result.error.message}`, 'error');
        return false;
    }

    return true;
}

async function handleToggleSold(id) {
    const product = getProductById(id);
    if (!product) return;

    const nextValue = !product.sold_out;
    const ok = await quickUpdateProduct(id, { sold_out: nextValue });
    if (!ok) return;

    showToast(nextValue ? 'Producto marcado como agotado.' : 'Producto marcado como disponible.', 'success');
    await loadProducts();
}

async function handleToggleVisibility(id) {
    const product = getProductById(id);
    if (!product) return;

    const current = product.show_on_dashboard !== false;
    const ok = await quickUpdateProduct(id, { show_on_dashboard: !current });
    if (!ok) return;

    showToast(!current ? 'Producto visible en web.' : 'Producto oculto en web.', 'success');
    await loadProducts();
}

async function handleProductListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!id) return;

    if (action === 'edit') {
        const product = getProductById(id);
        if (!product) return;
        openModal(product);
        return;
    }

    if (action === 'delete') {
        await handleDelete(id);
        return;
    }

    if (action === 'duplicate') {
        await handleDuplicate(id);
        return;
    }

    if (action === 'toggle-sold') {
        await handleToggleSold(id);
        return;
    }

    if (action === 'toggle-visibility') {
        await handleToggleVisibility(id);
    }
}



function exportProductsAsJson() {
    const payload = {
        generatedAt: new Date().toISOString(),
        collections: state.collections,
        products: state.products
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iuvene-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Exportación completada.', 'success');
}

function resetFilters() {
    state.filters = {
        query: '',
        type: 'all',
        status: 'all',
        collection: 'all',
        sort: 'newest'
    };

    elements.searchInput.value = '';
    elements.filterType.value = 'all';
    elements.filterStatus.value = 'all';
    elements.filterCollection.value = 'all';
    elements.filterSort.value = 'newest';

    applyFilters();
}

function bindFilterEvents() {
    const debouncedSearch = debounce((value) => {
        state.filters.query = value;
        applyFilters();
    }, 180);

    elements.searchInput.addEventListener('input', (event) => {
        debouncedSearch(event.target.value || '');
    });

    elements.filterType.addEventListener('change', (event) => {
        state.filters.type = event.target.value;
        applyFilters();
    });

    elements.filterStatus.addEventListener('change', (event) => {
        state.filters.status = event.target.value;
        applyFilters();
    });

    elements.filterCollection.addEventListener('change', (event) => {
        state.filters.collection = event.target.value;
        applyFilters();
    });

    elements.filterSort.addEventListener('change', (event) => {
        state.filters.sort = event.target.value;
        applyFilters();
    });

    elements.clearFiltersBtn.addEventListener('click', resetFilters);
}

function cacheElements() {
    elements.loginView = $('login-view');
    elements.dashboardView = $('dashboard-view');
    elements.loginForm = $('login-form');
    elements.loginBtn = $('login-btn');
    elements.logoutBtn = $('logout-btn');
    elements.loginError = $('login-error');

    elements.refreshBtn = $('refresh-btn');
    elements.exportBtn = $('export-btn');
    elements.clearCacheBtn = $('clear-cache-btn');

    elements.productsList = $('products-list');
    elements.productsSummary = $('products-summary');

    elements.statTotal = $('stat-total');
    elements.statVisible = $('stat-visible');
    elements.statSold = $('stat-sold');
    elements.statPromo = $('stat-promo');

    elements.searchInput = $('search-input');
    elements.filterType = $('filter-type');
    elements.filterStatus = $('filter-status');
    elements.filterCollection = $('filter-collection');
    elements.filterSort = $('filter-sort');
    elements.clearFiltersBtn = $('clear-filters-btn');

    elements.addBtn = $('add-product-btn');
    elements.modal = $('product-modal');
    elements.closeModalBtn = $('close-modal');
    elements.cancelBtn = $('cancel-btn');

    elements.modalTitle = $('modal-title');
    elements.modalSubtitle = $('modal-subtitle');
    elements.modalDirtyIndicator = $('modal-dirty-indicator');
    elements.productForm = $('product-form');
    elements.productId = $('p-id');
    elements.productName = $('p-name');
    elements.productPrice = $('p-price');

    elements.productDescription = $('p-description');
    elements.productStatus = $('p-status');
    elements.productSoldOut = $('p-soldout');
    elements.productDashboard = $('p-dashboard');
    elements.productFeatured = $('p-featured');


    elements.productImage = $('p-image');
    elements.productImages = $('p-images');

    // Image Manager Elements
    elements.imageUploadInput = $('image-upload-input');
    elements.imageDropZone = $('image-drop-zone');
    elements.imageManagerGrid = $('image-manager-grid');
    elements.triggerUploadBtn = $('trigger-upload-btn');
    elements.imageUrlInput = $('image-url-input');
    elements.addImageUrlBtn = $('add-image-url-btn');

    elements.previewMainImage = $('preview-main-image');
    elements.previewGallery = $('preview-gallery');
    elements.previewMeta = $('preview-meta');

    elements.saveBtn = $('save-btn');
    elements.toastRoot = $('toast-root');
}

function ensureRequiredElements() {
    const requiredIds = [
        'login-view',
        'dashboard-view',
        'login-form',
        'login-btn',
        'logout-btn',
        'products-list',
        'products-summary',
        'add-product-btn',
        'product-modal',
        'product-form',
        'p-name',
        'p-price',
        'save-btn',
        'toast-root'
    ];

    const missing = requiredIds.filter((id) => !$(id));
    if (missing.length > 0) {
        throw new Error(`Faltan elementos del panel: ${missing.join(', ')}`);
    }
}

function bindModalEvents() {
    elements.addBtn.addEventListener('click', () => openModal(null));
    elements.closeModalBtn.addEventListener('click', () => closeModal());
    elements.cancelBtn.addEventListener('click', () => closeModal());

    elements.modal.addEventListener('click', (event) => {
        if (event.target === elements.modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Image Manager Events
    if (elements.triggerUploadBtn) {
        elements.triggerUploadBtn.addEventListener('click', () => {
            elements.imageUploadInput.click();
        });
    }

    if (elements.imageUploadInput) {
        elements.imageUploadInput.addEventListener('change', async (e) => {
            await handleImageFiles(e.target.files);
            e.target.value = ''; // Reset to allow same file selection again
        });
    }

    if (elements.imageDropZone) {
        elements.imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.imageDropZone.classList.add('drag-over');
        });

        elements.imageDropZone.addEventListener('dragleave', () => {
            elements.imageDropZone.classList.remove('drag-over');
        });

        elements.imageDropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            elements.imageDropZone.classList.remove('drag-over');
            await handleImageFiles(e.dataTransfer.files);
        });
    }

    // Drag and Drop Grid Reordering
    if (elements.imageManagerGrid) {
        let draggedIndex = null;

        elements.imageManagerGrid.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.img-thumbnail-card');
            if (card) {
                draggedIndex = Number(card.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
                card.style.opacity = '0.5';
            }
        });

        elements.imageManagerGrid.addEventListener('dragend', (e) => {
            const card = e.target.closest('.img-thumbnail-card');
            if (card) card.style.opacity = '1';
        });

        elements.imageManagerGrid.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary for drop
            e.dataTransfer.dropEffect = 'move';
        });

        elements.imageManagerGrid.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetCard = e.target.closest('.img-thumbnail-card');
            if (targetCard && draggedIndex !== null) {
                const targetIndex = Number(targetCard.dataset.index);
                if (targetIndex !== draggedIndex) {
                    moveImagePosition(draggedIndex, targetIndex);
                }
            }
            draggedIndex = null;
        });

        elements.imageManagerGrid.addEventListener('click', (event) => {
            const actionBtn = event.target.closest('button[data-image-action]');
            if (!actionBtn) return;

            const index = Number(actionBtn.dataset.index);
            if (!Number.isFinite(index)) return;

            const action = actionBtn.dataset.imageAction;
            if (action === 'remove') {
                removeImageAt(index);
                return;
            }

            if (action === 'move-cover') {
                moveImagePosition(index, 0);
                return;
            }

            if (action === 'move-left') {
                moveImagePosition(index, index - 1);
            }
        });
    }

    if (elements.addImageUrlBtn && elements.imageUrlInput) {
        elements.addImageUrlBtn.addEventListener('click', () => {
            const added = addImageByUrl(elements.imageUrlInput.value);
            if (added) {
                elements.imageUrlInput.value = '';
                showToast('Imagen añadida desde URL.', 'success');
            }
        });

        elements.imageUrlInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.addImageUrlBtn.click();
        });
    }

    const watchFields = [
        elements.productName,
        elements.productPrice,

        elements.productDescription,
        elements.productStatus,
        elements.productSoldOut,
        elements.productDashboard,
        elements.productFeatured
    ];

    watchFields.filter(Boolean).forEach((field) => {
        const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
        field.addEventListener(eventName, markModalAsDirtyIfNeeded);
        if (eventName !== 'change') {
            field.addEventListener('change', markModalAsDirtyIfNeeded);
        }
    });

    elements.productForm.addEventListener('submit', handleSave);
}

function bindDashboardEvents() {
    elements.refreshBtn.addEventListener('click', async () => {
        showToast('Actualizando catálogo...', 'info');
        await loadProducts();
    });

    elements.exportBtn.addEventListener('click', exportProductsAsJson);
    elements.clearCacheBtn.addEventListener('click', clearStorefrontCache);

    elements.productsList.addEventListener('click', (event) => {
        handleProductListClick(event).catch((error) => {
            console.error(error);
            showToast('Error en acción de producto.', 'error');
        });
    });

    bindFilterEvents();
    bindModalEvents();
}

function showLogin() {
    elements.loginView.classList.remove('hidden');
    elements.dashboardView.classList.add('hidden');
}

function showDashboard() {
    elements.loginView.classList.add('hidden');
    elements.dashboardView.classList.remove('hidden');
}

async function loadCollections() {
    const result = await supabaseClient
        .from('collections')
        .select('*')
        .order('name', { ascending: true });

    if (result.error) {
        console.warn('Error loading collections:', result.error.message);
        state.collections = [FALLBACK_COLLECTION];
        renderCollectionOptions();
        showToast('No se pudieron cargar colecciones, usando fallback.', 'info');
        return;
    }

    state.collections = Array.isArray(result.data) && result.data.length > 0
        ? result.data
        : [FALLBACK_COLLECTION];

    renderCollectionOptions();
}

async function loadProducts() {
    setLoadingProducts();

    const result = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: false });

    if (result.error) {
        elements.productsList.innerHTML = '<div class="empty">Error cargando productos.</div>';
        showToast(`Error cargando productos: ${result.error.message}`, 'error');
        return;
    }

    state.products = Array.isArray(result.data) ? result.data : [];

    renderTypeFilterOptions();
    renderStats();
    applyFilters();
}

async function checkSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        showLoginError(error.message || 'No se pudo verificar sesión.');
        showLogin();
        return;
    }

    if (data.session) {
        showDashboard();
        await Promise.all([loadCollections(), loadProducts()]);
        return;
    }

    showLogin();
}

async function handleLogin(event) {
    event.preventDefault();
    clearLoginError();

    const email = $('email').value.trim();
    const password = $('password').value;

    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Entrando...';

    try {
        const result = await supabaseClient.auth.signInWithPassword({ email, password });

        if (result.error) {
            showLoginError(result.error.message || 'No se pudo iniciar sesión.');
            return;
        }

        showDashboard();
        showToast('Sesión iniciada.', 'success');
        await Promise.all([loadCollections(), loadProducts()]);
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Entrar';
    }
}

async function handleLogout() {
    const result = await supabaseClient.auth.signOut();
    if (result.error) {
        showToast(`Error cerrando sesión: ${result.error.message}`, 'error');
        return;
    }

    showLogin();
    showToast('Sesión cerrada.', 'info');
}

function initSupabase() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        return null;
    }

    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function init() {
    cacheElements();
    try {
        ensureRequiredElements();
    } catch (error) {
        console.error(error);
        if (elements.loginView && elements.dashboardView) {
            showLogin();
        }
        showLoginError(error.message || 'Error cargando el panel de administración.');
        return;
    }

    supabaseClient = initSupabase();

    if (!supabaseClient) {
        showLogin();
        showLoginError('No se pudo inicializar Supabase. Verifica la carga del script.');
        return;
    }

    elements.loginForm.addEventListener('submit', (event) => {
        handleLogin(event).catch((error) => {
            console.error(error);
            showLoginError('Error inesperado al iniciar sesión.');
        });
    });

    elements.logoutBtn.addEventListener('click', () => {
        handleLogout().catch((error) => {
            console.error(error);
            showToast('Error al cerrar sesión.', 'error');
        });
    });

    bindDashboardEvents();
    resetProductForm();

    checkSession().catch((error) => {
        console.error(error);
        showLogin();
        showLoginError('No se pudo cargar el panel.');
    });
}

function clearStorefrontCache() {
    const confirmed = window.confirm('¿Limpiar caché local de productos en este navegador?');
    if (!confirmed) return;

    const keys = [
        'iuvene-products-cache-v2',
        'iuvene-products-cache-v1',
        'iuvene-products-supa',
        'iuvene-products-supa-timestamp'
    ];

    keys.forEach((key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Ignore storage errors silently.
        }
    });

    showToast('Caché local limpiada.', 'success');
}

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'n') return;
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (!elements.dashboardView || elements.dashboardView.classList.contains('hidden')) return;
    if (elements.modal && elements.modal.classList.contains('active')) return;

    event.preventDefault();
    openModal(null);
});

// --- Supercharge Features ---

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    if (!tabs.length) return;

    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');

            // Fetch data
            if (targetId === 'orders-view') loadOrders();
            if (targetId === 'atelier-view') loadAtelier();
        });
    });
}

function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

async function loadOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--muted);">Cargando pedidos...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">No hay pedidos registrados aún.</div>';
            return;
        }

        container.innerHTML = data.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const itemsHtml = items.length > 0
                ? items.map((item) => `
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                            <span>${escapeHtml(item.quantity || 0)}x ${escapeHtml(item.name || 'Producto')}</span>
                            <span>${formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                        </div>
                    `).join('')
                : '<div style="color:var(--muted);">Pedido sin líneas de producto.</div>';

            return `
                <div class="order-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.8rem;">
                        <div>
                            <h3 style="font-size:1.1rem; margin-bottom:0.2rem;">${escapeHtml(order.customer_name || 'Cliente')}</h3>
                            <p style="color:var(--muted); font-size:0.9rem;">${escapeHtml(order.customer_contact || '-')}</p>
                        </div>
                        <div style="text-align:right;">
                            <span class="status-badge status-${normalizeStatusClass(order.status)}">${escapeHtml(order.status || 'Nuevo')}</span>
                            <div style="font-size:0.85rem; color:var(--muted); margin-top:0.3rem;">${formatDate(order.created_at)}</div>
                        </div>
                    </div>

                    <div style="background:#faf7f2; padding:0.8rem; border-radius:8px; margin-bottom:0.8rem; font-size:0.95rem;">
                        ${itemsHtml}
                    </div>

                    <div style="display:flex; justify-content:flex-end; align-items:center; gap:1rem;">
                        <div style="font-size:1.2rem; font-weight:700;">Total: ${formatPrice(order.total)}</div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error loading orders:', err);
        container.innerHTML = '<div class="login-error">Error al cargar pedidos.</div>';
    }
}

async function loadAtelier() {
    const container = document.getElementById('atelier-list');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--muted);">Cargando solicitudes...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('atelier_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty">No hay solicitudes de Atelier aún.</div>';
            return;
        }

        container.innerHTML = data.map((req) => `
            <div class="atelier-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.8rem;">
                    <div>
                        <h3 style="font-size:1.1rem; margin-bottom:0.2rem;">${escapeHtml(req.name || 'Solicitud Atelier')}</h3>
                        <div style="font-size:0.85rem; color:var(--muted);">${formatDate(req.created_at)}</div>
                    </div>
                    <span class="status-badge status-${normalizeStatusClass(req.status)}">${escapeHtml(req.status || 'Nuevo')}</span>
                </div>

                <div style="display:grid; gap:0.25rem; margin-bottom:0.85rem;">
                    <div><strong>Preferencia Contacto:</strong> ${escapeHtml(req.contact || '-')}</div>
                    <div><strong>Email:</strong> ${escapeHtml(req.email || '-')}</div>
                    <div><strong>Teléfono:</strong> ${escapeHtml(req.phone || '-')}</div>
                    <div><strong>Fecha Evento:</strong> ${escapeHtml(req.event_date || 'No especificada')}</div>
                    ${req.related_product ? `<div><strong>Interesado en:</strong> ${escapeHtml(req.related_product)}</div>` : ''}
                </div>

                <div style="background:#faf7f2; padding:1rem; border-radius:8px;">
                    <strong style="display:block; margin-bottom:0.4rem; font-size:0.9rem;">Detalles / Idea:</strong>
                    <p style="white-space:pre-wrap; color:#444;">${escapeHtml(req.details || 'Sin detalles')}</p>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error loading atelier:', err);
        container.innerHTML = '<div class="login-error">Error al cargar solicitudes.</div>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    init(); // Run original init
    setupTabs(); // Setup new tabs
});
