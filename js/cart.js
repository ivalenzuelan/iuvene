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

    bindCheckoutButton() {
        const btn = document.getElementById('checkout-btn');
        if (btn) {
            // Remove old listeners to prevent duplicates if re-rendered
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => this.showCheckoutForm());
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

        this.bindCheckoutButton();
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
            // Reset to cart view if it was in checkout
            const cartContent = modal.querySelector('.cart-content');
            const checkoutForm = modal.querySelector('.checkout-form');
            if (cartContent && checkoutForm) {
                cartContent.style.display = 'block';
                checkoutForm.style.display = 'none';
            }
            return;
        }

        this.renderCartContent();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    showCheckoutForm() {
        const modal = document.getElementById('cart-modal');
        if (!modal) return;

        // Hide cart content
        const cartContent = modal.querySelector('.cart-content');
        if (cartContent) cartContent.style.display = 'none';

        // Check if form already exists
        let formContainer = modal.querySelector('.checkout-form');
        if (!formContainer) {
            formContainer = document.createElement('div');
            formContainer.className = 'checkout-form';
            formContainer.innerHTML = `
                <div class="cart-header">
                    <h3>Finalizar Pedido</h3>
                    <button class="close-checkout" aria-label="Volver">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                </div>
                <div class="checkout-body">
                    <p class="checkout-desc">
                        Déjanos tus datos para preparar tu pedido Iuvene. Te redirigiremos a WhatsApp para confirmar el pago.
                    </p>
                    <form id="order-form">
                        <div class="checkout-field">
                            <label class="checkout-label" for="cust-name">Nombre Completo</label>
                            <input class="checkout-input" type="text" id="cust-name" required placeholder="Tu nombre">
                        </div>
                        <div class="checkout-field">
                            <label class="checkout-label" for="cust-phone">Teléfono / WhatsApp</label>
                            <input class="checkout-input" type="tel" id="cust-phone" required placeholder="+34 600 000 000">
                        </div>
                        <button type="submit" class="checkout-btn submit-btn">Confirmar Pedido</button>
                    </form>
                </div>
            `;
            modal.appendChild(formContainer);

            // Bind events
            formContainer.querySelector('.close-checkout').addEventListener('click', () => {
                formContainer.style.display = 'none';
                cartContent.style.display = 'block';
            });

            formContainer.querySelector('#order-form').addEventListener('submit', (e) => this.processOrder(e));
        } else {
            formContainer.style.display = 'block';
        }
    }

    async processOrder(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Procesando...';

        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;

        try {
            // 1. Save to Supabase
            if (window.supabaseClient) {
                const { error } = await window.supabaseClient.from('orders').insert({
                    customer_name: name,
                    customer_contact: phone,
                    items: this.items,
                    total: this.total,
                    status: 'pending'
                });

                if (error) throw error;
            } else {
                console.warn('Supabase not available, skipping database save');
            }

            // 2. Construct WhatsApp Message
            const itemsList = this.items.map(i => `- ${i.name} (x${i.quantity})`).join('%0A');
            const text = `Hola! 👋%0AQuiero confirmar mi pedido Iuvene:%0A%0A*Cliente:* ${name}%0A*Contacto:* ${phone}%0A%0A*Pedido:*%0A${itemsList}%0A%0A*Total:* €${this.total.toFixed(2)}`;
            const waLink = `https://wa.me/34633479785?text=${text}`;

            // 3. Clear Cart and Redirect
            localStorage.removeItem(this.storageKey);
            this.items = [];
            this.calculateTotals();
            this.updateUI();

            window.location.href = waLink;

        } catch (err) {
            console.error('Order error:', err);
            this.showNotification('Error al procesar el pedido. Inténtalo de nuevo.', 'error');
            btn.disabled = false;
            btn.textContent = originalText;
        }
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
