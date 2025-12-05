// Dynamic Background Slideshow System
// Cycles through images from "Pruebas portada" folder

class BackgroundSlideshow {
    constructor() {
        this.images = [
            'images/Pruebas portada/10.png',
            'images/Pruebas portada/11.png',
            'images/Pruebas portada/12.png',
            'images/Pruebas portada/13.png',
            'images/Pruebas portada/14.png',
            'images/Pruebas portada/IMG_9358.JPG',
            'images/Pruebas portada/iuvene (1).png'
        ];

        this.currentIndex = 0;
        this.intervalId = null;
        this.transitionDuration = 1000; // 1 second transition
        this.displayDuration = 5000; // 5 seconds per image
        this.heroElement = null;
        this.isInitialized = false;
        this.loadedImages = new Set(); // Track loaded images
        this.preloadQueue = []; // Queue for progressive loading
    }

    // Initialize the slideshow
    init() {
        this.heroElement = document.querySelector('.hero');
        if (!this.heroElement) {
            console.warn('Hero element not found for background slideshow');
            return;
        }

        console.log('🎬 Initializing background slideshow with', this.images.length, 'images');

        // Load first image immediately for fast initial display
        this.preloadImage(0, true);

        // Set initial background
        this.setBackground(0);

        // Preload next images progressively (not all at once)
        this.preloadNextImages(1, 2); // Preload next 2 images

        // Start the slideshow
        this.start();

        // Controls disabled per user request
        // this.addControls();

        this.isInitialized = true;
    }

    // Preload a single image
    preloadImage(index, immediate = false) {
        if (index < 0 || index >= this.images.length) return;

        const src = this.images[index];
        if (!src) return;

        // Check if already loaded
        if (this.loadedImages && this.loadedImages.has(src)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                if (!this.loadedImages) this.loadedImages = new Set();
                this.loadedImages.add(src);
                console.log(`✅ Preloaded image ${index + 1}/${this.images.length}: ${src.split('/').pop()}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`❌ Failed to load image: ${src}`);
                // Remove failed image from array
                const indexToRemove = this.images.indexOf(src);
                if (indexToRemove > -1) {
                    this.images.splice(indexToRemove, 1);
                }
                reject(new Error(`Failed to load: ${src}`));
            };
            
            img.src = src;
        });
    }

    // Preload next N images progressively
    preloadNextImages(startIndex, count = 2) {
        if (!('requestIdleCallback' in window)) {
            // Fallback for browsers without requestIdleCallback
            for (let i = 0; i < count; i++) {
                const index = (startIndex + i) % this.images.length;
                setTimeout(() => this.preloadImage(index), i * 500);
            }
            return;
        }

        // Use requestIdleCallback for non-critical image loading
        requestIdleCallback(() => {
            for (let i = 0; i < count; i++) {
                const index = (startIndex + i) % this.images.length;
                this.preloadImage(index);
            }
        }, { timeout: 2000 });
    }

    // Set background image with smooth transition
    setBackground(index) {
        if (!this.heroElement || !this.images[index]) return;

        const imageUrl = this.images[index];

        // Check if image is loaded, if not, wait for it
        const isLoaded = this.loadedImages && this.loadedImages.has(imageUrl);
        
        if (!isLoaded) {
            // If image not loaded yet, preload it first
            this.preloadImage(index, true).then(() => {
                this.setBackground(index);
            }).catch(() => {
                // If image fails, skip to next
                this.next();
            });
            return;
        }

        // Create new background layer for smooth transition
        const newBackground = document.createElement('div');
        newBackground.className = 'hero-background-layer';
        newBackground.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${imageUrl}');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            opacity: 0;
            transition: opacity ${this.transitionDuration}ms ease-in-out;
            z-index: -2;
            will-change: opacity;
        `;

        this.heroElement.appendChild(newBackground);

        // Force reflow to ensure transition works
        newBackground.offsetHeight;

        // Fade in new background
        requestAnimationFrame(() => {
            newBackground.style.opacity = '1';
        });

        // Remove old background layers after transition
        setTimeout(() => {
            const oldLayers = this.heroElement.querySelectorAll('.hero-background-layer');
            oldLayers.forEach((layer, i) => {
                if (i < oldLayers.length - 1) { // Keep only the newest layer
                    layer.remove();
                }
            });
        }, this.transitionDuration + 100);

        console.log(`🖼️ Background changed to: ${imageUrl.split('/').pop()}`);
    }

    // Start the automatic slideshow
    start() {
        if (this.intervalId) return; // Already running

        console.log('▶️ Starting background slideshow');

        this.intervalId = setInterval(() => {
            this.next();
        }, this.displayDuration);
    }

    // Stop the slideshow
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Background slideshow stopped');
        }
    }

    // Go to next image
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        
        // Preload upcoming images before they're needed
        const nextIndex = (this.currentIndex + 1) % this.images.length;
        const nextNextIndex = (this.currentIndex + 2) % this.images.length;
        this.preloadNextImages(nextIndex, 2);
        
        this.setBackground(this.currentIndex);
        this.updateIndicators();
    }

    // Go to previous image
    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.setBackground(this.currentIndex);
        this.updateIndicators();
    }

    // Go to specific image
    goTo(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.setBackground(this.currentIndex);
            this.updateIndicators();
        }
    }

    // Add slideshow controls
    addControls() {
        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'slideshow-controls';
        controlsContainer.innerHTML = `
            <button class="slideshow-btn prev-btn" aria-label="Imagen anterior">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <div class="slideshow-indicators"></div>
            <button class="slideshow-btn next-btn" aria-label="Siguiente imagen">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            <button class="slideshow-btn play-pause-btn" aria-label="Pausar/Reproducir">
                <svg class="play-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <svg class="pause-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            </button>
        `;

        this.heroElement.appendChild(controlsContainer);

        // Create indicators
        this.createIndicators();

        // Add event listeners
        this.setupControlEvents();
    }

    // Create dot indicators
    createIndicators() {
        const indicatorsContainer = this.heroElement.querySelector('.slideshow-indicators');
        if (!indicatorsContainer) return;

        indicatorsContainer.innerHTML = '';

        this.images.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `slideshow-indicator ${index === 0 ? 'active' : ''}`;
            indicator.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
            indicator.addEventListener('click', () => {
                this.goTo(index);
                this.stop(); // Stop auto-play when user interacts
                setTimeout(() => this.start(), 10000); // Resume after 10 seconds
            });

            indicatorsContainer.appendChild(indicator);
        });
    }

    // Setup control event listeners
    setupControlEvents() {
        const prevBtn = this.heroElement.querySelector('.prev-btn');
        const nextBtn = this.heroElement.querySelector('.next-btn');
        const playPauseBtn = this.heroElement.querySelector('.play-pause-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.previous();
                this.stop();
                setTimeout(() => this.start(), 10000);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.next();
                this.stop();
                setTimeout(() => this.start(), 10000);
            });
        }

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }

        // Pause on hover
        this.heroElement.addEventListener('mouseenter', () => {
            this.stop();
        });

        this.heroElement.addEventListener('mouseleave', () => {
            this.start();
        });
    }

    // Toggle play/pause
    togglePlayPause() {
        const playIcon = this.heroElement.querySelector('.play-icon');
        const pauseIcon = this.heroElement.querySelector('.pause-icon');

        if (this.intervalId) {
            this.stop();
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        } else {
            this.start();
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
        }
    }

    // Update indicator dots
    updateIndicators() {
        const indicators = this.heroElement.querySelectorAll('.slideshow-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentIndex);
        });
    }

    // Keyboard navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.isInitialized) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previous();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.next();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
            }
        });
    }

    // Responsive behavior
    handleResize() {
        // Adjust slideshow for different screen sizes
        const isMobile = window.innerWidth <= 768;
        const controls = this.heroElement.querySelector('.slideshow-controls');

        if (controls) {
            controls.style.display = isMobile ? 'none' : 'flex';
        }
    }
}

// Polyfill for requestIdleCallback (for older browsers)
if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback, options) {
        const timeout = options && options.timeout ? options.timeout : 0;
        const start = performance.now();
        return setTimeout(function() {
            callback({
                didTimeout: timeout > 0 && (performance.now() - start) > timeout,
                timeRemaining: function() {
                    return Math.max(0, 50 - (performance.now() - start));
                }
            });
        }, 1);
    };
}

if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function(id) {
        clearTimeout(id);
    };
}

// Initialize background slideshow when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
        const slideshow = new BackgroundSlideshow();
        slideshow.init();
        // Keyboard navigation disabled (no controls)
        // slideshow.setupKeyboardNavigation();

        // Handle window resize (debounced)
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
            slideshow.handleResize();
            }, 250);
        }, { passive: true });

        // Expose to global scope for debugging
        window.backgroundSlideshow = slideshow;
    });
});