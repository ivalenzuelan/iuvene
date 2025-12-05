/**
 * Shopping Cart Functionality
 * Refactored for resilience and performance
 */

class ShoppingCart {
    constructor() {
        if (ShoppingCart.instance) {
            return ShoppingCart.instance;
        }
        ShoppingCart.instance = this;

        this.items = JSON.parse(localStorage.getItem('iuvene-cart')) || [];
        this.total = 0;
        this.count = 0;
        this.modalInitialized = false;

        // Bind methods to ensure 'this' context
        this.toggleCart = this.toggleCart.bind(this);
        this.handleModalClick = this.handleModalClick.bind(this);

        this.init();
    }

    init() {
        this.calculateTotals();

        // Wait for DOM to be ready for UI elements
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        this.renderCartIcon();
        this.setupGlobalListeners();

        // Pre-create modal structure but don't show it
        this.createModalStructure();

        console.log('🛒 ShoppingCart: Initialized');
    }

    setupGlobalListeners() {
        // Cart button click - delegate to document to handle dynamic buttons
        document.addEventListener('click', (e) => {
            const cartBtn = e.target.closest('.cart-btn');
            if (cartBtn) {
                e.preventDefault();
                this.toggleCart();
            }
        });
    }

    createModalStructure() {
        if (document.getElementById('cart-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.className = 'cart-modal';

        // Static structure
        modal.innerHTML = `
            <div class="cart-content">
                <div class="cart-header">
                    <h3>Tu Carrito</h3>
                    <button class="close-cart" aria-label="Cerrar carrito">×</button>
                </div>
                <div class="cart-items" id="cart-items-container">
                    <!-- Items will be injected here -->
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span id="cart-total-amount">€0.00</span>
                    </div>
                    <button class="checkout-btn" id="checkout-btn">
                        Finalizar Compra
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Attach listeners ONCE
        modal.addEventListener('click', this.handleModalClick);

        this.modalInitialized = true;
    }

    handleModalClick(e) {
        const modal = document.getElementById('cart-modal');

        // Close on backdrop click
        if (e.target === modal) {
            this.toggleCart();
            return;
        }

        // Close button
        if (e.target.closest('.close-cart')) {
            this.toggleCart();
            return;
        }

        // Quantity Controls & Remove
        const target = e.target;
        const itemId = target.getAttribute('data-item-id');

        if (itemId) {
            if (target.classList.contains('qty-decrease')) {
                const item = this.items.find(i => i.id == itemId);
                if (item) this.updateQuantity(itemId, (parseInt(item.quantity) || 1) - 1);
            } else if (target.classList.contains('qty-increase')) {
                const item = this.items.find(i => i.id == itemId);
                if (item) this.updateQuantity(itemId, (parseInt(item.quantity) || 1) + 1);
            } else if (target.classList.contains('remove-item')) {
                this.removeItem(itemId);
            }
        }
    }

    renderCartContent() {
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-amount');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
            checkoutBtn.disabled = true;
        } else {
            container.innerHTML = this.items.map(item => {
                const itemQuantity = parseInt(item.quantity) || 1;
                const itemPrice = parseFloat(item.price) || 0;
                return `
                <div class="cart-item" data-item-id="${item.id}">
                    <img src="${item.image || ''}" alt="${item.name || 'Producto'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E'">
                    <div class="cart-item-details">
                        <h4>${item.name || 'Producto'}</h4>
                        <p class="cart-item-price">€${itemPrice.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button class="qty-decrease" data-item-id="${item.id}">-</button>
                            <span>${itemQuantity}</span>
                            <button class="qty-increase" data-item-id="${item.id}">+</button>
                        </div>
                    </div>
                    <button class="remove-item" data-item-id="${item.id}">×</button>
                </div>
            `;
            }).join('');
            checkoutBtn.disabled = false;
        }

        if (totalEl) {
            totalEl.textContent = `€${this.total.toFixed(2)}`;
        }
    }

    toggleCart() {
        let modal = document.getElementById('cart-modal');
        if (!modal) {
            this.createModalStructure();
            modal = document.getElementById('cart-modal');
        }

        if (modal.classList.contains('open')) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        } else {
            this.renderCartContent(); // Update content before showing
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    addItem(product, quantity = 1) {
        if (!product || !product.id) {
            console.error('Cart: Invalid product', product);
            this.showNotification('Error: Producto no válido', 'error');
            return false;
        }

        // Check if product is sold out
        if (product.soldOut === true) {
            console.warn('Cart: Cannot add sold out product', product.name);
            this.showNotification('Este producto está agotado y no se puede añadir al carrito', 'error');
            return false;
        }

        quantity = Math.max(1, parseInt(quantity) || 1);
        const price = parseFloat(product.price) || 0;

        // Ensure ID is consistent (string comparison)
        const existingItem = this.items.find(item => item.id == product.id);
        
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

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));

        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id != productId);
        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.renderCartContent(); // Re-render modal if open
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id == productId);
        if (item) {
            const newQty = parseInt(quantity);
            if (newQty <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQty;
                this.saveCart();
                this.calculateTotals();
                this.updateUI();
                this.renderCartContent(); // Re-render modal
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
            }
        }
    }

    calculateTotals() {
        this.count = this.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        this.total = this.items.reduce((sum, item) => {
            return sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0));
        }, 0);
    }

    saveCart() {
        localStorage.setItem('iuvene-cart', JSON.stringify(this.items));
    }

    updateUI() {
        this.renderCartIcon();
    }

    renderCartIcon() {
        const cartBtns = document.querySelectorAll('.cart-btn');
        cartBtns.forEach(cartBtn => {
            let countBadge = cartBtn.querySelector('.cart-count');
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.className = 'cart-count';
                cartBtn.appendChild(countBadge);
                // Ensure relative positioning
                if (window.getComputedStyle(cartBtn).position === 'static') {
                    cartBtn.style.position = 'relative';
                }
            }

            countBadge.textContent = this.count;

            if (this.count > 0) {
                countBadge.style.display = 'flex';
                countBadge.style.visibility = 'visible';
            } else {
                countBadge.style.display = 'none';
                countBadge.style.visibility = 'hidden';
            }
        });
    }

    showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Force reflow
        notification.offsetHeight;

        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize singleton
window.cart = new ShoppingCart();
