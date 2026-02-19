/**
 * Shopping Cart Functionality
 * Resilient localStorage handling and safe DOM rendering.
 */

class ShoppingCart {
    constructor() {
        if (ShoppingCart.instance) {
            return ShoppingCart.instance;
        }

        ShoppingCart.instance = this;

        this.storageKey = 'iuvene-cart';
        this.items = this.readStoredItems();
        this.total = 0;
        this.count = 0;

        this.toggleCart = this.toggleCart.bind(this);
        this.handleModalClick = this.handleModalClick.bind(this);

        this.init();
    }

    readStoredItems() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .map((item) => this.normalizeItem(item))
                .filter(Boolean);
        } catch (error) {
            console.warn('Cart: stored data is invalid and will be reset');
            return [];
        }
    }

    normalizeItem(item) {
        if (!item || item.id == null) return null;

        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        const price = Number(item.price);

        return {
            id: item.id,
            name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Producto',
            price: Number.isFinite(price) ? price : 0,
            image: typeof item.image === 'string' ? item.image : '',
            quantity
        };
    }

    init() {
        this.calculateTotals();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        this.renderCartIcon();
        this.setupGlobalListeners();
        this.createModalStructure();
    }

    setupGlobalListeners() {
        document.addEventListener('click', (event) => {
            const cartButton = event.target.closest('.cart-btn');
            if (!cartButton) return;

            event.preventDefault();
            this.toggleCart();
        });
    }

    createModalStructure() {
        if (document.getElementById('cart-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.className = 'cart-modal';

        modal.innerHTML = `
            <div class="cart-content">
                <div class="cart-header">
                    <h3>Tu Carrito</h3>
                    <button class="close-cart" aria-label="Cerrar carrito">×</button>
                </div>
                <div class="cart-items" id="cart-items-container"></div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span id="cart-total-amount">€0.00</span>
                    </div>
                    <button class="checkout-btn" id="checkout-btn">Finalizar Compra</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', this.handleModalClick);
    }

    handleModalClick(event) {
        const modal = document.getElementById('cart-modal');
        if (!modal) return;

        if (event.target === modal || event.target.closest('.close-cart')) {
            this.toggleCart();
            return;
        }

        const trigger = event.target.closest('[data-item-id]');
        if (!trigger) return;

        const itemId = trigger.getAttribute('data-item-id');
        if (!itemId) return;

        if (trigger.classList.contains('qty-decrease')) {
            const item = this.items.find((entry) => String(entry.id) === itemId);
            if (item) this.updateQuantity(itemId, item.quantity - 1);
            return;
        }

        if (trigger.classList.contains('qty-increase')) {
            const item = this.items.find((entry) => String(entry.id) === itemId);
            if (item) this.updateQuantity(itemId, item.quantity + 1);
            return;
        }

        if (trigger.classList.contains('remove-item')) {
            this.removeItem(itemId);
        }
    }

    buildCartItemElement(item) {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.dataset.itemId = String(item.id);

        const image = document.createElement('img');
        image.src = item.image || '';
        image.alt = item.name;
        image.onerror = function onImageError() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3C/svg%3E';
        };

        const details = document.createElement('div');
        details.className = 'cart-item-details';

        const title = document.createElement('h4');
        title.textContent = item.name;

        const price = document.createElement('p');
        price.className = 'cart-item-price';
        price.textContent = `€${item.price.toFixed(2)}`;

        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';

        const decrease = document.createElement('button');
        decrease.className = 'qty-decrease';
        decrease.setAttribute('data-item-id', String(item.id));
        decrease.type = 'button';
        decrease.textContent = '-';

        const quantity = document.createElement('span');
        quantity.textContent = String(item.quantity);

        const increase = document.createElement('button');
        increase.className = 'qty-increase';
        increase.setAttribute('data-item-id', String(item.id));
        increase.type = 'button';
        increase.textContent = '+';

        const remove = document.createElement('button');
        remove.className = 'remove-item';
        remove.setAttribute('data-item-id', String(item.id));
        remove.type = 'button';
        remove.textContent = '×';

        quantityControls.appendChild(decrease);
        quantityControls.appendChild(quantity);
        quantityControls.appendChild(increase);

        details.appendChild(title);
        details.appendChild(price);
        details.appendChild(quantityControls);

        row.appendChild(image);
        row.appendChild(details);
        row.appendChild(remove);

        return row;
    }

    renderCartContent() {
        const container = document.getElementById('cart-items-container');
        const totalElement = document.getElementById('cart-total-amount');
        const checkoutButton = document.getElementById('checkout-btn');

        if (!container) return;

        container.replaceChildren();

        if (this.items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-cart';
            empty.textContent = 'Tu carrito está vacío';
            container.appendChild(empty);

            if (checkoutButton) checkoutButton.disabled = true;
        } else {
            const fragment = document.createDocumentFragment();
            this.items.forEach((item) => {
                fragment.appendChild(this.buildCartItemElement(item));
            });

            container.appendChild(fragment);

            if (checkoutButton) checkoutButton.disabled = false;
        }

        if (totalElement) {
            totalElement.textContent = `€${this.total.toFixed(2)}`;
        }
    }

    toggleCart() {
        let modal = document.getElementById('cart-modal');
        if (!modal) {
            this.createModalStructure();
            modal = document.getElementById('cart-modal');
        }
        if (!modal) return;

        const isOpen = modal.classList.contains('open');

        if (isOpen) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            return;
        }

        this.renderCartContent();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    addItem(product, quantity = 1) {
        if (!product || product.id == null) {
            this.showNotification('Error: producto no válido', 'error');
            return false;
        }

        if (product.soldOut === true) {
            this.showNotification('Este producto está agotado', 'error');
            return false;
        }

        const normalizedQuantity = Math.max(1, parseInt(quantity, 10) || 1);
        const existing = this.items.find((item) => String(item.id) === String(product.id));

        if (existing) {
            existing.quantity += normalizedQuantity;
        } else {
            const normalized = this.normalizeItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: normalizedQuantity
            });

            if (!normalized) {
                this.showNotification('Error: producto no válido', 'error');
                return false;
            }

            this.items.push(normalized);
        }

        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.showNotification('Producto añadido al carrito', 'success');

        window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter((item) => String(item.id) !== String(productId));
        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.renderCartContent();

        window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find((entry) => String(entry.id) === String(productId));
        if (!item) return;

        const nextQuantity = parseInt(quantity, 10);
        if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
            this.removeItem(productId);
            return;
        }

        item.quantity = nextQuantity;

        this.saveCart();
        this.calculateTotals();
        this.updateUI();
        this.renderCartContent();

        window.dispatchEvent(new CustomEvent('cart:updated', { detail: this }));
    }

    calculateTotals() {
        this.count = this.items.reduce((acc, item) => acc + item.quantity, 0);
        this.total = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.warn('Cart: failed to persist data', error);
        }
    }

    updateUI() {
        this.renderCartIcon();
    }

    renderCartIcon() {
        const cartButtons = document.querySelectorAll('.cart-btn');

        cartButtons.forEach((button) => {
            let badge = button.querySelector('.cart-count');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-count';
                badge.style.display = 'none';
                button.appendChild(badge);
            }

            badge.textContent = String(this.count);
            const hasItems = this.count > 0;
            badge.style.display = hasItems ? 'flex' : 'none';
            badge.style.visibility = hasItems ? 'visible' : 'hidden';

            if (window.getComputedStyle(button).position === 'static') {
                button.style.position = 'relative';
            }
        });
    }

    showNotification(message, type = 'success') {
        document.querySelectorAll('.notification').forEach((node) => node.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

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

window.cart = new ShoppingCart();
