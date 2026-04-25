// Default Product Data (used only if localStorage is empty)
const initialProducts = [
    { id: 1, name: "Collar Elegancia Astral", price: 125000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.00 PM.jpeg", tag: "latest" },
    { id: 2, name: "Pulsera Cuarzo Rosa", price: 85000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.01 PM (1).jpeg", tag: "latest" },
    { id: 3, name: "Anillo Dorado Minimal", price: 45000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.01 PM (2).jpeg", promo: true, oldPrice: 65000 },
    { id: 4, name: "Pendientes Gota de Oro", price: 65000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.01 PM.jpeg", promo: true, oldPrice: 90000 },
    { id: 5, name: "Reloj Classic Gold", price: 210000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.02 PM (1).jpeg", tag: "latest" },
    { id: 6, name: "Bolso Gala Velvet", price: 320000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.02 PM (2).jpeg", tag: "latest" },
    { id: 7, name: "Gargantilla Diamante", price: 155000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.02 PM (3).jpeg" },
    { id: 8, name: "Set de Anillos Luna", price: 75000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.02 PM (4).jpeg" },
    { id: 9, name: "Cinturón Piel Premium", price: 95000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.02 PM.jpeg" },
    { id: 10, name: "Tiara Floral Crystal", price: 185000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.03 PM (1).jpeg", promo: true, oldPrice: 240000 },
    { id: 11, name: "Broche Vintage Perla", price: 55000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.03 PM (2).jpeg" },
    { id: 12, name: "Aretes Sol y Mar", price: 42000, image: "imagenes/WhatsApp Image 2026-04-21 at 6.03.03 PM.jpeg" }
];

// Supabase Configuration
const SUPABASE_URL = 'https://eaihwvmgcjizjbieptyy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaWh3dm1nY2ppempiaWVwdHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDM5MjQsImV4cCI6MjA5MjQ3OTkyNH0.qQUmmk9dRZoPC3_6-pBM6UUBN41wjZC1WA0iV1QnqzU'; 
const supabaseDB = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];

async function loadProducts() {
    try {
        const { data, error } = await supabaseDB.from('products').select('*');
        if (error) throw error;
        
        if (!data || data.length === 0) {
            // Seed defaults if database is empty
            const { error: insertError } = await supabaseDB.from('products').insert(initialProducts);
            if (insertError) console.error("Error seeding products:", insertError);
            products = initialProducts;
        } else {
            products = data;
        }
        displayProducts();
    } catch (err) {
        console.error("Error loading products from Supabase:", err);
        // Fallback to local if something fails
        products = JSON.parse(localStorage.getItem('claumu_products')) || initialProducts;
        displayProducts();
    }
}


// Scroll Restoration
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

let cart = [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const promoContainer = document.getElementById('promo-container');
const latestContainer = document.getElementById('latest-container');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutModal = document.getElementById('checkout-modal');
const successModal = document.getElementById('success-modal');
const checkoutBtn = document.getElementById('checkout-btn');
const closeModal = document.querySelector('.close-modal');
const paymentForm = document.getElementById('payment-form');
const navbar = document.getElementById('navbar');
const finalTotal = document.getElementById('final-total');
const formError = document.getElementById('form-error');

// Global variables
let lastOrderData = null;

// Storage Logic
function generateOrderRef() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `CL-${result}`;
}

async function saveOrder(customerData, cartItems, total, paymentMethod) {
    const newOrder = {
        ref: generateOrderRef(),
        customer: customerData,
        items: cartItems,
        total: total,
        paymentMethod: paymentMethod || 'Bancolombia',
        status: 'Pendiente'
    };

    try {
        const { data, error } = await supabaseDB.from('orders').insert([newOrder]).select();
        if (error) throw error;
        
        lastOrderData = data[0];
        console.log("Orden guardada en Supabase:", lastOrderData);
    } catch (err) {
        console.error("Error saving order to Supabase:", err);
        // Fallback to local so the user doesn't lose the sale
        const orders = JSON.parse(localStorage.getItem('claumu_orders') || '[]');
        orders.push({...newOrder, id: Date.now(), date: new Date().toLocaleString()});
        localStorage.setItem('claumu_orders', JSON.stringify(orders));
        lastOrderData = {...newOrder, id: Date.now()};
    }
}

// Initialize Products
function createProductHTML(product) {
    return `
        <div class="product-card">
            ${product.promo ? '<span class="badge sale">SALE</span>' : ''}
            ${product.tag === 'latest' ? '<span class="badge new">NUEVO</span>' : ''}
            ${product.tag === 'bolsos' ? '<span class="badge bag">BOLSO</span>' : ''}
            ${product.tag === 'carteras' ? '<span class="badge bag">CARTERA</span>' : ''}
            ${product.tag === 'relojes' ? '<span class="badge relojes">RELOJ</span>' : ''}
            ${product.tag === 'aretes' ? '<span class="badge aretes">ARETES</span>' : ''}
            ${product.tag === 'sets' ? '<span class="badge sets">SET</span>' : ''}
            ${product.tag === 'anillos' ? '<span class="badge anillos">ANILLO</span>' : ''}
            ${product.tag === 'cadenas' ? '<span class="badge cadenas">CADENA</span>' : ''}
            ${product.tag === 'collares' ? '<span class="badge collares">COLLAR</span>' : ''}
            ${product.tag === 'dijes' ? '<span class="badge dijes">DIJE</span>' : ''}
            <div class="product-img">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price-container">
                    ${product.oldPrice ? `<span class="old-price">$${product.oldPrice.toLocaleString()}</span>` : ''}
                    <span class="price">$${product.price.toLocaleString()}</span>
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">Añadir al Carrito</button>
            </div>
        </div>
    `;
}

let currentCategory = 'all';

function filterByCategory(category) {
    currentCategory = category;
    
    // Update active button
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });

    displayProducts();
}

function displayProducts() {
    // Filter products for sections
    const promoProducts = products.filter(p => p.promo);
    const latestProducts = products.filter(p => p.tag === 'latest');
    
    // Filter products for the main collection based on selected category
    let mainProducts = products;
    if (currentCategory !== 'all') {
        mainProducts = products.filter(p => p.category === currentCategory);
    }
    
    // Render in respective containers
    promoContainer.innerHTML = promoProducts.map(p => createProductHTML(p)).join('');
    latestContainer.innerHTML = latestProducts.map(p => createProductHTML(p)).join('');
    productsContainer.innerHTML = mainProducts.map(p => createProductHTML(p)).join('');
}

// Cart Logic
function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    openCartSidebar();
}

function updateCart() {
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.innerText = totalItems;

    // Update items list
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>${item.quantity} x $${item.price.toLocaleString()}</span>
            </div>
            <div class="remove-item" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </div>
        </div>
    `).join('');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">Tu carrito está vacío</p>';
    }

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalAmount.innerText = `$${total.toLocaleString()}`;
    finalTotal.innerText = `($${total.toLocaleString()})`;
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

// UI Interactions
function openCartSidebar() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
}

function closeCartSidebar() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

// Event Listeners
cartBtn.addEventListener('click', openCartSidebar);
closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Checkout Logic
checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        showCustomError("Tu carrito está vacío. ¡Añade algunos accesorios!");
        return;
    }
    checkoutModal.classList.add('active');
    checkoutModal.style.display = 'block';
    closeCartSidebar();
});

function showCustomError(msg) {
    formError.innerText = msg;
    formError.style.display = 'block';
    setTimeout(() => {
        formError.style.display = 'none';
    }, 5000);
}

closeModal.addEventListener('click', () => {
    checkoutModal.classList.remove('active');
    checkoutModal.style.display = 'none';
});

function closeSuccessModal() {
    successModal.classList.remove('active');
    successModal.style.display = 'none';
}

window.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
        checkoutModal.classList.remove('active');
        checkoutModal.style.display = 'none';
    }
    if (e.target === successModal) {
        closeSuccessModal();
    }
});

paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate fields
    const inputs = paymentForm.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    if (!isValid) {
        showCustomError("Por favor completa todos los campos requeridos.");
        return;
    }

    // Collect customer data
    const customerData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;

    // Simulate payment processing
    const submitBtn = paymentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = "Procesando...";

    setTimeout(() => {
        // Save order data locally
        saveOrder(customerData, [...cart], total, selectedMethod);

        // UI Updates
        checkoutModal.style.display = 'none';
        successModal.style.display = 'block';
        successModal.classList.add('active');
        
        cart = [];
        updateCart();
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        paymentForm.reset();
    }, 1500);
});

function togglePaymentDetails(method) {
    const qrBox = document.getElementById('qr-details');
    const llaveBox = document.getElementById('lallave-details');
    
    if (method === 'bancolombia') {
        qrBox.style.display = 'block';
        llaveBox.style.display = 'none';
    } else {
        qrBox.style.display = 'none';
        llaveBox.style.display = 'block';
    }
}

function sendWhatsAppOrder() {
    if (!lastOrderData) return;
    
    const { ref, customer, items, total, paymentMethod } = lastOrderData;
    const itemsText = items.map(i => `- ${i.quantity}x ${i.name}`).join('%0A');
    const methodText = paymentMethod === 'lallave' ? 'La Llave' : 'Bancolombia QR';
    
    const message = `¡Hola ClauMu! 👋 Acabo de realizar un pedido:%0A%0A` +
        `🆔 *Referencia:* ${ref}%0A` +
        `👤 *Cliente:* ${customer.name}%0A` +
        `📞 *Tel:* ${customer.phone}%0A` +
        `📍 *Dirección:* ${customer.address}%0A%0A` +
        `🛍️ *Productos:*%0A${itemsText}%0A%0A` +
        `💰 *Total:* $${total.toLocaleString()}%0A%0A` +
        `💳 *Método de Pago:* ${methodText}%0A%0A` +
        `Aquí adjunto mi comprobante de transferencia.`;

    window.open(`https://wa.me/573025410404?text=${message}`, '_blank');
}

// Admin Navigation
function goToAdmin() {
    const adminModal = document.getElementById('admin-modal');
    const adminPasswordInput = document.getElementById('admin-password');
    
    if (adminModal && adminPasswordInput) {
        adminModal.style.display = 'block';
        setTimeout(() => adminModal.classList.add('active'), 10);
        adminPasswordInput.focus();
    } else {
        console.error("Admin modal elements not found");
    }
}

function closeAdminModal() {
    const adminModal = document.getElementById('admin-modal');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminError = document.getElementById('admin-error');

    if (adminModal) {
        adminModal.classList.remove('active');
        setTimeout(() => adminModal.style.display = 'none', 300);
    }
    if (adminPasswordInput) adminPasswordInput.value = '';
    if (adminError) adminError.style.display = 'none';
}

function checkAdminPassword() {
    const adminPasswordInput = document.getElementById('admin-password');
    const adminError = document.getElementById('admin-error');

    if (adminPasswordInput.value === "1234") {
        window.location.href = "admin.html";
    } else {
        if (adminError) adminError.style.display = 'block';
        if (adminPasswordInput) {
            adminPasswordInput.classList.add('error');
            setTimeout(() => adminPasswordInput.classList.remove('error'), 1000);
        }
        setTimeout(() => {
            if (adminError) adminError.style.display = 'none';
        }, 3000);
    }
}

function updateSettings() {
    const qrPath = localStorage.getItem('claumu_qr_path') || 'imagenes/qr_bancolombia.png';
    const llaveId = localStorage.getItem('claumu_llave_id') || '@CMG o 3245334564';
    
    const qrImg = document.getElementById('qr-image');
    const qrLink = document.querySelector('.btn-download');
    const llaveDisplay = document.getElementById('lallave-id-display');
    
    if (qrImg) qrImg.src = qrPath;
    if (qrLink) qrLink.href = qrPath;
    if (llaveDisplay) llaveDisplay.innerText = llaveId;
}

// Initialize Admin Keypress
document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0); // Always start at the top
    const adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAdminPassword();
        });
    }
    
    updateSettings();
    loadProducts(); // Load from Supabase
    updateCart();
});
