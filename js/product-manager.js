/**
 * Product Manager
 * Centralizes product loading, caching, and retrieval from Supabase.
 */

// Initialize Supabase Client
const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTk1NDksImV4cCI6MjA4NzAzNTU0OX0.iI2K0RY1s-tA3P2xu6IhmOch7YldfrTNw1wCzdE6o08';

// Initialize Supabase Client safely
let supabase;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        console.error('❌ Supabase client not found on window object');
    }
} catch (e) {
    console.error('❌ Error initializing Supabase client:', e);
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

        // Initialize only if supabase is available
        if (supabase) {
            this.init();
        } else {
            console.error('❌ ProductManager: Supabase not initialized, skipping data load');
        }
    }

    async init() {
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = this.loadProducts();
        return this.loadingPromise;
    }

    async loadProducts() {
        if (!supabase) {
            console.error('❌ ProductManager: Cannot load products, Supabase client missing');
            return;
        }
        try {
            console.log('🎯 ProductManager: Loading products from Supabase...');

            // 1. Check Cache (5 min TTL) implementation remains for perf
            const cachedData = localStorage.getItem('iuvene-products-supa');
            const cacheTimestamp = localStorage.getItem('iuvene-products-supa-timestamp');
            const now = Date.now();

            if (cachedData && (now - (cacheTimestamp || 0) < 300000)) {
                // ... (rest of caching logic)
                const data = JSON.parse(cachedData);
                this.products = data.products;
                this.collections = data.collections;
                this.isLoaded = true;
                this.dispatchReadyEvent();
                console.log('✅ ProductManager: Loaded cached products');
                // Background refresh
                this.fetchFromSupabase();
                return;
            }

            // 2. Fetch from Supabase
            await this.fetchFromSupabase();

        } catch (error) {
            console.error('❌ ProductManager: Error loading products', error);
            this.dispatchErrorEvent(error);
        }
    }
    // ... rest of class methods ...
    async fetchFromSupabase() {
        try {
            const [productsResult, collectionsResult] = await Promise.all([
                supabase.from('products').select('*').order('id'),
                supabase.from('collections').select('*')
            ]);

            if (productsResult.error) throw productsResult.error;
            if (collectionsResult.error) throw collectionsResult.error;

            // Transform data to match frontend expectations (camelCase)
            this.products = productsResult.data.map(this.transformProduct);
            this.collections = collectionsResult.data;

            // Update cache
            const cacheData = { products: this.products, collections: this.collections };
            localStorage.setItem('iuvene-products-supa', JSON.stringify(cacheData));
            localStorage.setItem('iuvene-products-supa-timestamp', Date.now().toString());

            this.isLoaded = true;
            this.dispatchReadyEvent();
            console.log('✅ ProductManager: Loaded Supabase products');

        } catch (error) {
            console.error('❌ ProductManager: Supabase fetch error', error);
            throw error;
        }
    }

    transformProduct(p) {
        return {
            ...p,
            collection: p.collection_id, // Map snake_case to camelCase
            soldOut: p.sold_out,
            showOnDashboard: p.show_on_dashboard,
            // Ensure images is always an array
            images: p.images || [p.image]
        };
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
        return this.products.filter(p => p.collection_id === collectionId);
    }

    getAllCollections() {
        return this.collections;
    }
}

// Initialize globally
window.productManager = new ProductManager();
