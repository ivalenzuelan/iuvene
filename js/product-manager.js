/**
 * Product Manager
 * Centralizes product loading and normalization from cache, Supabase, and local fallbacks.
 */

const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTk1NDksImV4cCI6MjA4NzAzNTU0OX0.iI2K0RY1s-tA3P2xu6IhmOch7YldfrTNw1wCzdE6o08';

const CACHE_KEY = 'iuvene-products-cache-v3';
const CACHE_TTL_MS = 5 * 60 * 1000;
const LOCAL_DATA_SOURCES = [
    'data/products-custom.json',
    'data/products.json'
];

function safeParseJson(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('ProductManager: invalid JSON cache ignored');
        return null;
    }
}

function toStringSafe(value, fallback = '') {
    return typeof value === 'string' ? value.trim() : (value == null ? fallback : String(value).trim());
}

function toNumberSafe(value, fallback = null) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function toBooleanSafe(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return fallback;
}

function slugify(value) {
    return toStringSafe(value, 'general')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'general';
}

function humanizeSlug(value) {
    const slug = toStringSafe(value, 'General');
    return slug
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeImagePath(path) {
    const value = toStringSafe(path);
    if (!value) return '';

    // Keep remote URLs untouched.
    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    // Keep root-relative paths untouched.
    if (value.startsWith('/')) {
        return value;
    }

    return value;
}

function dedupeStrings(values) {
    const seen = new Set();
    const result = [];

    values.forEach((value) => {
        const normalized = toStringSafe(value);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        result.push(normalized);
    });

    return result;
}

function normalizeProduct(rawProduct, index = 0) {
    const rawId = rawProduct && (rawProduct.id ?? rawProduct.product_id);
    const id = rawId != null ? rawId : `generated-${index + 1}`;

    const name = toStringSafe(rawProduct && rawProduct.name, `Producto ${index + 1}`);
    const material = toStringSafe(rawProduct && rawProduct.material, 'Material no especificado');

    const collectionRaw = rawProduct && (rawProduct.collection ?? rawProduct.collection_id ?? rawProduct.collectionId);
    const collection = slugify(collectionRaw || 'general');

    const imageCandidates = [];
    if (rawProduct && rawProduct.image) {
        imageCandidates.push(rawProduct.image);
    }
    if (rawProduct && Array.isArray(rawProduct.images)) {
        imageCandidates.push(...rawProduct.images);
    }

    const images = dedupeStrings(imageCandidates.map(normalizeImagePath));
    const fallbackImage = 'images/hero-background.jpg';
    const image = images[0] || fallbackImage;

    const price = toNumberSafe(rawProduct && rawProduct.price, null);

    return {
        ...rawProduct,
        id,
        name,
        material,
        type: toStringSafe(rawProduct && rawProduct.type, 'rings'),
        category: toStringSafe(rawProduct && rawProduct.category, 'silver'),
        collection,
        collection_id: collection,
        collectionName: toStringSafe(rawProduct && rawProduct.collectionName, humanizeSlug(collection)),
        description: toStringSafe(rawProduct && rawProduct.description, 'Joyería artesanal diseñada en Madrid.'),
        image,
        images: images.length > 0 ? images : [fallbackImage],
        price,
        soldOut: toBooleanSafe(rawProduct && (rawProduct.soldOut ?? rawProduct.sold_out), false),
        showOnDashboard: toBooleanSafe(rawProduct && rawProduct.showOnDashboard, true),
        featured: toBooleanSafe(rawProduct && rawProduct.featured, false),
        tags: Array.isArray(rawProduct && rawProduct.tags)
            ? rawProduct.tags.map((tag) => toStringSafe(tag)).filter(Boolean)
            : []
    };
}

function normalizeCollection(rawCollection, index = 0) {
    const rawName = rawCollection && rawCollection.name;
    const rawId = rawCollection && rawCollection.id;

    const id = slugify(rawId || rawName || `collection-${index + 1}`);

    return {
        ...rawCollection,
        id,
        name: toStringSafe(rawName, humanizeSlug(id)),
        description: toStringSafe(rawCollection && rawCollection.description, ''),
        image: normalizeImagePath(rawCollection && rawCollection.image)
    };
}

function buildCollectionsFromProducts(products, normalizedCollections) {
    if (normalizedCollections.length > 0) {
        const existingIds = new Set(normalizedCollections.map((collection) => collection.id));

        products.forEach((product) => {
            if (!product.collection || existingIds.has(product.collection)) return;

            normalizedCollections.push({
                id: product.collection,
                name: product.collectionName || humanizeSlug(product.collection),
                description: '',
                image: ''
            });
            existingIds.add(product.collection);
        });

        return normalizedCollections;
    }

    const map = new Map();

    products.forEach((product) => {
        if (!product.collection) return;
        if (!map.has(product.collection)) {
            map.set(product.collection, {
                id: product.collection,
                name: product.collectionName || humanizeSlug(product.collection),
                description: '',
                image: ''
            });
        }
    });

    return Array.from(map.values());
}

function normalizeData(rawData) {
    const rawProducts = Array.isArray(rawData && rawData.products) ? rawData.products : [];
    const rawCollections = Array.isArray(rawData && rawData.collections) ? rawData.collections : [];

    const products = rawProducts.map((product, index) => normalizeProduct(product, index));
    const collections = buildCollectionsFromProducts(
        products,
        rawCollections.map((collection, index) => normalizeCollection(collection, index))
    );

    return { products, collections };
}

function createSupabaseClient() {
    try {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            return null;
        }

        return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (error) {
        console.warn('ProductManager: Supabase client initialization failed', error);
        return null;
    }
}

class ProductManager {
    constructor() {
        if (ProductManager.instance) {
            return ProductManager.instance;
        }

        ProductManager.instance = this;

        this.products = [];
        this.collections = [];
        this.isLoaded = false;
        this.loadingPromise = null;
        this.lastSource = null;

        this.supabaseClient = createSupabaseClient();
    }

    async init() {
        if (this.isLoaded) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = this.loadProducts();
        return this.loadingPromise;
    }

    readCache({ allowExpired = false } = {}) {
        let cached;
        try {
            cached = safeParseJson(localStorage.getItem(CACHE_KEY));
        } catch (error) {
            return null;
        }

        if (!cached || !Array.isArray(cached.products) || !Array.isArray(cached.collections)) {
            return null;
        }

        const age = Date.now() - Number(cached.timestamp || 0);
        if (!allowExpired && age > CACHE_TTL_MS) {
            return null;
        }

        return {
            products: cached.products,
            collections: cached.collections
        };
    }

    writeCache(products, collections) {
        try {
            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    products,
                    collections
                })
            );
        } catch (error) {
            console.warn('ProductManager: cache write skipped', error);
        }
    }

    applyData(rawData, source) {
        const normalized = normalizeData(rawData);

        this.products = normalized.products;
        this.collections = normalized.collections;
        this.isLoaded = true;
        this.lastSource = source;

        this.dispatchReadyEvent(source);
    }

    async loadProducts() {
        // 1. Network First: Try Supabase
        try {
            const supabaseData = await this.fetchFromSupabase();
            this.applyData(supabaseData, 'supabase');
            this.writeCache(this.products, this.collections);
            console.log('✅ ProductManager: Loaded from Supabase');
            return;
        } catch (supabaseError) {
            console.warn('ProductManager: Supabase load failed, trying fallbacks', supabaseError);
        }

        // 2. Fallback: Cache
        const freshCache = this.readCache({ allowExpired: true });
        if (freshCache) {
            this.applyData(freshCache, 'cache');
            console.log('ProductManager: Loaded from cache (fallback)');
            return;
        }

        // 3. Fallback: Local Sources
        const localData = await this.fetchFromLocalSources();
        if (localData) {
            this.applyData(localData, 'local');
            this.writeCache(this.products, this.collections);
            console.log('ProductManager: Loaded from local sources (fallback)');
            return;
        }

        const error = new Error('No product data source available');
        this.dispatchErrorEvent(error);
        throw error;
    }

    async fetchFromSupabase() {
        if (!this.supabaseClient) {
            throw new Error('Supabase client unavailable');
        }

        const [productsResult, collectionsResult] = await Promise.all([
            this.supabaseClient.from('products').select('*').order('id'),
            this.supabaseClient.from('collections').select('*')
        ]);

        if (productsResult.error) throw productsResult.error;
        if (collectionsResult.error) throw collectionsResult.error;

        return {
            products: productsResult.data || [],
            collections: collectionsResult.data || []
        };
    }

    async fetchFromLocalSources() {
        for (const source of LOCAL_DATA_SOURCES) {
            try {
                const response = await fetch(source, { cache: 'no-store' });
                if (!response.ok) continue;
                const data = await response.json();
                if (Array.isArray(data.products)) {
                    return data;
                }
            } catch (error) {
                // Try next source.
            }
        }

        if (window.CollectionScanner) {
            try {
                const scanner = new window.CollectionScanner();
                const scanned = await scanner.scanCollections();
                if (Array.isArray(scanned.products)) {
                    return scanned;
                }
            } catch (error) {
                console.warn('ProductManager: CollectionScanner fallback failed', error);
            }
        }

        return null;
    }

    dispatchReadyEvent(source) {
        window.dispatchEvent(new CustomEvent('products:ready', {
            detail: {
                products: this.products,
                collections: this.collections,
                source
            }
        }));
    }

    dispatchErrorEvent(error) {
        window.dispatchEvent(new CustomEvent('products:error', {
            detail: { error }
        }));
    }

    getAllProducts() {
        return this.products;
    }

    getAllCollections() {
        return this.collections;
    }

    getProductById(id) {
        const target = String(id);
        return this.products.find((product) => String(product.id) === target);
    }

    getProductsByCollection(collectionId) {
        const normalizedId = slugify(collectionId);
        return this.products.filter((product) => product.collection === normalizedId);
    }
}

window.productManager = new ProductManager();
