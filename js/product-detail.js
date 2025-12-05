// Enhanced Product data management with caching and error handling
let products = [];

// Load products from local @images/@ProductsCollections manifest or JSON file with caching
// Load products using ProductManager
async function loadProducts() {
    try {
        console.log('⏳ ProductDetail: Waiting for ProductManager...');

        // Ensure ProductManager is available
        if (!window.productManager) {
            throw new Error('ProductManager not found');
        }

        await window.productManager.init();
        products = window.productManager.getAllProducts();

        console.log('✅ ProductDetail: Products loaded:', products.length);

        if (products.length === 0) {
            console.warn('⚠️ ProductDetail: No products found');
            showErrorMessage('No se encontraron productos.');
            return;
        }

        loadProductDetails();
    } catch (error) {
        console.error('❌ ProductDetail: Error loading products:', error);
        showErrorMessage('Error cargando el producto. Por favor recarga la página.');
    }
}

function buildFromCollectionsManifest(manifest) {
    const root = (manifest.root || '').replace(/\/$/, '');
    const products = [];
    Object.keys(manifest.collections || {}).forEach(collectionName => {
        const productMap = manifest.collections[collectionName] || {};
        Object.keys(productMap).forEach(productName => {
            const imageFiles = productMap[productName] || [];
            if (imageFiles.length === 0) return;
            const imagePaths = imageFiles.map(fn => encodeURI(`${root}/${collectionName}/${productName}/${fn}`));
            products.push({
                id: Math.abs(hashString(`${collectionName}/${productName}`)),
                name: productName,
                material: '',
                image: imagePaths[0],
                images: imagePaths
            });
        });
    });
    return { products };
}

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i), h |= 0;
    return h;
}

function capitalizeWords(s) {
    return s.replace(/\b\w/g, c => c.toUpperCase());
}

// Get product ID from URL
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('id')) || 1;
}

// Global variables for image slider
let currentImageIndex = 0;
let productImages = [];

// Load product details
function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const product = products.find(p => p.id == productId);

    if (!product) {
        console.error('❌ ProductDetail: Product not found for ID:', productId);
        showErrorMessage('Producto no encontrado.');
        return;
    }



    // Update page title
    document.title = `${product.name} - Iuvene`;

    // Set up image slider
    setupImageSlider(product);

    // Update product information
    document.getElementById('product-material').textContent = product.material;
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-description').textContent = product.description;

    // Update price
    const priceElement = document.getElementById('product-price');
    console.log('Price element found:', priceElement);
    console.log('Product data:', product);
    console.log('Product price:', product.price);
    console.log('Product soldOut:', product.soldOut);

    if (priceElement) {
        if (product.soldOut) {
            priceElement.textContent = 'Sold Out';
            priceElement.className = 'product-price sold-out';
            console.log('Set price to Sold Out');
        } else {
            priceElement.textContent = `$${product.price}`;
            priceElement.className = 'product-price';
            console.log('Set price to $' + product.price);
        }
    } else {
        console.error('Price element not found!');
    }

    // Update WhatsApp link
    const whatsappLink = document.getElementById('whatsapp-link');
    const message = `Hi! I'm interested in ${product.name} - ${product.material}`;
    whatsappLink.href = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;

    // Update meta description for SEO
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = `Discover the ${product.name} - ${product.material}. ${product.description}`;
    }
}

// Set up image slider
function setupImageSlider(product) {
    // Use images array if available, otherwise fallback to single image
    productImages = product.images || [product.image];
    currentImageIndex = 0;

    // Update main image
    updateMainImage();

    // Create thumbnails
    createThumbnails();

    // Set up navigation buttons
    setupNavigationButtons();

    // Update navigation button states
    updateNavigationButtons();
}

// Update main image
function updateMainImage() {
    const productImage = document.getElementById('product-main-image');
    const currentImage = productImages[currentImageIndex];

    if (currentImage) {
        productImage.src = currentImage;
        productImage.alt = `Product image ${currentImageIndex + 1}`;
    }
}

// Create thumbnail gallery
function createThumbnails() {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    thumbnailGallery.innerHTML = '';

    productImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}" loading="lazy">`;

        thumbnail.addEventListener('click', () => {
            currentImageIndex = index;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        });

        thumbnailGallery.appendChild(thumbnail);
    });
}

// Update thumbnail states
function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.classList.toggle('active', index === currentImageIndex);
    });
}

// Set up navigation buttons
function setupNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentImageIndex < productImages.length - 1) {
            currentImageIndex++;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        }
    });
}

// Update navigation button states
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.disabled = currentImageIndex === 0;
    nextBtn.disabled = currentImageIndex === productImages.length - 1;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    function onProductsReady(e) {
        products = e.detail.products;
        loadProductDetails();
    }

    window.addEventListener('products:ready', onProductsReady);

    window.addEventListener('products:error', function (e) {
        console.error('Error loading products:', e.detail.error);
        showErrorMessage('Error cargando datos de productos.');
    });

    // Check if already loaded
    if (window.productManager && window.productManager.isLoaded) {
        products = window.productManager.getAllProducts();
        loadProductDetails();
    } else if (window.productManager) {
        window.productManager.init().catch(console.error);
    }
});
// Enhanced error handling and user feedback
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1002;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 300);
    }, 5000);
}

// Enhanced image preloading
function preloadImages(images) {
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Enhanced image slider with keyboard navigation
function setupImageSlider(product) {
    // Use images array if available, otherwise fallback to single image
    productImages = product.images || [product.image];
    currentImageIndex = 0;

    // Preload all images for better performance
    preloadImages(productImages);

    // Update main image
    updateMainImage();

    // Create thumbnails
    createThumbnails();

    // Set up navigation buttons
    setupNavigationButtons();

    // Set up keyboard navigation
    setupKeyboardNavigation();

    // Set up touch/swipe navigation
    setupTouchNavigation();

    // Update navigation button states
    updateNavigationButtons();
}

// Keyboard navigation for image slider
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
            e.preventDefault();
            currentImageIndex--;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        } else if (e.key === 'ArrowRight' && currentImageIndex < productImages.length - 1) {
            e.preventDefault();
            currentImageIndex++;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        }
    });
}

// Touch/swipe navigation for mobile
function setupTouchNavigation() {
    const mainImage = document.getElementById('product-main-image');
    if (!mainImage) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    mainImage.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });

    mainImage.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;

        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // Only trigger swipe if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0 && currentImageIndex > 0) {
                // Swipe right - previous image
                currentImageIndex--;
                updateMainImage();
                updateThumbnails();
                updateNavigationButtons();
            } else if (deltaX < 0 && currentImageIndex < productImages.length - 1) {
                // Swipe left - next image
                currentImageIndex++;
                updateMainImage();
                updateThumbnails();
                updateNavigationButtons();
            }
        }
    });
}

// Enhanced image loading with error handling
function updateMainImage() {
    const productImage = document.getElementById('product-main-image');
    const currentImage = productImages[currentImageIndex];

    if (currentImage && productImage) {
        // Show loading state
        productImage.style.opacity = '0.5';

        // Create new image to test loading
        const img = new Image();
        img.onload = () => {
            productImage.src = currentImage;
            productImage.alt = `Imagen del producto ${currentImageIndex + 1} de ${productImages.length}`;
            productImage.style.opacity = '1';
        };
        img.onerror = () => {
            console.error('Failed to load image:', currentImage);
            productImage.style.opacity = '1';
            // Could show placeholder image here
        };
        img.src = currentImage;
    }
}

// Enhanced thumbnail creation with lazy loading
function createThumbnails() {
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    if (!thumbnailGallery) return;

    thumbnailGallery.innerHTML = '';

    productImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumbnail.setAttribute('role', 'button');
        thumbnail.setAttribute('tabindex', '0');
        thumbnail.setAttribute('aria-label', `Ver imagen ${index + 1}`);

        const img = document.createElement('img');
        img.src = image;
        img.alt = `Miniatura ${index + 1}`;
        img.loading = 'lazy';

        thumbnail.appendChild(img);

        // Click handler
        thumbnail.addEventListener('click', () => {
            currentImageIndex = index;
            updateMainImage();
            updateThumbnails();
            updateNavigationButtons();
        });

        // Keyboard handler
        thumbnail.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                currentImageIndex = index;
                updateMainImage();
                updateThumbnails();
                updateNavigationButtons();
            }
        });

        thumbnailGallery.appendChild(thumbnail);
    });
}

// Enhanced WhatsApp integration with better message formatting
function setupWhatsAppLink(product) {
    const whatsappLink = document.getElementById('whatsapp-link');
    if (!whatsappLink || !product) return;

    const message = `¡Hola! Me interesa el ${product.name} en ${product.material}. 
    
¿Podrías darme más información sobre:
- Disponibilidad
- Precio: €${product.price || 'Consultar'}
- Opciones de envío
- Tiempo de entrega

¡Gracias!`;

    // You should replace this with your actual WhatsApp number
    const phoneNumber = '34123456789'; // Replace with actual number
    whatsappLink.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

// Enhanced product details loading with better error handling
function loadProductDetails() {
    const productId = getProductIdFromUrl();
    const product = products.find(p => p.id === productId);

    if (!product) {
        showErrorMessage('Producto no encontrado. Redirigiendo...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    try {
        // Update page title and meta
        document.title = `${product.name} - ${product.material} | Iuvene`;
        updateMetaTags(product);

        // Set up image slider
        setupImageSlider(product);

        // Update product information
        updateProductInfo(product);

        // Setup WhatsApp link
        setupWhatsAppLink(product);

        // Add structured data for SEO
        addStructuredData(product);

        // Setup Add to Cart
        setupAddToCart(product);

    } catch (error) {
        console.error('Error loading product details:', error);
        showErrorMessage('Error cargando los detalles del producto.');
    }
}

// Update product information with enhanced formatting and custom details
function updateProductInfo(product) {
    const elements = {
        material: document.getElementById('product-material'),
        title: document.getElementById('product-title'),
        description: document.getElementById('product-description'),
        price: document.getElementById('product-price')
    };

    if (elements.material) {
        elements.material.textContent = product.material;
    }

    if (elements.title) {
        elements.title.textContent = product.name;
    }

    if (elements.description) {
        elements.description.textContent = product.description || 'Hermosa pieza artesanal creada con técnicas tradicionales.';
    }

    if (elements.price) {
        if (product.soldOut) {
            elements.price.textContent = 'Agotado';
            elements.price.className = 'product-price sold-out';
        } else if (product.price) {
            elements.price.textContent = `€${product.price}`;
            elements.price.className = 'product-price';
        } else {
            elements.price.textContent = 'Precio bajo consulta';
            elements.price.className = 'product-price';
        }
    }

    // Add custom product details if available
    addCustomProductDetails(product);
}

// Add custom product details section (DISABLED - user doesn't want details)
function addCustomProductDetails(product) {
    // Remove any existing details container
    const existingContainer = document.querySelector('.product-custom-details');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Don't add any product details section
    return;
}

// Update meta tags for better SEO
function updateMetaTags(product) {
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = `${product.name} - ${product.material}. ${product.description || 'Joyería artesanal de alta calidad.'}`;
    }

    // Add Open Graph tags
    addOpenGraphTags(product);
}

// Add Open Graph tags for social media sharing
function addOpenGraphTags(product) {
    const ogTags = [
        { property: 'og:title', content: `${product.name} - Iuvene` },
        { property: 'og:description', content: product.description || 'Joyería artesanal de alta calidad' },
        { property: 'og:image', content: window.location.origin + '/' + product.image },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'product' }
    ];

    ogTags.forEach(tag => {
        let meta = document.querySelector(`meta[property="${tag.property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', tag.property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', tag.content);
    });
}

// Add structured data for SEO
function addStructuredData(product) {
    const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.description || "Joyería artesanal de alta calidad",
        "image": window.location.origin + '/' + product.image,
        "brand": {
            "@type": "Brand",
            "name": "Iuvene"
        },
        "offers": {
            "@type": "Offer",
            "price": product.price || 0,
            "priceCurrency": "EUR",
            "availability": product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
        }
    };

    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
}

// Enhanced navigation with better UX
function setupEnhancedNavigation() {
    // Add related products suggestion
    addRelatedProducts();
}

function addBreadcrumbs() {
    const productId = getProductIdFromUrl();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'breadcrumb';
    breadcrumb.innerHTML = `
        <a href="index.html">Inicio</a>
        <span>›</span>
        <a href="index.html#shop">Productos</a>
        <span>›</span>
        <span>${product.name}</span>
    `;

    const productDetail = document.querySelector('.product-detail');
    if (productDetail) {
        productDetail.insertBefore(breadcrumb, productDetail.firstChild);
    }
}

function addRelatedProducts() {
    const productId = getProductIdFromUrl();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Find related products (same collection or type)
    const relatedProducts = products
        .filter(p => p.id !== productId && (p.collection === product.collection || p.type === product.type))
        .slice(0, 3);

    if (relatedProducts.length === 0) return;

    const relatedSection = document.createElement('section');
    relatedSection.className = 'related-products';
    relatedSection.innerHTML = `
        <div class="container">
            <h3>Productos relacionados</h3>
            <div class="related-products-grid">
                ${relatedProducts.map(p => `
                    <div class="related-product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                        <div class="related-product-info">
                            <div class="related-product-material">${p.material}</div>
                            <div class="related-product-name">${p.name}</div>
                            ${p.price ? `<div class="related-product-price">€${p.price}</div>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    const backToProducts = document.querySelector('.back-to-products');
    if (backToProducts) {
        backToProducts.parentNode.insertBefore(relatedSection, backToProducts);
    }
}

// Initialize enhanced features
document.addEventListener('DOMContentLoaded', function () {
    loadProducts();

    // Setup enhanced navigation after products load
    setTimeout(() => {
        setupEnhancedNavigation();
    }, 1000);
});

// Add to Cart functionality
function setupAddToCart(product) {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (!addToCartBtn) return;

    // Check if product is sold out
    if (product.soldOut === true) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Agotado';
        addToCartBtn.style.opacity = '0.6';
        addToCartBtn.style.cursor = 'not-allowed';
        return; // Don't add event listener for sold out products
    }

    // Remove any existing listener to prevent duplicates
    const newBtn = addToCartBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

    // Re-select the button
    const btn = document.getElementById('add-to-cart-btn');

    // Add to cart click
    btn.addEventListener('click', () => {
        // Double-check sold out status before adding
        if (product.soldOut === true) {
            console.warn('Attempted to add sold out product:', product.name);
            if (window.cart) {
                window.cart.showNotification('Este producto está agotado', 'error');
            }
            return;
        }

        const quantity = 1;

        if (window.cart) {
            console.log('🛒 Adding to cart:', product.name, 'Qty:', quantity);
            window.cart.addItem(product, quantity);
        } else {
            console.error('Cart not initialized');
        }
    });
}