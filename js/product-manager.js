/**
 * Product Manager
 * Centralizes product loading, caching, and retrieval.
 */

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

        // Initialize
        this.init();
    }

    async init() {
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = this.loadProducts();
        return this.loadingPromise;
    }

    async loadProducts() {
        try {
            console.log('🎯 ProductManager: Loading products...');

            // 1. Try custom products
            try {
                const response = await fetch('data/products-custom.json?v=' + Date.now());
                if (response.ok) {
                    const data = await response.json();
                    this.products = data.products || [];
                    this.collections = data.collections || [];
                    this.isLoaded = true;
                    this.dispatchReadyEvent();
                    console.log('✅ ProductManager: Loaded custom products');
                    return;
                }
            } catch (e) {
                console.log('⚠️ ProductManager: Custom products not found');
            }

            // 2. Try automatic scanner (if available globally)
            if (window.CollectionScanner) {
                try {
                    const scanner = new CollectionScanner();
                    const data = await scanner.scanCollections();
                    if (data && data.products && data.products.length > 0) {
                        this.products = data.products;
                        this.collections = data.collections;
                        this.isLoaded = true;
                        this.dispatchReadyEvent();
                        console.log('✅ ProductManager: Loaded scanned products');
                        return;
                    }
                } catch (e) {
                    console.error('⚠️ ProductManager: Scanner failed', e);
                }
            }

            // 3. Check Cache
            const cachedData = localStorage.getItem('iuvene-products');
            const cacheTimestamp = localStorage.getItem('iuvene-products-timestamp');
            const now = Date.now();

            if (cachedData && (now - (cacheTimestamp || 0) < 300000)) { // 5 min cache
                const data = JSON.parse(cachedData);
                this.products = data.products;
                this.collections = data.collections;
                this.isLoaded = true;
                this.dispatchReadyEvent();
                console.log('✅ ProductManager: Loaded cached products');
                return;
            }

            // 4. Fallback to main JSON
            const response = await fetch('data/products.json?v=' + now);
            if (response.ok) {
                const data = await response.json();
                this.products = data.products;
                this.collections = data.collections;

                // Update cache
                localStorage.setItem('iuvene-products', JSON.stringify(data));
                localStorage.setItem('iuvene-products-timestamp', now.toString());

                this.isLoaded = true;
                this.dispatchReadyEvent();
                console.log('✅ ProductManager: Loaded JSON products');
            } else {
                throw new Error('Failed to load products.json');
            }

        } catch (error) {
            console.error('❌ ProductManager: Error loading products', error);
            // Fallback hardcoded data could go here if absolutely necessary
            this.dispatchErrorEvent(error);
        }
    }

    dispatchReadyEvent() {
        window.dispatchEvent(new CustomEvent('products:ready', {
            detail: { products: this.products, collections: this.collections }
        }));
    }

    dispatchErrorEvent(error) {
        window.dispatchEvent(new CustomEvent('products:error', { detail: { error } }));
    }

    getAllProducts() {
        return this.products;
    }

    getProductById(id) {
        // Handle both string and number IDs
        return this.products.find(p => p.id == id);
    }

    getProductsByCollection(collectionId) {
        return this.products.filter(p => p.collection === collectionId);
    }

    getAllCollections() {
        return this.collections;
    }
}

// Initialize globally
window.productManager = new ProductManager();
