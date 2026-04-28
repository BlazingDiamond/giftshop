// ─── NAV SCROLL EFFECT ────────────────────────────────────────────────────────

const nav = document.querySelector('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── HAMBURGER MENU ───────────────────────────────────────────────────────────

const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ─── ACTIVE NAV LINK ──────────────────────────────────────────────────────────

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach((link) => {
  if (link.getAttribute('href') === currentPage) link.classList.add('active');
});

// ─── TOAST NOTIFICATION ───────────────────────────────────────────────────────

function showNotification(message, duration = 3000) {
  let note = document.querySelector('.notification');
  if (!note) {
    note = document.createElement('div');
    note.className = 'notification';
    document.body.appendChild(note);
  }
  note.textContent = message;
  note.classList.add('show');
  setTimeout(() => note.classList.remove('show'), duration);
}

// ─── PRODUCT RENDERING ────────────────────────────────────────────────────────

/**
 * loadProducts()
 *
 * Returns an array of product objects.
 *
 * BACKEND SWAP: Replace the body of this function with a fetch call, e.g.:
 *   const res = await fetch('/api/products');
 *   return res.json();
 *
 * The returned objects must match the schema defined in products.js.
 */
async function loadProducts() {
  // Local data from products.js (loaded via <script src="js/products.js">)
  return typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
}

/**
 * Builds the HTML string for a single product card.
 * Keeps all markup in one place — edit the template here to change every card.
 */
function buildProductCard(product) {
  const escapedName = product.name.replace(/&/g, '&amp;');
  const escapedDesc = product.description.replace(/&/g, '&amp;');

  const badgeHTML = product.badge
    ? `<span class="product-badge">${product.badge}</span>`
    : '';

  const soldOutBadge = `<span class="sold-out-badge">Sold Out</span>`;

  const buyButton = product.soldOut
    ? `<button class="btn-buy" disabled>Sold Out</button>`
    : `<button class="btn-buy snipcart-add-item"
         data-item-id="${product.id}"
         data-item-price="${product.price.toFixed(2)}"
         data-item-url="/shop.html"
         data-item-name="${escapedName}"
         data-item-description="${escapedDesc}"
         data-item-image="${product.image.replace(/w=600/, 'w=300')}">Add to cart</button>`;

  return `
    <div class="product-card${product.soldOut ? ' sold-out' : ''}" data-category="${product.category}">
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.imageAlt}" loading="lazy" />
        ${badgeHTML}
        ${soldOutBadge}
      </div>
      <div class="product-info">
        <p class="product-category">${product.categoryLabel}</p>
        <h3 class="product-name">${escapedName}</h3>
        <p class="product-desc-short">${escapedDesc}</p>
        <div class="product-footer">
          <span class="product-price">R ${product.price}</span>
          ${buyButton}
        </div>
      </div>
    </div>`;
}

/**
 * Fetches product data, renders cards into #product-grid,
 * then re-attaches the filter + cart listeners.
 */
async function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let products;
  try {
    products = await loadProducts();
  } catch (err) {
    grid.innerHTML = '<p class="shop-error">Could not load products. Please try again later.</p>';
    console.error('loadProducts error:', err);
    return;
  }

  if (!products.length) {
    grid.innerHTML = '<p class="shop-empty">No products available right now.</p>';
    return;
  }

  grid.innerHTML = products.map(buildProductCard).join('');

  initFilters(products);
  initAddToCartButtons();
  initScrollObserver();
}

// ─── SHOP FILTERS ─────────────────────────────────────────────────────────────

function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card[data-category]');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      productCards.forEach((card) => {
        card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
      });
    });
  });
}

// ─── CART ─────────────────────────────────────────────────────────────────────

const CART_STORAGE_KEY = 'hudaCartV1';
const PAYFAST_CHECKOUT_URL = 'https://sandbox.payfast.co.za/eng/process';
const PAYFAST_MERCHANT_ID = 'YOUR_PAYFAST_MERCHANT_ID';
const PAYFAST_MERCHANT_KEY = 'YOUR_PAYFAST_MERCHANT_KEY';

function formatZar(amount) {
  return `R ${amount.toFixed(2)}`;
}

function getCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function readProductFromButton(button) {
  const price = Number.parseFloat(button.dataset.itemPrice || '0');
  return {
    id: button.dataset.itemId || `item-${Date.now()}`,
    name: button.dataset.itemName || 'Product',
    description: button.dataset.itemDescription || '',
    image: button.dataset.itemImage || '',
    price: Number.isFinite(price) ? price : 0
  };
}

function upsertCartItem(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, qty: 1 });
  setCart(cart);
  return cart;
}

function setQty(itemId, qty) {
  const cart = getCart()
    .map((item) => (item.id === itemId ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  setCart(cart);
  return cart;
}

function removeItem(itemId) {
  const cart = getCart().filter((item) => item.id !== itemId);
  setCart(cart);
  return cart;
}

function createCartDrawer() {
  if (document.querySelector('#custom-cart-drawer')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cart-overlay';
  overlay.className = 'cart-overlay';
  document.body.appendChild(overlay);

  const drawer = document.createElement('aside');
  drawer.id = 'custom-cart-drawer';
  drawer.className = 'custom-cart-drawer';
  drawer.innerHTML = `
    <div class="cart-header">
      <h3>Your Cart</h3>
      <button type="button" class="cart-close" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-body">
      <div class="cart-empty">Your cart is empty.</div>
      <ul class="cart-items"></ul>
    </div>
    <div class="cart-footer">
      <div class="cart-total-row">
        <span>Total</span>
        <strong class="cart-total-value">R 0.00</strong>
      </div>
      <button type="button" class="btn-primary cart-checkout-btn">Checkout with PayFast</button>
    </div>
  `;
  document.body.appendChild(drawer);

  const close = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
  };
  overlay.addEventListener('click', close);
  drawer.querySelector('.cart-close').addEventListener('click', close);
  drawer.querySelector('.cart-checkout-btn').addEventListener('click', checkoutWithPayFast);
}

function openCartDrawer() {
  createCartDrawer();
  document.querySelector('#custom-cart-drawer')?.classList.add('open');
  document.querySelector('#cart-overlay')?.classList.add('show');
}

function renderCart() {
  const cart = getCart();
  document.querySelectorAll('.snipcart-items-count, .cart-items-count').forEach((node) => {
    node.textContent = String(cartCount(cart));
  });

  const drawer = document.querySelector('#custom-cart-drawer');
  if (!drawer) return;

  const list = drawer.querySelector('.cart-items');
  const empty = drawer.querySelector('.cart-empty');
  const totalEl = drawer.querySelector('.cart-total-value');
  const checkoutBtn = drawer.querySelector('.cart-checkout-btn');

  list.innerHTML = '';
  if (!cart.length) {
    empty.style.display = 'block';
    checkoutBtn.disabled = true;
  } else {
    empty.style.display = 'none';
    checkoutBtn.disabled = false;
    cart.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-main">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">${formatZar(item.price)}</p>
        </div>
        <div class="cart-item-actions">
          <button type="button" data-action="dec" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-action="inc" data-id="${item.id}">+</button>
          <button type="button" data-action="remove" data-id="${item.id}">Remove</button>
        </div>`;
      list.appendChild(li);
    });
  }
  totalEl.textContent = formatZar(cartTotal(cart));
}

function payfastReady() {
  return PAYFAST_MERCHANT_ID !== 'YOUR_PAYFAST_MERCHANT_ID' &&
    PAYFAST_MERCHANT_KEY !== 'YOUR_PAYFAST_MERCHANT_KEY';
}

function checkoutWithPayFast() {
  const cart = getCart();
  if (!cart.length) { showNotification('Your cart is empty.'); return; }
  if (!payfastReady()) { showNotification('Set your PayFast merchant ID and key in js/main.js first.', 5000); return; }

  const payload = {
    merchant_id: PAYFAST_MERCHANT_ID,
    merchant_key: PAYFAST_MERCHANT_KEY,
    return_url: `${window.location.origin}/index.html?payment=success`,
    cancel_url: `${window.location.href.split('?')[0]}?payment=cancelled`,
    notify_url: `${window.location.origin}/payfast-itn`,
    m_payment_id: `ts-${Date.now()}`,
    amount: cartTotal(cart).toFixed(2),
    item_name: `Huda Therapy Order (${cartCount(cart)} items)`,
    item_description: cart.map((i) => `${i.name} x${i.qty}`).join(', ').slice(0, 250),
    custom_str1: btoa(unescape(encodeURIComponent(JSON.stringify(cart))))
  };

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = PAYFAST_CHECKOUT_URL;
  form.style.display = 'none';
  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

// ─── INIT ADD-TO-CART BUTTONS (called after grid renders) ─────────────────────

function initAddToCartButtons() {
  document.querySelectorAll('.snipcart-add-item').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const product = readProductFromButton(button);
      const cart = upsertCartItem(product);
      renderCart();
      showNotification(`Added to cart: ${product.name}`);
      if (cartCount(cart) === 1) openCartDrawer();
    });
  });
}

// ─── CART QUANTITY CONTROLS (delegated — works for dynamically added items) ───

document.body.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.matches('.cart-item-actions button')) return;

  const action = target.getAttribute('data-action');
  const itemId = target.getAttribute('data-id');
  if (!action || !itemId) return;

  const cart = getCart();
  const item = cart.find((entry) => entry.id === itemId);
  if (!item) return;

  if (action === 'inc') setQty(itemId, item.qty + 1);
  if (action === 'dec') setQty(itemId, item.qty - 1);
  if (action === 'remove') removeItem(itemId);
  renderCart();
});

// ─── FADE IN ON SCROLL ────────────────────────────────────────────────────────

function initScrollObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll(
    '.product-card, .testimonial-card, .value-card, .category-card, .trust-item, .process-step'
  ).forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
    observer.observe(el);
  });
}

// ─── PRODUCT DETAIL: THUMBNAIL SWITCHER ───────────────────────────────────────

const thumbs = document.querySelectorAll('.thumb');
const mainImg = document.querySelector('.main-image img');
if (thumbs.length && mainImg) {
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = thumb.querySelector('img').src;
    });
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────

createCartDrawer();
renderCart();

// Open cart drawer on nav cart click
document.querySelectorAll('.snipcart-checkout, .nav-cart').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openCartDrawer();
  });
});

// Render the product grid (async, handles local or remote data)
renderProductGrid();