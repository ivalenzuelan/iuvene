// Service Worker for Iuvene Jewelry Website
// Provides offline functionality and performance improvements

const CACHE_NAME = 'iuvene-v1.3.0';
const STATIC_CACHE = 'iuvene-static-v1.3.0';
const DYNAMIC_CACHE = 'iuvene-dynamic-v1.3.0';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/product-detail.html',
    '/css/style.css',
    '/js/main.js',
    '/js/product-detail.js',
    '/js/performance.js',
    '/js/cart.js',
    '/js/product-manager.js',
    '/data/products.json',
    '/data/products-custom.json',
    '/data/products-collections.json',
    '/images/hero-background.jpg',
    '/images/ProductsCollections/ColeccionGalicia/background.jpg',
    '/images/ProductsCollections/ColeccionGus/background.jpg',
    '/images/ProductsCollections/ColeccionPrimas/background.jpg',
    '/favicon/favicon-32x32.png',
    '/favicon/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests (except fonts)
    if (url.origin !== location.origin && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(request)
    );
});

async function handleFetchRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Strategy 1: Cache First (for static assets)
        if (isStaticAsset(request)) {
            return await cacheFirst(request);
        }
        
        // Strategy 2: Network First (for dynamic content)
        if (isDynamicContent(request)) {
            return await networkFirst(request);
        }
        
        // Strategy 3: Stale While Revalidate (for images)
        if (isImage(request)) {
            return await staleWhileRevalidate(request);
        }
        
        // Default: Network First
        return await networkFirst(request);
        
    } catch (error) {
        console.error('Service Worker: Fetch error', error);
        
        // Return offline fallback if available
        return await getOfflineFallback(request);
    }
}

// Cache First strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// Network First strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const networkResponsePromise = fetch(request)
        .then(networkResponse => {
            if (networkResponse.ok) {
                const cache = caches.open(DYNAMIC_CACHE);
                cache.then(c => c.put(request, networkResponse.clone()));
            }
            return networkResponse;
        })
        .catch(() => null);
    
    return cachedResponse || await networkResponsePromise;
}

// Helper functions
function isStaticAsset(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/css/') || 
           url.pathname.includes('/js/') || 
           url.pathname.endsWith('.html') ||
           url.hostname.includes('fonts.googleapis.com') ||
           url.hostname.includes('fonts.gstatic.com');
}

function isDynamicContent(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/data/') || 
           url.pathname.includes('/api/');
}

function isImage(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/images/') ||
           request.destination === 'image';
}

async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // Return cached page for navigation requests
    if (request.mode === 'navigate') {
        const cachedPage = await caches.match('/index.html');
        if (cachedPage) {
            return cachedPage;
        }
    }
    
    // Return cached image placeholder for images
    if (isImage(request)) {
        const cachedImage = await caches.match('/images/placeholder.jpg');
        if (cachedImage) {
            return cachedImage;
        }
    }
    
    // Return generic offline response
    return new Response('Offline - Content not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}

// Background sync for newsletter subscriptions
self.addEventListener('sync', event => {
    if (event.tag === 'newsletter-sync') {
        event.waitUntil(syncNewsletterSubscriptions());
    }
});

async function syncNewsletterSubscriptions() {
    try {
        // Get pending subscriptions from IndexedDB
        const pendingSubscriptions = await getPendingSubscriptions();
        
        for (const subscription of pendingSubscriptions) {
            try {
                // Attempt to submit to Google Forms
                const response = await fetch('/submit-newsletter', {
                    method: 'POST',
                    body: JSON.stringify(subscription),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Remove from pending list
                    await removePendingSubscription(subscription.id);
                }
            } catch (error) {
                console.error('Failed to sync subscription:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Placeholder functions for IndexedDB operations
async function getPendingSubscriptions() {
    // Implement IndexedDB retrieval
    return [];
}

async function removePendingSubscription(id) {
    // Implement IndexedDB removal
}

// Push notifications (for future implementation)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/favicon/android-chrome-192x192.png',
            badge: '/favicon/favicon-32x32.png',
            tag: 'iuvene-notification',
            requireInteraction: true,
            actions: [
                {
                    action: 'view',
                    title: 'Ver productos'
                },
                {
                    action: 'close',
                    title: 'Cerrar'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Performance monitoring
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'PERFORMANCE_MEASURE') {
        // Log performance metrics
        console.log('Performance measure:', event.data.data);
    }
});
