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
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.showNotification('Producto añadido al carrito');
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
        this.count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    saveCart() {
        localStorage.setItem('iuvene-cart', JSON.stringify(this.items));
    }

    renderCartIcon() {
        const cartBtn = document.querySelector('.cart-btn');
        if (cartBtn) {
            let countBadge = cartBtn.querySelector('.cart-count');
            if (!countBadge) {
                countBadge = document.createElement('span');
                countBadge.className = 'cart-count';
                cartBtn.appendChild(countBadge);
            }
            countBadge.textContent = this.count;
            countBadge.style.display = this.count > 0 ? 'flex' : 'none';
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

        const itemsHtml = this.items.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>€${item.price}</p>
                    <div class="quantity-controls">
                        <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="cart.removeItem(${item.id})">×</button>
            </div>
        `).join('');

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

        // Re-attach event listeners for the new modal content
        const closeBtn = modal.querySelector('.close-cart');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleCart());
        }
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

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
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

// Initialize cart
const cart = new ShoppingCart();
window.cart = cart; // Make accessible globally
