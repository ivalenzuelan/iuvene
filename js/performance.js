// Performance Optimization Script for Iuvene Website
// This script handles various performance improvements

(function() {
    'use strict';
    
    // Critical performance optimizations
    const PerformanceOptimizer = {
        
        // Image lazy loading with intersection observer
        initLazyLoading() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            
                            // Load the image
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.classList.remove('lazy');
                                img.classList.add('loaded');
                                
                                // Remove observer once loaded
                                observer.unobserve(img);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px 0px',
                    threshold: 0.01
                });
                
                // Observe all lazy images
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
                
                // Observe dynamically added images
                const mutationObserver = new MutationObserver(mutations => {
                    mutations.forEach(mutation => {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                const lazyImages = node.querySelectorAll ? node.querySelectorAll('img[data-src]') : [];
                                lazyImages.forEach(img => imageObserver.observe(img));
                            }
                        });
                    });
                });
                
                mutationObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        },
        
        // Preload critical resources
        preloadCriticalResources() {
            const criticalResources = [
                { href: 'css/style.css', as: 'style' },
                { href: 'js/main.js', as: 'script' },
                { href: 'data/products.json', as: 'fetch', crossorigin: 'anonymous' }
            ];
            
            criticalResources.forEach(resource => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = resource.href;
                link.as = resource.as;
                if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
                document.head.appendChild(link);
            });
        },
        
        // Optimize font loading
        optimizeFontLoading() {
            // Preload critical fonts
            const fonts = [
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap'
            ];
            
            fonts.forEach(fontUrl => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = fontUrl;
                link.as = 'style';
                link.onload = function() { this.rel = 'stylesheet'; };
                document.head.appendChild(link);
            });
        },
        
        // Implement service worker for caching
        initServiceWorker() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            console.log('SW registered: ', registration);
                        })
                        .catch(registrationError => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }
        },
        
        // Optimize scroll performance
        optimizeScrolling() {
            let ticking = false;
            
            function updateScrollPosition() {
                // Add scroll-based optimizations here
                ticking = false;
            }
            
            function requestTick() {
                if (!ticking) {
                    requestAnimationFrame(updateScrollPosition);
                    ticking = true;
                }
            }
            
            window.addEventListener('scroll', requestTick, { passive: true });
        },
        
        // Debounce resize events
        optimizeResize() {
            let resizeTimer;
            
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    // Handle resize optimizations
                    this.handleResize();
                }, 250);
            }, { passive: true });
        },
        
        handleResize() {
            // Recalculate layouts if needed
            const event = new CustomEvent('optimizedResize');
            window.dispatchEvent(event);
        },
        
        // Optimize images for different screen sizes
        optimizeImages() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                // Add responsive image attributes
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                // Add decoding attribute for better performance
                if (!img.hasAttribute('decoding')) {
                    img.setAttribute('decoding', 'async');
                }
            });
        },
        
        // Monitor performance metrics
        monitorPerformance() {
            if ('PerformanceObserver' in window) {
                const supported = (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) || [];
                
                // Monitor Largest Contentful Paint
                if (supported.includes('largest-contentful-paint')) {
                    try {
                        const lcpObserver = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            const lastEntry = entries[entries.length - 1];
                            if (lastEntry) {
                                console.log('LCP:', lastEntry.startTime);
                            }
                        });
                        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                    } catch (e) {
                        console.debug('LCP observation not supported:', e && e.message);
                    }
                }
                
                // Monitor First Input Delay
                if (supported.includes('first-input')) {
                    try {
                        const fidObserver = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            entries.forEach(entry => {
                                console.log('FID:', entry.processingStart - entry.startTime);
                            });
                        });
                        fidObserver.observe({ entryTypes: ['first-input'] });
                    } catch (e) {
                        console.debug('FID observation not supported:', e && e.message);
                    }
                }
                
                // Monitor Cumulative Layout Shift
                if (supported.includes('layout-shift')) {
                    try {
                        const clsObserver = new PerformanceObserver((list) => {
                            let clsValue = 0;
                            const entries = list.getEntries();
                            entries.forEach(entry => {
                                if (!entry.hadRecentInput) {
                                    clsValue += entry.value;
                                }
                            });
                            console.log('CLS:', clsValue);
                        });
                        clsObserver.observe({ entryTypes: ['layout-shift'] });
                    } catch (e) {
                        console.debug('CLS observation not supported:', e && e.message);
                    }
                } else {
                    console.debug('Ignoring unsupported PerformanceObserver entryTypes: layout-shift');
                }
            }
        },
        
        // Initialize all optimizations
        init() {
            // Run immediately
            this.preloadCriticalResources();
            this.optimizeFontLoading();
            this.optimizeImages();
            
            // Run when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initLazyLoading();
                    this.optimizeScrolling();
                    this.optimizeResize();
                    this.monitorPerformance();
                });
            } else {
                this.initLazyLoading();
                this.optimizeScrolling();
                this.optimizeResize();
                this.monitorPerformance();
            }
            
            // Run when window is loaded
            window.addEventListener('load', () => {
                this.initServiceWorker();
            });
        }
    };
    
    // Initialize performance optimizations
    PerformanceOptimizer.init();
    
    // Expose to global scope for debugging
    window.PerformanceOptimizer = PerformanceOptimizer;
    
})();