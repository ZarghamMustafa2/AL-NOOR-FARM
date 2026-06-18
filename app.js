// ==========================================================================
// AL NOOR FARM - WEB APP LOGIC (app.js)
// E-commerce cart, checkout, payment calculation & WhatsApp order routing.
// ==========================================================================

// Web3Forms API Access Key (Replace with your actual key from web3forms.com)
const WEB3FORMS_ACCESS_KEY = "e042e2a8-df88-49fe-83e0-e2678aa0a691";

// 1. DATA CONFIGURATION
const products = {
    anwar_ratol: {
        name: "Anwar Ratol Mango (Pre-book) Tentative Harvesting 29th June",
        image: "assets/anwar_ratol_gardezi.png",
        prices: {
            5: 3050,
            10: 5800
        }
    },
    chaunsa: {
        name: "Chaunsa Mango (Pre-book) Tentative Harvesting 20th July",
        image: "assets/chaunsa_gardezi.png",
        prices: {
            5: 2950,
            10: 5600
        }
    },
    sindhri: {
        name: "Sindhri Mango (Pre-book) Tentative Harvesting 20th June",
        image: "assets/sindhri_gardezi.png",
        prices: {
            5: 2850,
            10: 5400
        }
    },
    dasehri: {
        name: "Dasheri Mango (Available Now)",
        image: "assets/dasehri_gardezi.png",
        prices: {
            5: 2550,
            10: 4800
        }
    },
    langra: {
        name: "Langra Mango (Available Now)",
        image: "assets/langra_gardezi.png",
        prices: {
            5: 2550,
            10: 4800
        }
    },
    ratol_no12: {
        name: "12 no. Ratol Mango (Pre-book) Tentative Harvesting 24th August",
        image: "assets/ratol_no12_gardezi.png",
        prices: {
            5: 3250,
            10: 6200
        }
    }
};

const productCategories = {
    anwar_ratol: ['sweet'],
    chaunsa: ['bestseller', 'sweet'],
    sindhri: ['bestseller'],
    dasehri: ['sweet'],
    langra: [],
    ratol_no12: ['premium']
};

// 2. STATE MANAGEMENT
let cart = [];
let activePromo = null;
let activeFilter = 'all';
let searchQuery = '';

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
    initPromo();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('anf_cart', JSON.stringify(cart));
    updateCartUI();
}

// 2.1 PROMO CODE & COUPON LOGIC
const PROMO_CODES = {
    'ALNOOR10': 0.10, // 10% discount
    'MANGO15': 0.15,  // 15% discount
    'FRESH5': 0.05    // 5% discount
};

function initPromo() {
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-input');
    
    const savedPromo = localStorage.getItem('anf_promo');
    if (savedPromo) {
        try {
            activePromo = JSON.parse(savedPromo);
            if (promoInput) promoInput.value = activePromo.code;
            showPromoMsg(`Promo code "${activePromo.code}" applied.`, "success");
        } catch (e) {
            activePromo = null;
        }
    }
    
    if (applyPromoBtn && promoInput) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoInput.value.trim().toUpperCase();
            if (code === '') {
                activePromo = null;
                localStorage.removeItem('anf_promo');
                showPromoMsg("Please enter a promo code.", "error");
                updateCartUI();
                return;
            }
            
            if (PROMO_CODES.hasOwnProperty(code)) {
                activePromo = {
                    code: code,
                    discountRate: PROMO_CODES[code]
                };
                localStorage.setItem('anf_promo', JSON.stringify(activePromo));
                showPromoMsg(`Promo code "${code}" applied successfully!`, "success");
            } else {
                activePromo = null;
                localStorage.removeItem('anf_promo');
                showPromoMsg("Invalid promo code.", "error");
            }
            updateCartUI();
        });
    }
}

function showPromoMsg(msg, type) {
    const promoMessage = document.getElementById('promo-message');
    if (promoMessage) {
        promoMessage.textContent = msg;
        promoMessage.className = `promo-msg ${type}`;
    }
}

// 2.2 PRODUCT SEARCH & CATEGORY FILTER LOGIC
function initFilters() {
    const searchInput = document.getElementById('catalog-search');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterProducts();
        });
    }
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.getAttribute('data-filter');
            filterProducts();
        });
    });
}

function filterProducts() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productId = card.getAttribute('data-id');
        const productInfo = products[productId];
        const categories = productCategories[productId] || [];
        
        if (!productInfo) return;
        
        const matchesSearch = productInfo.name.toLowerCase().includes(searchQuery) || 
                              productInfo.name.toLowerCase().replace("mango", "").trim().includes(searchQuery) ||
                              productId.toLowerCase().replace("_", " ").includes(searchQuery);
        
        const matchesFilter = (activeFilter === 'all') || categories.includes(activeFilter);
        
        if (matchesSearch && matchesFilter) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
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
    
    // Card Quantity Handler
    const cardQtyVal = card.querySelector('.card-qty-val');
    const cardQtyMinus = card.querySelector('.card-qty-btn.minus');
    const cardQtyPlus = card.querySelector('.card-qty-btn.plus');
    
    function updateCardPrice() {
        const activeWeightBtn = card.querySelector('.weight-btn.active');
        if (!activeWeightBtn) return;
        const weight = parseInt(activeWeightBtn.getAttribute('data-weight'));
        const basePrice = products[productId].prices[weight];
        const qty = cardQtyVal ? parseInt(cardQtyVal.textContent) : 1;
        const totalPrice = basePrice * qty;
        if (priceValSpan) {
            priceValSpan.textContent = totalPrice.toLocaleString();
        }
    }
    
    weightButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active styling
            weightButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            updateCardPrice();
        });
    });
    
    if (cardQtyVal && cardQtyMinus && cardQtyPlus) {
        cardQtyMinus.addEventListener('click', () => {
            let qty = parseInt(cardQtyVal.textContent);
            if (qty > 1) {
                cardQtyVal.textContent = qty - 1;
                updateCardPrice();
            }
        });
        cardQtyPlus.addEventListener('click', () => {
            let qty = parseInt(cardQtyVal.textContent);
            cardQtyVal.textContent = qty + 1;
            updateCardPrice();
        });
    }
    
    // Add to Cart Button Listener
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const weight = parseInt(activeWeightBtn.getAttribute('data-weight'));
            const qty = cardQtyVal ? parseInt(cardQtyVal.textContent) : 1;
            addToCart(productId, weight, qty);
            if (cardQtyVal) {
                cardQtyVal.textContent = 1;
                updateCardPrice();
            }
            openCartDrawer();
        });
    }

    // Buy Now Button Listener
    const buyNowBtn = card.querySelector('.buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const weight = parseInt(activeWeightBtn.getAttribute('data-weight'));
            const qty = cardQtyVal ? parseInt(cardQtyVal.textContent) : 1;
            addToCart(productId, weight, qty);
            if (cardQtyVal) {
                cardQtyVal.textContent = 1;
                updateCardPrice();
            }
            openCheckoutFlow();
        });
    }
});

// 4. CART CORE ACTIONS
function addToCart(productId, weight, quantity = 1) {
    const productInfo = products[productId];
    const price = productInfo.prices[weight];
    
    // Check if item already exists in cart with same weight
    const existingIndex = cart.findIndex(item => item.id === productId && item.weight === weight);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: productId,
            name: productInfo.name,
            weight: weight,
            price: price,
            image: productInfo.image,
            quantity: quantity
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
        
        // Handle Active Promo Discount
        const discountRow = document.getElementById('discount-row');
        const discountPercent = document.getElementById('discount-percent');
        const cartDiscount = document.getElementById('cart-discount');
        let discount = 0;
        
        if (activePromo) {
            discount = Math.round(subtotal * activePromo.discountRate);
            if (discountRow) discountRow.style.display = 'flex';
            if (discountPercent) discountPercent.textContent = (activePromo.discountRate * 100).toString();
            if (cartDiscount) cartDiscount.textContent = `-Rs. ${discount.toLocaleString()}`;
        } else {
            if (discountRow) discountRow.style.display = 'none';
        }
        
        const finalTotal = subtotal - discount;
        cartTotal.textContent = `Rs. ${finalTotal.toLocaleString()}`;
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
    
    const summaryDiscountRow = document.getElementById('summary-discount-row');
    const summaryDiscountPercent = document.getElementById('summary-discount-percent');
    const summaryDiscountVal = document.getElementById('summary-discount-val');
    
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
    
    let discount = 0;
    if (activePromo) {
        discount = Math.round(subtotal * activePromo.discountRate);
        if (summaryDiscountRow) summaryDiscountRow.style.display = 'flex';
        if (summaryDiscountPercent) summaryDiscountPercent.textContent = (activePromo.discountRate * 100).toString();
        if (summaryDiscountVal) summaryDiscountVal.textContent = `-Rs. ${discount.toLocaleString()}`;
    } else {
        if (summaryDiscountRow) summaryDiscountRow.style.display = 'none';
    }
    
    const total = subtotal - discount;
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
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += (item.price * item.quantity);
    });
    let discount = 0;
    if (activePromo) {
        discount = Math.round(subtotal * activePromo.discountRate);
    }
    const totalBill = subtotal - discount;
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
    
    // Send email notification to owner
    sendEmailNotification(orderId, name, phone, email, address, city, province, totalBill, advance, cod);
    
    // Clear state
    cart = [];
    activePromo = null;
    localStorage.removeItem('anf_promo');
    const promoInput = document.getElementById('promo-input');
    if (promoInput) promoInput.value = '';
    const promoMessage = document.getElementById('promo-message');
    if (promoMessage) {
        promoMessage.textContent = '';
        promoMessage.className = 'promo-msg';
    }
    saveCart();
    
    // Alert the user
    alert("Apka order receive ho gaya hai!");
    
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

// Helper: Sends email notification on order booking using Web3Forms API
function sendEmailNotification(orderId, name, phone, email, address, city, province, totalBill, advance, cod) {
    if (WEB3FORMS_ACCESS_KEY === "YOUR_WEB3FORMS_ACCESS_KEY") {
        console.warn("Web3Forms Access Key is not configured. Email notification skipped.");
        return;
    }
    
    // Load current order contents before they are cleared from state
    const savedCart = localStorage.getItem('anf_cart');
    let items = [];
    if (savedCart) {
        try {
            items = JSON.parse(savedCart);
        } catch (e) {
            items = cart;
        }
    } else {
        items = cart;
    }
    
    let orderDetailsText = '';
    items.forEach((item, index) => {
        orderDetailsText += `${index + 1}. ${item.name} (${item.weight} Kg Box) x ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}\n`;
    });
    
    const emailData = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New Order Booking [${orderId}] - Al Noor Farm`,
        from_name: "Al Noor Farm Web App",
        name: name,
        email: email,
        phone: phone,
        message: `
Order Reference ID: ${orderId}
Customer Name: ${name}
Phone/WhatsApp: ${phone}
Email: ${email}
Delivery Address: ${address}, ${city}, ${province}

Order Details:
${orderDetailsText}

Billing Summary:
- Total Bill: Rs. ${totalBill.toLocaleString()}
- 50% Required Advance: Rs. ${advance.toLocaleString()}
- 50% Cash on Delivery: Rs. ${cod.toLocaleString()}
        `.trim()
    };

    fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(emailData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Email notification sent successfully.");
        } else {
            console.error("Failed to send email via Web3Forms:", data.message);
        }
    })
    .catch(err => {
        console.error("Error sending email notification:", err);
    });
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
    initCart();
    initFilters();
    
    // FAQ Accordion Toggle Logic
    const faqTriggers = document.querySelectorAll('.faq-trigger');
    faqTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.closest('.faq-item');
            const panel = item.querySelector('.faq-panel');
            
            const isActive = item.classList.toggle('active');
            
            if (isActive) {
                panel.style.maxHeight = panel.scrollHeight + "px";
            } else {
                panel.style.maxHeight = "0px";
            }
            
            // Close other items for a clean accordion experience
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-panel').style.maxHeight = "0px";
                }
            });
        });
    });
});
