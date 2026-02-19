
// Supabase Config
const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTk1NDksImV4cCI6MjA4NzAzNTU0OX0.iI2K0RY1s-tA3P2xu6IhmOch7YldfrTNw1wCzdE6o08';
// Initialize Supabase Client safely
let supabaseClient;
if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('Supabase client not loaded');
}

// State
let products = [];
let collections = [];
let editingId = null;

// DOM Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const productsList = document.getElementById('products-list');
const modal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const addBtn = document.getElementById('add-product-btn');
const closeModal = document.querySelector('.close-modal');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    checkSession();
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    addBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    productForm.addEventListener('submit', handleSave);

    // Initial Load
    await loadCollections();
});

// Auth
async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        alert('Error: ' + error.message);
    } else {
        showDashboard();
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    showLogin();
}

function showLogin() {
    loginView.style.display = 'flex';
    dashboardView.style.display = 'none';
}

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    loadProducts();
}

// Data
async function loadCollections() {
    const { data, error } = await supabaseClient.from('collections').select('*');
    if (data) {
        collections = data;
        const select = document.getElementById('p-collection');
        select.innerHTML = data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

async function loadProducts() {
    productsList.innerHTML = '<p>Cargando...</p>';
    const { data, error } = await supabaseClient.from('products').select('*').order('id', { ascending: false });

    if (error) {
        productsList.innerHTML = '<p>Error cargando productos.</p>';
        return;
    }

    products = data;
    renderProducts();
}

function renderProducts() {
    productsList.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="../${p.image}" class="product-img" onerror="this.src='https://via.placeholder.com/300'">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p style="color: #888;">${p.collection_id} · €${p.price}</p>
                <div style="margin-top: 0.5rem;">
                    ${p.sold_out ? '<span style="color:red; font-weight:bold;">AGOTADO</span>' : '<span style="color:green;">Disponibile</span>'}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${p.id})">Editar</button>
                <button class="btn-delete" onclick="deleteProduct(${p.id})">Borrar</button>
            </div>
        </div>
    `).join('');
}

// Actions
window.editProduct = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    openModal(p);
};

window.deleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de que quieres borrar este producto?')) return;

    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (error) {
        alert('Error borrando: ' + error.message);
    } else {
        loadProducts();
    }
};

function openModal(product = null) {
    editingId = product ? product.id : null;
    document.getElementById('modal-title').textContent = product ? 'Editar Producto' : 'Nuevo Producto';

    // Fill form
    document.getElementById('p-name').value = product ? product.name : '';
    document.getElementById('p-price').value = product ? product.price : '';
    document.getElementById('p-collection').value = product ? product.collection_id : (collections[0]?.id || '');
    document.getElementById('p-category').value = product ? product.category : 'silver';
    document.getElementById('p-type').value = product ? product.type : 'rings';
    document.getElementById('p-material').value = product ? product.material : '';
    document.getElementById('p-description').value = product ? product.description : '';
    // document.getElementById('p-image').value = product ? product.image : ''; // Hidden input now
    document.getElementById('p-image').value = product ? product.image : '';
    document.getElementById('image-preview').innerHTML = product && product.image ? `<img src="../${product.image}" style="width:100%">` : '';

    document.getElementById('p-soldout').checked = product ? product.sold_out : false;

    modal.classList.add('active');
}

async function handleSave(e) {
    e.preventDefault();

    const fileInput = document.getElementById('p-image-file');
    let imageUrl = document.getElementById('p-image').value;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error: uploadError } = await supabaseClient.storage
            .from('product-images')
            .upload(filePath, file);

        if (uploadError) {
            alert('Error subiendo imagen: ' + uploadError.message);
            return;
        }

        const { data: { publicUrl } } = supabaseClient.storage
            .from('product-images')
            .getPublicUrl(filePath);

        imageUrl = publicUrl;
    }

    const newProduct = {
        name: document.getElementById('p-name').value,
        price: parseFloat(document.getElementById('p-price').value),
        collection_id: document.getElementById('p-collection').value,
        category: document.getElementById('p-category').value,
        type: document.getElementById('p-type').value,
        material: document.getElementById('p-material').value,
        description: document.getElementById('p-description').value,
        image: imageUrl,
        sold_out: document.getElementById('p-soldout').checked,
        // Ensure images is always an array
        images: [imageUrl],
        tags: []
    };

    let error;
    if (editingId) {
        // Update
        const res = await supabaseClient.from('products').update(newProduct).eq('id', editingId);
        error = res.error;
    } else {
        // Create
        // Need a random ID since we aren't using auto-increment integer.
        newProduct.id = Date.now(); // Simple timestamp ID
        const res = await supabaseClient.from('products').insert(newProduct);
        error = res.error;
    }

    if (error) {
        alert('Error guardando: ' + error.message);
    } else {
        modal.classList.remove('active');
        loadProducts();
    }
}
