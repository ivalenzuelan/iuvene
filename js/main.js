// Enhanced Product and collection data management
let products = [];
let collections = [];
let currentCollection = null;
let filteredProducts = [];
let currentFilters = {
    type: 'all',
    category: 'all',
    priceRange: 'all',
    search: ''
};

// Performance optimization: Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load products from Drive (if enabled) or JSON file with error handling and caching
async function loadProducts() {
    try {
        // 1) Try Google Drive if enabled
        if (window.IUVENE_DRIVE_CONFIG && window.IUVENE_DRIVE_CONFIG.enabled && window.IuveneDrive) {
            try {
                const built = await window.IuveneDrive.buildCollectionsAndProducts();
                if (built && built.products && built.products.length) {
                    products = built.products;
                    collections = built.collections || [];
                    filteredProducts = [...products];
                    displayProducts(products);
                    setupCollectionNavigation();
                    setupFilters();
                    setupSearch();
                    return;
                }
            } catch (e) {
                console.warn('Drive source failed, falling back to JSON:', e);
            }
        }

        // Check if data is cached in localStorage
        const cachedData = localStorage.getItem('iuvene-products');
        const cacheTimestamp = localStorage.getItem('iuvene-products-timestamp');
        const now = Date.now();
        const cacheAge = now - (cacheTimestamp || 0);

        // Use cache if it's less than 5 minutes old
        if (cachedData && cacheAge < 300000) {
            console.log('Using cached data');
            const data = JSON.parse(cachedData);
            products = data.products;
            collections = data.collections;
            console.log('Cached products:', products.length, 'products');
            displayProducts(products);
            setupCollectionNavigation();
            setupFilters();
            return;
        }

        const response = await fetch('data/products.json?v=' + now);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('Products loaded from JSON:', data.products.length, 'products');

        // Cache the data
        localStorage.setItem('iuvene-products', JSON.stringify(data));
        localStorage.setItem('iuvene-products-timestamp', now.toString());

        products = data.products;
        collections = data.collections;
        filteredProducts = [...products];

        console.log('About to display products:', products);
        displayProducts(products);
        setupCollectionNavigation();
        setupFilters();
        setupSearch();

    } catch (error) {
        console.error('Error loading products from JSON:', error);
        console.log('Falling back to hardcoded products...');

        // Fallback to hardcoded products if JSON fails to load
        products = [
            {
                id: 1,
                name: "Fluid Ring",
                material: "9K Gold - Sapphire",
                type: "rings",
                category: "gemstone",
                collection: "oceana",
                image: "images/products/fluid-ring/main.jpg",
                images: ["images/products/fluid-ring/main.jpg"]
            },
            {
                id: 2,
                name: "Wakame Threader",
                material: "Sterling Silver",
                type: "earrings",
                category: "silver",
                collection: "oceana",
                image: "images/products/wakame-threader/main.jpg",
                images: ["images/products/wakame-threader/main.jpg"]
            },
            {
                id: 3,
                name: "Kelp Pendant",
                material: "Sterling Silver",
                type: "necklaces",
                category: "silver",
                collection: "oceana",
                image: "images/products/kelp-pendant/main.jpg",
                images: ["images/products/kelp-pendant/main.jpg"]
            },
            {
                id: 4,
                name: "Waterway Studs",
                material: "9K Gold",
                type: "earrings",
                category: "gold",
                collection: "everyday",
                image: "images/products/waterway-studs/main.jpg",
                images: ["images/products/waterway-studs/main.jpg"]
            },
            {
                id: 5,
                name: "Ripple Ring",
                material: "Sterling Silver",
                type: "rings",
                category: "silver",
                collection: "everyday",
                image: "images/products/ripple-ring/main.jpg",
                images: ["images/products/ripple-ring/main.jpg"]
            },
            {
                id: 6,
                name: "Elaz Threader",
                material: "Sterling Silver",
                type: "earrings",
                category: "silver",
                collection: "bespoke",
                image: "images/products/elaz-threader/main.jpg",
                images: ["images/products/elaz-threader/main.jpg"]
            }
        ];

        // Fallback collections
        collections = [
            {
                id: "oceana",
                name: "Oceana",
                description: "Inspired by Australia's coastal waters and marine life",
                image: "images/collections/collection-oceana.jpg"
            },
            {
                id: "everyday",
                name: "Everyday",
                description: "Timeless pieces for daily wear and special occasions",
                image: "images/collections/collection-everyday.jpg"
            },
            {
                id: "bespoke",
                name: "Bespoke",
                description: "Custom-made pieces tailored to your unique style",
                image: "images/collections/collection-gemstone.jpg"
            }
        ];

        filteredProducts = [...products];
        displayProducts(products);
        setupCollectionNavigation();
        setupFilters();
        setupSearch();
    }
}

// DOM elements
let productsGrid;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements after DOM is ready
    productsGrid = document.getElementById('products-grid');
    
    if (!productsGrid) {
        console.error('Products grid element not found!');
        return;
    }
    
    console.log('Products grid found:', productsGrid);
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    }
}

// Enhanced display products with loading states and animations
function displayProducts(productsToShow) {
    console.log('displayProducts called with:', productsToShow.length, 'products');
    
    if (!productsGrid) {
        console.error('Products grid not found in displayProducts!');
        return;
    }

    // Show loading state
    productsGrid.innerHTML = '<div class="loading-spinner">Cargando productos...</div>';

    // Simulate loading for better UX
    setTimeout(() => {
        productsGrid.innerHTML = '';

        if (productsToShow.length === 0) {
            console.log('No products to show');
            productsGrid.innerHTML = `
                <div class="no-products">
                    <h3>No se encontraron productos</h3>
                    <p>Intenta ajustar tus filtros o buscar algo diferente.</p>
                    <button onclick="clearAllFilters()" class="clear-filters-btn">Limpiar filtros</button>
                </div>
            `;
            return;
        }

        console.log('Creating product cards for', productsToShow.length, 'products');
        productsToShow.forEach((product, index) => {
            console.log('Creating card for product:', product.name);
            const productCard = createProductCard(product);
            productCard.style.animationDelay = `${index * 0.1}s`;
            productCard.classList.add('fade-in');
            productsGrid.appendChild(productCard);
        });

        // Update product count
        updateProductCount(productsToShow.length);
        console.log('Products displayed successfully');
    }, 300);
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card clickable';

    // Add sold out badge if product is sold out
    const soldOutBadge = product.soldOut ? '<div class="sold-out-badge">Sold Out</div>' : '';

    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            ${soldOutBadge}
        </div>
        <div class="product-info">
            <div class="product-material">${product.material}</div>
            <div class="product-name">${product.name}</div>
        </div>
    `;

    // Make entire card clickable
    card.addEventListener('click', () => {
        window.location.href = `product-detail.html?id=${product.id}`;
    });

    return card;
}

// Handle newsletter form submission
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    // Show success message
    const message = document.createElement('div');
    message.textContent = 'Thank you for subscribing!';
    message.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #8b7355;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        z-index: 1002;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(message);

    // Remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);

    // Reset form
    e.target.reset();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Collection navigation functions
function setupCollectionNavigation() {
    // Make collection cards clickable
    const collectionCards = document.querySelectorAll('.collection-card');
    collectionCards.forEach(card => {
        card.addEventListener('click', () => {
            const collectionId = card.dataset.collection;
            filterByCollection(collectionId);
        });
    });

    // Add "View All" button functionality
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            viewAllProducts();
        });
    }
}

function filterByCollection(collectionId) {
    currentCollection = collectionId;

    // Find the collection name for display
    const collection = collections.find(c => c.id === collectionId);
    const collectionName = collection ? collection.name : 'Collection';

    // Filter products by collection
    const filteredProducts = products.filter(product => product.collection === collectionId);

    // Update page title and heading
    document.title = `${collectionName} Collection - Iuvene`;

    // Update products section heading
    const productsHeading = document.querySelector('.products h2');
    if (productsHeading) {
        productsHeading.textContent = `${collectionName} Collection`;
    }

    // Add collection description
    let collectionDescription = document.querySelector('.collection-description');
    if (!collectionDescription) {
        collectionDescription = document.createElement('p');
        collectionDescription.className = 'collection-description';
        collectionDescription.style.cssText = `
            text-align: center;
            margin-bottom: 2rem;
            color: #6b6b6b;
            font-size: 1.1rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        `;

        const productsSection = document.querySelector('.products .container');
        productsSection.insertBefore(collectionDescription, productsSection.firstChild);
    }

    if (collection) {
        collectionDescription.textContent = collection.description;
    }

    // Display filtered products
    displayProducts(filteredProducts);

    // Update collection cards to show active state
    updateCollectionActiveState(collectionId);

    // Show "View All" button
    showViewAllButton();

    // Scroll to products section
    document.querySelector('.products').scrollIntoView({ behavior: 'smooth' });
}

function viewAllProducts() {
    currentCollection = null;

    // Reset page title
    document.title = 'Iuvene - Handcrafted Jewelry & Accessories';

    // Reset products section heading
    const productsHeading = document.querySelector('.products h2');
    if (productsHeading) {
        productsHeading.textContent = 'Our Collection';
    }

    // Remove collection description
    const collectionDescription = document.querySelector('.collection-description');
    if (collectionDescription) {
        collectionDescription.textContent = '';
    }

    // Display all products
    displayProducts(products);

    // Remove active state from all collection cards
    updateCollectionActiveState(null);

    // Hide "View All" button
    hideViewAllButton();
}

function updateCollectionActiveState(activeCollectionId) {
    const collectionCards = document.querySelectorAll('.collection-card');
    collectionCards.forEach(card => {
        if (card.dataset.collection === activeCollectionId) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

function showViewAllButton() {
    let viewAllBtn = document.querySelector('.view-all-btn');
    if (!viewAllBtn) {
        viewAllBtn = document.createElement('button');
        viewAllBtn.className = 'view-all-btn';
        viewAllBtn.textContent = '← View All Collections';
        viewAllBtn.style.cssText = `
            background: #8b7355;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            margin: 2rem auto;
            display: block;
            transition: all 0.3s ease;
        `;

        viewAllBtn.addEventListener('mouseenter', () => {
            viewAllBtn.style.background = '#6b5a3f';
        });

        viewAllBtn.addEventListener('mouseleave', () => {
            viewAllBtn.style.background = '#8b7355';
        });

        const productsSection = document.querySelector('.products .container');
        productsSection.appendChild(viewAllBtn);
        viewAllBtn.addEventListener('click', viewAllProducts);
    }
}

function hideViewAllButton() {
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.remove();
    }
}

// Enhanced filtering system
function setupFilters() {
    // Create filter UI if it doesn't exist
    createFilterUI();

    // Setup filter event listeners
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');

    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            currentFilters.type = e.target.value;
            applyFilters();
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            applyFilters();
        });
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', (e) => {
            currentFilters.priceRange = e.target.value;
            applyFilters();
        });
    }
}

function createFilterUI() {
    const productsSection = document.querySelector('.products .container');
    if (!productsSection || document.querySelector('.filter-container')) return;

    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container collapsed';
    filterContainer.innerHTML = `
        <div class="filter-toggle">
            <button class="filter-toggle-btn" onclick="toggleFilters()">
                <svg class="filter-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span class="filter-text">Filtrar productos</span>
                <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="product-count-compact">
                <span id="product-count">Mostrando ${products.length} productos</span>
            </div>
        </div>
        <div class="filter-content">
            <div class="filter-header">
                <h3>Opciones de filtrado</h3>
                <button class="clear-filters-btn" onclick="clearAllFilters()">Limpiar filtros</button>
            </div>
            <div class="filter-options">
                <div class="filter-group">
                    <label for="type-filter">Tipo:</label>
                    <select id="type-filter">
                        <option value="all">Todos</option>
                        <option value="rings">Anillos</option>
                        <option value="earrings">Pendientes</option>
                        <option value="necklaces">Collares</option>
                        <option value="bangles">Pulseras</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="category-filter">Material:</label>
                    <select id="category-filter">
                        <option value="all">Todos</option>
                        <option value="gold">Oro</option>
                        <option value="silver">Plata</option>
                        <option value="brass">Latón</option>
                        <option value="gemstone">Piedras preciosas</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="price-filter">Precio:</label>
                    <select id="price-filter">
                        <option value="all">Todos</option>
                        <option value="0-100">€0 - €100</option>
                        <option value="100-200">€100 - €200</option>
                        <option value="200-300">€200 - €300</option>
                        <option value="300+">€300+</option>
                    </select>
                </div>
            </div>
        </div>
    `;

    productsSection.insertBefore(filterContainer, productsGrid);
}

function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    if (!searchBtn) return;

    // Create search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <input type="text" id="search-input" placeholder="Buscar productos..." style="display: none;">
        <button class="search-close-btn" style="display: none;">×</button>
    `;

    searchBtn.parentNode.appendChild(searchContainer);

    const searchInput = document.getElementById('search-input');
    const searchCloseBtn = document.querySelector('.search-close-btn');

    // Toggle search input
    searchBtn.addEventListener('click', () => {
        const isVisible = searchInput.style.display !== 'none';
        searchInput.style.display = isVisible ? 'none' : 'block';
        searchCloseBtn.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            currentFilters.search = '';
            applyFilters();
        }
    });

    // Close search
    searchCloseBtn.addEventListener('click', () => {
        searchInput.style.display = 'none';
        searchCloseBtn.style.display = 'none';
        searchInput.value = '';
        currentFilters.search = '';
        applyFilters();
    });

    // Search functionality with debounce
    const debouncedSearch = debounce((value) => {
        currentFilters.search = value.toLowerCase();
        applyFilters();
    }, 300);

    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

function applyFilters() {
    let filtered = [...products];

    // Apply collection filter
    if (currentCollection) {
        filtered = filtered.filter(product => product.collection === currentCollection);
    }

    // Apply type filter
    if (currentFilters.type !== 'all') {
        filtered = filtered.filter(product => product.type === currentFilters.type);
    }

    // Apply category filter
    if (currentFilters.category !== 'all') {
        filtered = filtered.filter(product => product.category === currentFilters.category);
    }

    // Apply price filter
    if (currentFilters.priceRange !== 'all') {
        filtered = filtered.filter(product => {
            const price = product.price || 0;
            switch (currentFilters.priceRange) {
                case '0-100': return price <= 100;
                case '100-200': return price > 100 && price <= 200;
                case '200-300': return price > 200 && price <= 300;
                case '300+': return price > 300;
                default: return true;
            }
        });
    }

    // Apply search filter
    if (currentFilters.search) {
        filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(currentFilters.search) ||
            product.material.toLowerCase().includes(currentFilters.search) ||
            (product.description && product.description.toLowerCase().includes(currentFilters.search))
        );
    }

    filteredProducts = filtered;
    displayProducts(filtered);

    // Update filter container visual state
    updateFilterState();
}

function clearAllFilters() {
    currentFilters = {
        type: 'all',
        category: 'all',
        priceRange: 'all',
        search: ''
    };

    // Reset filter UI
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');

    if (typeFilter) typeFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    if (priceFilter) priceFilter.value = 'all';
    if (searchInput) {
        searchInput.value = '';
        searchInput.style.display = 'none';
        document.querySelector('.search-close-btn').style.display = 'none';
    }

    applyFilters();
}

function updateProductCount(count) {
    const productCount = document.getElementById('product-count');
    if (productCount) {
        productCount.textContent = `Mostrando ${count} producto${count !== 1 ? 's' : ''}`;
    }
}

// Enhanced collection filtering
function filterByCollection(collectionId) {
    currentCollection = collectionId;

    // Clear other filters when selecting collection
    currentFilters = {
        type: 'all',
        category: 'all',
        priceRange: 'all',
        search: ''
    };

    // Reset filter UI
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');

    if (typeFilter) typeFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    if (priceFilter) priceFilter.value = 'all';

    // Find the collection name for display
    const collection = collections.find(c => c.id === collectionId);
    const collectionName = collection ? collection.name : 'Collection';

    // Update page title and heading
    document.title = `${collectionName} Collection - Iuvene`;

    // Update products section heading
    const productsHeading = document.querySelector('.products h2');
    if (productsHeading) {
        productsHeading.textContent = `Colección ${collectionName}`;
    }

    // Add collection description
    let collectionDescription = document.querySelector('.collection-description');
    if (!collectionDescription) {
        collectionDescription = document.createElement('p');
        collectionDescription.className = 'collection-description';
        collectionDescription.style.cssText = `
            text-align: center;
            margin-bottom: 2rem;
            color: #6b6b6b;
            font-size: 1.1rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        `;

        const productsSection = document.querySelector('.products .container');
        const filterContainer = document.querySelector('.filter-container');
        if (filterContainer) {
            productsSection.insertBefore(collectionDescription, filterContainer);
        } else {
            productsSection.insertBefore(collectionDescription, productsSection.firstChild);
        }
    }

    if (collection) {
        collectionDescription.textContent = collection.description;
    }

    // Apply filters
    applyFilters();

    // Update collection cards to show active state
    updateCollectionActiveState(collectionId);

    // Show "View All" button
    showViewAllButton();

    // Scroll to products section
    document.querySelector('.products').scrollIntoView({ behavior: 'smooth' });
}

// Performance optimization: Lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observe all images with data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Enhanced error handling and user feedback
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#8b7355'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1002;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Toggle filters visibility
function toggleFilters() {
    const filterContainer = document.querySelector('.filter-container');
    const chevronIcon = document.querySelector('.chevron-icon');
    const filterText = document.querySelector('.filter-text');

    if (!filterContainer) return;

    const isCollapsed = filterContainer.classList.contains('collapsed');

    if (isCollapsed) {
        // Expand filters
        filterContainer.classList.remove('collapsed');
        filterContainer.classList.add('expanded');
        filterText.textContent = 'Ocultar filtros';

        // Rotate chevron up
        if (chevronIcon) {
            chevronIcon.style.transform = 'rotate(180deg)';
        }

        // Add smooth animation
        const filterContent = filterContainer.querySelector('.filter-content');
        if (filterContent) {
            filterContent.style.maxHeight = filterContent.scrollHeight + 'px';
        }
    } else {
        // Collapse filters
        filterContainer.classList.remove('expanded');
        filterContainer.classList.add('collapsed');
        filterText.textContent = 'Filtrar productos';

        // Rotate chevron down
        if (chevronIcon) {
            chevronIcon.style.transform = 'rotate(0deg)';
        }

        // Collapse with animation
        const filterContent = filterContainer.querySelector('.filter-content');
        if (filterContent) {
            filterContent.style.maxHeight = '0px';
        }
    }
}

// Update the clearAllFilters function to work with the new structure
function clearAllFilters() {
    currentFilters = {
        type: 'all',
        category: 'all',
        priceRange: 'all',
        search: ''
    };

    // Reset filter UI
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');

    if (typeFilter) typeFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    if (priceFilter) priceFilter.value = 'all';
    if (searchInput) {
        searchInput.value = '';
        searchInput.style.display = 'none';
        const searchCloseBtn = document.querySelector('.search-close-btn');
        if (searchCloseBtn) searchCloseBtn.style.display = 'none';
    }

    // Reset collection filter
    currentCollection = null;
    updateCollectionActiveState(null);
    hideViewAllButton();

    // Reset page title and description
    document.title = 'Iuvene - Handcrafted Jewelry & Accessories';
    const productsHeading = document.querySelector('.products h2');
    if (productsHeading) {
        productsHeading.textContent = 'Nuestra Colección';
    }

    const collectionDescription = document.querySelector('.collection-description');
    if (collectionDescription) {
        collectionDescription.textContent = '';
    }

    applyFilters();
}

// Update filter container visual state
function updateFilterState() {
    const filterContainer = document.querySelector('.filter-container');
    if (!filterContainer) return;

    // Check if any filters are active
    const hasActiveFilters =
        currentFilters.type !== 'all' ||
        currentFilters.category !== 'all' ||
        currentFilters.priceRange !== 'all' ||
        currentFilters.search !== '' ||
        currentCollection !== null;

    // Update visual state
    if (hasActiveFilters) {
        filterContainer.classList.add('has-active-filters');
    } else {
        filterContainer.classList.remove('has-active-filters');
    }

    // Update filter button text to show active state
    const filterText = document.querySelector('.filter-text');
    const isExpanded = filterContainer.classList.contains('expanded');

    if (filterText) {
        if (hasActiveFilters && !isExpanded) {
            filterText.textContent = 'Filtros activos - Ver opciones';
        } else if (isExpanded) {
            filterText.textContent = 'Ocultar filtros';
        } else {
            filterText.textContent = 'Filtrar productos';
        }
    }
}