/**
 * Shopping Cart Functionality
 */

class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('iuvene-cart')) || [];
        this.total = 0;
        this.count = 0;
        this.init();
    }

    init() {
        this.calculateTotals();
        this.renderCartIcon();
        this.setupEventListeners();
    }

    addItem(product, quantity = 1) {
        // Validate product object
        if (!product) {
            console.error('Cart: Cannot add item - product is null or undefined');
            this.showNotification('Error: Producto no válido', 'error');
            return false;
        }

        // Validate required fields
        if (!product.id) {
            console.error('Cart: Cannot add item - product.id is missing', product);
            this.showNotification('Error: Producto sin ID válido', 'error');
            return false;
        }

        if (!product.name) {
            console.error('Cart: Cannot add item - product.name is missing', product);
            this.showNotification('Error: Producto sin nombre', 'error');
            return false;
        }

        // Ensure quantity is a valid number
        quantity = parseInt(quantity) || 1;
        if (quantity <= 0) {
            quantity = 1;
        }

        // Ensure price is a valid number (default to 0 if missing)
        const price = parseFloat(product.price) || 0;

        // Find existing item
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: price,
                image: product.image || '',
                quantity: quantity
            });
        }

        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.showNotification('Producto añadido al carrito', 'success');
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.calculateTotals();
        this.updateUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.calculateTotals();
                this.updateUI();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
        this.calculateTotals();
        this.updateUI();
    }

    calculateTotals() {
        this.count = this.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        this.total = this.items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);
    }

    saveCart() {
        localStorage.setItem('iuvene-cart', JSON.stringify(this.items));
    }

    renderCartIcon() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            // Ensure cart-btn has position relative for absolute positioning of badge
            const cartBtnStyle = window.getComputedStyle(cartBtn);
            if (cartBtnStyle.position === 'static') {
                cartBtn.style.position = 'relative';
            }

            let countBadge = cartBtn.querySelector('.cart-count');
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.className = 'cart-count';
                cartBtn.appendChild(countBadge);
            }
            
            countBadge.textContent = this.count;
            
            // Show/hide badge based on count
            if (this.count > 0) {
                countBadge.style.display = 'flex';
                countBadge.style.visibility = 'visible';
            } else {
                countBadge.style.display = 'none';
                countBadge.style.visibility = 'hidden';
            }
        }
    }

    renderCartModal() {
        let modal = document.getElementById('cart-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cart-modal';
            modal.className = 'cart-modal';
            document.body.appendChild(modal);
        }

        const itemsHtml = this.items.map(item => {
            const itemId = item.id;
            const itemQuantity = parseInt(item.quantity) || 1;
            const itemPrice = parseFloat(item.price) || 0;
            return `
            <div class="cart-item" data-item-id="${itemId}">
                <img src="${item.image || ''}" alt="${item.name || 'Producto'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
                <div class="cart-item-details">
                    <h4>${item.name || 'Producto'}</h4>
                    <p class="cart-item-price">€${itemPrice.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="qty-decrease" data-item-id="${itemId}">-</button>
                        <span>${itemQuantity}</span>
                        <button class="qty-increase" data-item-id="${itemId}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-item-id="${itemId}">×</button>
            </div>
        `;
        }).join('');

        modal.innerHTML = `
            <div class="cart-content">
                <div class="cart-header">
                    <h3>Tu Carrito</h3>
                    <button class="close-cart">×</button>
                </div>
                <div class="cart-items">
                    ${this.items.length ? itemsHtml : '<p class="empty-cart">Tu carrito está vacío</p>'}
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span>€${this.total.toFixed(2)}</span>
                    </div>
                    <button class="checkout-btn" ${this.items.length === 0 ? 'disabled' : ''}>
                        Finalizar Compra
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners using event delegation
        this.attachCartModalListeners(modal);
    }

    attachCartModalListeners(modal) {
        // Close button
        const closeBtn = modal.querySelector('.close-cart');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleCart());
        }

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.toggleCart();
            }
        });

        // Quantity controls and remove buttons using event delegation
        modal.addEventListener('click', (e) => {
            const itemId = parseInt(e.target.getAttribute('data-item-id'));
            if (!itemId) return;

            if (e.target.classList.contains('qty-decrease')) {
                const item = this.items.find(i => i.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, (parseInt(item.quantity) || 1) - 1);
                }
            } else if (e.target.classList.contains('qty-increase')) {
                const item = this.items.find(i => i.id === itemId);
                if (item) {
                    this.updateQuantity(itemId, (parseInt(item.quantity) || 1) + 1);
                }
            } else if (e.target.classList.contains('remove-item')) {
                this.removeItem(itemId);
            }
        });
    }

    toggleCart() {
        let modal = document.getElementById('cart-modal');
        if (!modal) {
            this.renderCartModal();
            modal = document.getElementById('cart-modal');
        }
        
        // Always re-render to ensure fresh data
        this.renderCartModal();
        
        modal.classList.toggle('open');
        document.body.style.overflow = modal.classList.contains('open') ? 'hidden' : '';
    }

    updateUI() {
        this.renderCartIcon();
        if (document.getElementById('cart-modal')?.classList.contains('open')) {
            this.renderCartModal();
        }
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }

    setupEventListeners() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCart();
            });
        }
    }
}

// Initialize cart - ensure it's available globally before DOM is ready
let cart;

// Initialize cart when DOM is ready or immediately if already loaded
function initializeCart() {
    if (!cart) {
        cart = new ShoppingCart();
        window.cart = cart; // Make accessible globally
        
        // Also expose it on document for compatibility
        document.cart = cart;
        
        console.log('Cart initialized successfully');
    }
    return cart;
}

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    // DOM is already loaded
    initializeCart();
}
