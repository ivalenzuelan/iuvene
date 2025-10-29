// Product and collection data will be loaded from JSON file
let products = [];
let collections = [];
let currentCollection = null;

// Load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        products = data.products;
        collections = data.collections;
        displayProducts(products);
        setupCollectionNavigation();
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
                images: ["images/product-kelp-pendant.jpg", "images/product-kelp-pendant-2.jpg", "images/product-kelp-pendant-3.jpg"]
            },
            {
                id: 4,
                name: "Waterway Studs",
                material: "9K Gold",
                type: "earrings",
                category: "gold",
                collection: "everyday",
                image: "images/product-waterway-studs.jpg",
                images: ["images/product-waterway-studs.jpg", "images/product-waterway-studs-2.jpg"]
            },
            {
                id: 5,
                name: "Ripple Ring",
                material: "Sterling Silver",
                type: "rings",
                category: "silver",
                collection: "everyday",
                image: "images/product-ripple-ring.jpg",
                images: ["images/product-ripple-ring.jpg", "images/product-ripple-ring-2.jpg"]
            },
            {
                id: 6,
                name: "Elaz Threader",
                material: "Sterling Silver",
                type: "earrings",
                category: "silver",
                collection: "bespoke",
                image: "images/product-elaz-threader.jpg",
                images: ["images/product-elaz-threader.jpg", "images/product-elaz-threader-2.jpg"]
            }
        ];
        
        // Fallback collections
        collections = [
            {
                id: "oceana",
                name: "Oceana",
                description: "Inspired by Australia's coastal waters and marine life",
                image: "images/collection-oceana.jpg"
            },
            {
                id: "everyday",
                name: "Everyday",
                description: "Timeless pieces for daily wear and special occasions",
                image: "images/collection-everyday.jpg"
            },
            {
                id: "bespoke",
                name: "Bespoke",
                description: "Custom-made pieces tailored to your unique style",
                image: "images/collection-bespoke.jpg"
            }
        ];
        
        displayProducts(products);
        setupCollectionNavigation();
    }
}

// DOM elements
const productsGrid = document.getElementById('products-grid');


// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
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

// Display products
function displayProducts(productsToShow) {
    productsGrid.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card clickable';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
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





// Handle newsletter submission
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
