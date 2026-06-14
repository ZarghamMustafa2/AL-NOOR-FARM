// ==========================================================================
// AL NOOR FARM - WEB APP LOGIC (app.js)
// E-commerce cart, checkout, payment calculation & WhatsApp order routing.
// ==========================================================================

// 1. DATA CONFIGURATION
const products = {
    sindhri: {
        name: "Sindhri Mango",
        image: "assets/sindhri.png",
        prices: {
            5: 1450,
            10: 2750
        }
    },
    anwar_ratol: {
        name: "Anwar Ratol Mango",
        image: "assets/anwar_ratol.png",
        prices: {
            5: 1850,
            10: 3500
        }
    },
    chaunsa: {
        name: "Chaunsa Mango (White)",
        image: "assets/chaunsa.png",
        prices: {
            5: 1650,
            10: 3100
        }
    },
    dasehri: {
        name: "Dasehri Mango",
        image: "assets/dasehri.png",
        prices: {
            5: 1500,
            10: 2850
        }
    },
    langra: {
        name: "Langra Mango",
        image: "assets/langra.png",
        prices: {
            5: 1400,
            10: 2650
        }
    }
};

// 2. STATE MANAGEMENT
let cart = [];

// Load cart from LocalStorage on load
function initCart() {
    const savedCart = localStorage.getItem('anf_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('anf_cart', JSON.stringify(cart));
    updateCartUI();
}

// 3. UI CONTROLS & STYLING LOGIC

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const navHeader = document.getElementById('main-nav');
const cartBtn = document.getElementById('cart-btn');
const closeCart = document.getElementById('close-cart');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckout = document.getElementById('close-checkout');
const successModal = document.getElementById('success-modal');
const successCloseBtn = document.getElementById('success-close-btn');

// Sticky Header transition
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navHeader.classList.add('sticky-active');
    } else {
        navHeader.classList.remove('sticky-active');
    }
});

// Mobile menu drawer open/close
menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    menuToggle.classList.toggle('active');
});

// Close mobile menu on clicking any navigation link
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuToggle.classList.remove('active');
    });
});

// Cart drawer slide-in controls
function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
}

function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
}

cartBtn.addEventListener('click', openCartDrawer);
closeCart.addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);
document.querySelectorAll('.close-cart-link').forEach(link => {
    link.addEventListener('click', closeCartDrawer);
});

// Product card weight selection handler
document.querySelectorAll('.product-card').forEach(card => {
    const productId = card.getAttribute('data-id');
    const weightButtons = card.querySelectorAll('.weight-btn');
    const priceValSpan = card.querySelector('.price-val');
    
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active styling
            weightButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Get selected weight & update price
            const weight = parseInt(btn.getAttribute('data-weight'));
            const price = products[productId].prices[weight];
            priceValSpan.textContent = price.toLocaleString();
        });
    });
    
    // Add to Cart Button Listener
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const weight = parseInt(activeWeightBtn.getAttribute('data-weight'));
            addToCart(productId, weight);
            openCartDrawer();
        });
    }

    // Buy Now Button Listener
    const buyNowBtn = card.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const weight = parseInt(activeWeightBtn.getAttribute('data-weight'));
            addToCart(productId, weight);
            openCheckoutFlow();
        });
    }
});

// 4. CART CORE ACTIONS
function addToCart(productId, weight) {
    const productInfo = products[productId];
    const price = productInfo.prices[weight];
    
    // Check if item already exists in cart with same weight
    const existingIndex = cart.findIndex(item => item.id === productId && item.weight === weight);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productInfo.name,
            weight: weight,
            price: price,
            image: productInfo.image,
            quantity: 1
        });
    }
    saveCart();
}

function updateQuantity(productId, weight, change) {
    const itemIndex = cart.findIndex(item => item.id === productId && item.weight === weight);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        saveCart();
    }
}

function removeItem(productId, weight) {
    cart = cart.filter(item => !(item.id === productId && item.weight === weight));
    saveCart();
}

// 5. UPDATE CART AND BADGES UI
function updateCartUI() {
    const cartBadge = document.getElementById('cart-badge');
    const cartList = document.getElementById('cart-list');
    const cartEmpty = document.getElementById('cart-empty');
    const cartSummaryBox = document.getElementById('cart-summary-box');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartTotal = document.getElementById('cart-total');
    
    // Calculate total quantity & sums
    let totalItems = 0;
    let subtotal = 0;
    
    cartList.innerHTML = '';
    
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartSummaryBox.style.display = 'none';
        cartBadge.textContent = '0';
    } else {
        cartEmpty.style.display = 'none';
        cartSummaryBox.style.display = 'block';
        
        cart.forEach(item => {
            totalItems += item.quantity;
            subtotal += (item.price * item.quantity);
            
            // Build cart item markup
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-meta">${item.weight} Kg Box (Rs. ${item.price.toLocaleString()} / Box)</p>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.weight}, -1)">-</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.weight}, 1)">+</button>
                        </div>
                        <button class="remove-item-btn" onclick="removeItem('${item.id}', ${item.weight})" aria-label="Remove item">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
            `;
            cartList.appendChild(itemElement);
        });
        
        cartBadge.textContent = totalItems;
        cartSubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
        cartTotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
    }
}

// 6. CHECKOUT PROCESS
const goToCheckoutBtn = document.getElementById('go-to-checkout');
goToCheckoutBtn.addEventListener('click', openCheckoutFlow);
closeCheckout.addEventListener('click', closeCheckoutModal);

function openCheckoutFlow() {
    if (cart.length === 0) {
        alert("Your shopping cart is empty!");
        return;
    }
    
    closeCartDrawer();
    checkoutModal.classList.add('open');
    renderCheckoutSummary();
}

function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
}

function renderCheckoutSummary() {
    const summaryList = document.getElementById('checkout-summary-list');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total');
    const summaryAdvance = document.getElementById('summary-advance');
    const summaryCod = document.getElementById('summary-cod');
    
    let subtotal = 0;
    summaryList.innerHTML = '';
    
    cart.forEach(item => {
        subtotal += (item.price * item.quantity);
        const row = document.createElement('div');
        row.className = 'summary-item-row';
        row.innerHTML = `
            <span class="summary-item-name">${item.name} (${item.weight} Kg) x ${item.quantity}</span>
            <span class="summary-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
        `;
        summaryList.appendChild(row);
    });
    
    const total = subtotal;
    const advance = Math.round(total * 0.50);
    const cod = total - advance;
    
    summarySubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
    summaryTotal.textContent = `Rs. ${total.toLocaleString()}`;
    summaryAdvance.textContent = `Rs. ${advance.toLocaleString()}`;
    summaryCod.textContent = `Rs. ${cod.toLocaleString()}`;
}

// 7. FORM SUBMISSION & SUCCESS HANDLING
const checkoutForm = document.getElementById('checkout-form');
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Retrieve values
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const city = document.getElementById('cust-city').value.trim();
    const province = document.getElementById('cust-province').value;
    
    // Generate Random Order ID
    const orderId = 'ANF-' + Math.floor(100000 + Math.random() * 900000);
    
    // Calculations
    let totalBill = 0;
    cart.forEach(item => {
        totalBill += (item.price * item.quantity);
    });
    const advance = Math.round(totalBill * 0.5);
    const cod = totalBill - advance;
    
    // Populate Success Screen
    document.getElementById('success-order-id').textContent = orderId;
    document.getElementById('success-cust-name').textContent = name;
    document.getElementById('success-total').textContent = `Rs. ${totalBill.toLocaleString()}`;
    document.getElementById('success-advance').textContent = `Rs. ${advance.toLocaleString()}`;
    document.getElementById('success-cod').textContent = `Rs. ${cod.toLocaleString()}`;
    document.getElementById('bank-advance-val').textContent = `Rs. ${advance.toLocaleString()}`;
    
    // Generate WhatsApp Pre-filled text and link
    const whatsappLink = generateWhatsAppLink(orderId, name, phone, email, address, city, province, totalBill, advance, cod);
    const whatsappBtn = document.getElementById('send-whatsapp-receipt-btn');
    whatsappBtn.href = whatsappLink;
    
    // Clear state
    cart = [];
    saveCart();
    
    // Toggle screens
    closeCheckout();
    successModal.classList.add('open');
});

successCloseBtn.addEventListener('click', () => {
    successModal.classList.remove('open');
});

// Helper: Formats string order summary and links to WhatsApp API
function generateWhatsAppLink(orderId, name, phone, email, address, city, province, totalBill, advance, cod) {
    let orderDetailsText = '';
    
    // Load current order contents before clearing state
    const savedCart = localStorage.getItem('anf_cart');
    let items = [];
    if (savedCart) {
        items = JSON.parse(savedCart);
    } else {
        items = cart;
    }
    
    items.forEach((item, index) => {
        orderDetailsText += `${index + 1}. *${item.name}* (${item.weight} Kg Box) x ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    const rawText = `*AL NOOR FARM - ORDER PRE-BOOKING*\n\n` +
                    `*Order Reference:* ${orderId}\n` +
                    `*Customer Name:* ${name}\n` +
                    `*Phone:* ${phone}\n` +
                    `*Email:* ${email}\n` +
                    `*Address:* ${address}, ${city}, ${province}\n\n` +
                    `*Order Details:*\n${orderDetailsText}\n` +
                    `*Billing Summary:*\n` +
                    `- *Total Bill:* Rs. ${totalBill.toLocaleString()}\n` +
                    `- *50% Advance (Required):* Rs. ${advance.toLocaleString()}\n` +
                    `- *50% Cash on Delivery:* Rs. ${cod.toLocaleString()}\n\n` +
                    `*Next Step:*\n` +
                    `Here is my payment receipt screenshot of Rs. ${advance.toLocaleString()} for confirmation of booking. Please process my shipment. Thank you!`;
                    
    const encodedText = encodeURIComponent(rawText);
    return `https://wa.me/923079661669?text=${encodedText}`;
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
    initCart();
});
