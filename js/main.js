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

/** Django API — change port if your runserver uses another one. */
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * loadProducts() — fetches published stock from the Django catalog API.
 */
async function loadProducts() {
  const res = await fetch(`${API_BASE_URL}/api/catalog/products/`);
  if (!res.ok) {
    throw new Error(`Could not load products (${res.status})`);
  }
  const data = await res.json();
  const list = Array.isArray(data) ? data : data.results || [];
  return list.map(enrichProduct);
}

function productDetailUrl(id) {
  return `product.html?id=${encodeURIComponent(id)}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const THERAPY_SCHEDULING_EMAIL = 'huda1therapy@gmail.com';

function defaultProductMeta(product) {
  const availability = product.soldOut ? 'Sold out' : 'In stock';
  if (product.category === 'therapy') {
    return [
      { key: 'Type', val: 'Therapy session' },
      { key: 'Scheduling', val: `Email ${THERAPY_SCHEDULING_EMAIL}` },
      { key: 'Availability', val: availability }
    ];
  }
  return [
    { key: 'Handmade', val: 'Crafted in South Africa' },
    { key: 'Availability', val: availability },
    { key: 'Delivery', val: '3–5 working days, SA-wide' }
  ];
}

function enrichProduct(product) {
  const isTherapy = product.category === 'therapy';
  const isFeatured = product.badge === 'Featured';
  const images =
    product.images?.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  return {
    ...product,
    price: Number(product.price),
    isTherapy,
    longDescription: product.longDescription || product.description,
    isFeatured,
    images,
    image: product.image || images[0] || '',
    meta: product.meta?.length ? product.meta : defaultProductMeta(product)
  };
}

/**
 * Builds the HTML string for a single product card.
 * @param {object} options.linkToDetail — wrap image/title in link (shop grid)
 * @param {object} options.detailPage — on product page (no link, extra class)
 */
function buildProductCard(product, options = {}) {
  const { linkToDetail = false, detailPage = false } = options;
  const escapedName = escapeHtml(product.name);
  const escapedDesc = escapeHtml(product.description);
  const detailUrl = productDetailUrl(product.id);

  const badgeHTML = product.badge
    ? `<span class="product-badge">${escapeHtml(product.badge)}</span>`
    : '';

  const soldOutBadge = `<span class="sold-out-badge">Sold Out</span>`;

  const buyButton = product.soldOut
    ? `<button class="btn-buy" disabled>Sold Out</button>`
    : product.isTherapy
      ? `<a href="${detailUrl}" class="btn-buy">View &amp; schedule</a>`
      : `<button type="button" class="btn-buy snipcart-add-item"
         data-item-id="${product.id}"
         data-item-price="${product.price.toFixed(2)}"
         data-item-url="${detailUrl}"
         data-item-name="${escapedName}"
         data-item-description="${escapedDesc}"
         data-item-image="${product.image.replace(/w=600/, 'w=300')}"
         data-item-category="${product.category}">Add to cart</button>`;

  const viewLink = linkToDetail
    ? `<a href="${detailUrl}" class="product-card-view-link" aria-label="View ${escapedName}">`
    : '';
  const viewLinkClose = linkToDetail ? '</a>' : '';

  const titleMarkup = linkToDetail
    ? `<h3 class="product-name"><a href="${detailUrl}" class="product-name-link">${escapedName}</a></h3>`
    : `<h3 class="product-name">${escapedName}</h3>`;

  const cardClasses = [
    'product-card',
    product.soldOut ? 'sold-out' : '',
    detailPage ? 'product-card--page' : '',
    linkToDetail ? 'product-card--linked' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${cardClasses}" data-category="${product.category}" data-product-id="${product.id}">
      ${viewLink}
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${escapeHtml(product.imageAlt)}" loading="lazy" />
        ${badgeHTML}
        ${soldOutBadge}
      </div>
      ${viewLinkClose}
      <div class="product-info">
        <p class="product-category">${escapeHtml(product.categoryLabel)}</p>
        ${titleMarkup}
        <p class="product-desc-short">${escapedDesc}</p>
        <div class="product-footer">
          <span class="product-price">R ${product.price}</span>
          ${buyButton}
        </div>
        ${linkToDetail ? `<a href="${detailUrl}" class="product-view-details">View details</a>` : ''}
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

  grid.innerHTML = products.map((p) => buildProductCard(p, { linkToDetail: true })).join('');

  initFilters();
  initAddToCartButtons();
  initScrollObserver();
}
/**
 * Fetches product data, filters to only "Featured" badge products,
 * renders cards into #product-featured, then re-attaches cart listeners.
 */
async function renderFeaturedProducts() {
  const grid = document.getElementById('product-featured');
  if (!grid) return;

  let products;
  try {
    products = await loadProducts();
  } catch (err) {
    grid.innerHTML = '<p class="shop-error">Could not load products. Please try again later.</p>';
    console.error('loadProducts error:', err);
    return;
  }

  const featured = products.filter((p) => p.isFeatured);

  if (!featured.length) {
    grid.innerHTML = '<p class="shop-empty">No featured products right now.</p>';
    return;
  }

  grid.innerHTML = featured.map((p) => buildProductCard(p, { linkToDetail: true })).join('');

  initAddToCartButtons();
  initScrollObserver();
}


// ─── PRODUCT DETAIL PAGE ──────────────────────────────────────────────────────

function buildImageGallery(images, alt) {
  const main = images[0];
  const thumbs = images
    .map(
      (src, i) => `
    <button type="button" class="thumb${i === 0 ? ' active' : ''}" data-src="${src}" aria-label="View image ${i + 1}">
      <img src="${src.replace(/w=800/, 'w=300').replace(/w=600/, 'w=300')}" alt="" />
    </button>`
    )
    .join('');

  return `
    <div class="product-detail-images">
      <div class="main-image">
        <img id="main-product-img" src="${main}" alt="${escapeHtml(alt)}" />
      </div>
      ${images.length > 1 ? `<div class="thumb-row" role="list">${thumbs}</div>` : ''}
    </div>`;
}

function buildTherapyBookingHTML() {
  const mailto = `mailto:${THERAPY_SCHEDULING_EMAIL}?subject=${encodeURIComponent('Therapy appointment request')}`;
  return `
    <div class="therapy-booking" id="therapy-booking">
      <h2 class="therapy-booking-title">Schedule your <em>session</em></h2>
      <p class="therapy-booking-text">
        Appointments are arranged by email. Tell us your preferred dates and we will confirm your session.
      </p>
      <a href="${mailto}" class="btn-primary therapy-booking-email">Email ${THERAPY_SCHEDULING_EMAIL}</a>
    </div>`;
}

function buildProductDetailPage(product) {
  const paragraphs = product.longDescription
    .split('\n')
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const metaHTML = product.meta
    .map(
      (row) => `
      <div class="detail-meta-item">
        <span class="detail-meta-key">${escapeHtml(row.key)}</span>
        <span class="detail-meta-val">${escapeHtml(row.val)}</span>
      </div>`
    )
    .join('');

  const therapyBlock = product.isTherapy ? buildTherapyBookingHTML() : '';

  const buyLabel = product.soldOut ? 'Sold Out' : `Add to cart — R ${product.price}`;

  const buyBtn = product.soldOut
    ? `<button type="button" class="btn-buy-lg" disabled>Sold Out</button>`
    : product.isTherapy
      ? ''
      : `<button type="button" class="btn-buy-lg snipcart-add-item" id="product-add-btn"
         data-item-id="${product.id}"
         data-item-price="${product.price.toFixed(2)}"
         data-item-url="${productDetailUrl(product.id)}"
         data-item-name="${escapeHtml(product.name)}"
         data-item-description="${escapeHtml(product.description)}"
         data-item-image="${product.image.replace(/w=600/, 'w=300')}"
         data-item-category="${product.category}">${buyLabel}</button>`;

  return `
    <div class="product-page-layout">
      <aside class="product-page-card">
        ${buildProductCard(product, { detailPage: true })}
      </aside>
      <div class="product-page-content">
        ${buildImageGallery(product.images, product.imageAlt)}
        <div class="detail-content">
          <p class="detail-category">${escapeHtml(product.categoryLabel)}</p>
          <h1 class="detail-title">${escapeHtml(product.name)}</h1>
          <p class="detail-price">R ${product.price.toFixed(2)}</p>
          <div class="detail-description detail-description-long">
            ${paragraphs}
          </div>
          <div class="detail-meta">${metaHTML}</div>
          ${therapyBlock}
          <div class="buy-section">
            ${buyBtn}
            <a href="about.html#contact" class="btn-outline">Questions?</a>
          </div>
          <p class="detail-footnote">
            ✦ ${product.isTherapy ? 'Therapy sessions are booked by email — not through the cart.' : 'Arrives gift-wrapped in a kraft box with a handwritten care card.'}<br/>
            ✦ Secure checkout powered by Paystack — ZAR only.
          </p>
        </div>
      </div>
    </div>`;
}

function initImageGallery() {
  const thumbs = document.querySelectorAll('.thumb[data-src]');
  const mainImg = document.querySelector('#main-product-img');
  if (!thumbs.length || !mainImg) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = thumb.dataset.src;
    });
  });
}

async function renderProductDetail() {
  const root = document.getElementById('product-detail-root');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    root.innerHTML = '<p class="shop-error">No product specified. <a href="shop.html">Back to shop</a></p>';
    return;
  }

  let products;
  try {
    products = await loadProducts();
  } catch (err) {
    root.innerHTML = '<p class="shop-error">Could not load product.</p>';
    console.error(err);
    return;
  }

  const product = products.find((p) => p.id === id);
  if (!product) {
    root.innerHTML = '<p class="shop-error">Product not found. <a href="shop.html">Back to shop</a></p>';
    return;
  }

  document.title = `${product.name} — Huda Therapy`;
  const crumb = document.getElementById('breadcrumb-current');
  if (crumb) crumb.textContent = product.name;

  root.innerHTML = buildProductDetailPage(product);
  initImageGallery();
  initAddToCartButtons();

  const related = products.filter((p) => p.id !== id).slice(0, 3);
  const relatedSection = document.getElementById('related-section');
  const relatedGrid = document.getElementById('related-grid');
  if (relatedSection && relatedGrid && related.length) {
    relatedSection.hidden = false;
    relatedGrid.innerHTML = related.map((p) => buildProductCard(p, { linkToDetail: true })).join('');
    initAddToCartButtons();
    initScrollObserver();
  }
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
/** Fallback if the initialize response omits public_key (set pk_test_… from Paystack dashboard). */
const PAYSTACK_PUBLIC_KEY = 'pk_test_9d407570be17d3e7caf8d433ddae3a47433d459b';
const PAYSTACK_KEY_PLACEHOLDER = 'pk_test_REPLACE_ME';
const PAYSTACK_INLINE_JS = 'https://js.paystack.co/v2/inline.js';
/** Flip this to false (or wire it to a server flag) to disable the Paystack button
 *  if the main payment system is down. The manual bank-transfer flow stays available. */
const PAYSTACK_ENABLED = true;

/** Owner's banking details shown in the manual "Pay via bank transfer" popup. */
const BANK_TRANSFER_DETAILS = {
  accountName: 'Huda (Pty) Ltd',
  bank: 'First National Bank',
  accountNumber: '000000000',
  accountType: 'Cheque / Business',
  branchCode: '250655',
  reference: 'Use your name as reference'
};

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
  const product = {
    id: button.dataset.itemId || `item-${Date.now()}`,
    name: button.dataset.itemName || 'Product',
    description: button.dataset.itemDescription || '',
    image: button.dataset.itemImage || '',
    price: Number.isFinite(price) ? price : 0
  };
  product.category = button.dataset.itemCategory || '';
  product.description = button.dataset.itemDescription || '';
  return product;
}

function upsertCartItem(product) {
  const cart = getCart();
  const key = product.cartKey || product.id;
  const existing = cart.find((item) => (item.cartKey || item.id) === key);
  if (existing) existing.qty += 1;
  else cart.push({ ...product, cartKey: key, qty: 1 });
  setCart(cart);
  return cart;
}

function setQty(itemId, qty) {
  const cart = getCart()
    .map((item) => ((item.cartKey || item.id) === itemId ? { ...item, qty } : item))
    .filter((item) => item.qty > 0);
  setCart(cart);
  return cart;
}

function removeItem(itemId) {
  const cart = getCart().filter((item) => (item.cartKey || item.id) !== itemId);
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
      <label class="cart-email-label" for="cart-checkout-email">Email for receipt</label>
      <input type="email" id="cart-checkout-email" class="cart-checkout-email" placeholder="you@example.com" autocomplete="email" />
      <button type="button" class="btn-primary cart-checkout-btn" ${PAYSTACK_ENABLED ? '' : 'disabled'}>Pay securely</button>
      <button type="button" class="btn-secondary cart-banktransfer-btn">Pay via bank transfer</button>
    </div>
  `;
  document.body.appendChild(drawer);

  const close = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('show');
  };
  overlay.addEventListener('click', close);
  drawer.querySelector('.cart-close').addEventListener('click', close);
  drawer.querySelector('.cart-checkout-btn').addEventListener('click', checkoutWithPaystack);
  drawer.querySelector('.cart-banktransfer-btn').addEventListener('click', openBankTransferModal);
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
  const bankTransferBtn = drawer.querySelector('.cart-banktransfer-btn');

  list.innerHTML = '';
  if (!cart.length) {
    empty.style.display = 'block';
    checkoutBtn.disabled = true;
    if (bankTransferBtn) bankTransferBtn.disabled = true;
  } else {
    empty.style.display = 'none';
    checkoutBtn.disabled = !PAYSTACK_ENABLED;
    if (bankTransferBtn) bankTransferBtn.disabled = false;
    cart.forEach((item) => {
      const lineId = item.cartKey || item.id;
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-main">
          <div>
            <p class="cart-item-name">${item.name}</p>
          </div>
          <p class="cart-item-price">${formatZar(item.price)}</p>
        </div>
        <div class="cart-item-actions">
          <button type="button" data-action="dec" data-id="${lineId}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-action="inc" data-id="${lineId}">+</button>
          <button type="button" data-action="remove" data-id="${lineId}">Remove</button>
        </div>`;
      list.appendChild(li);
    });
  }
  totalEl.textContent = formatZar(cartTotal(cart));
}

function loadPaystackInline() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve(window.PaystackPop);
      return;
    }
    const existing = document.querySelector('script[data-paystack-inline]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.PaystackPop));
      existing.addEventListener('error', () => reject(new Error('Paystack script failed to load.')));
      return;
    }
    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_JS;
    script.dataset.paystackInline = 'true';
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Paystack script failed to load.'));
    document.head.appendChild(script);
  });
}

function cartPayloadForApi(cart) {
  return cart.map((item) => ({
    id: item.id,
    cartKey: item.cartKey,
    name: item.name,
    price: item.price,
    qty: item.qty,
    category: item.category || '',
    description: item.description || ''
  }));
}

function resolvePaystackPublicKey(serverKey) {
  const isUsable = (key) => {
    const trimmed = (key || '').trim();
    return trimmed && trimmed !== PAYSTACK_KEY_PLACEHOLDER;
  };
  if (isUsable(serverKey)) return serverKey.trim();
  if (isUsable(PAYSTACK_PUBLIC_KEY)) return PAYSTACK_PUBLIC_KEY.trim();
  return null;
}

async function verifyPaymentOnServer(reference, cart) {
  const res = await fetch(`${API_BASE_URL}/api/payments/verify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference,
      cart: cartPayloadForApi(cart || [])
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Could not verify payment.');
  if (data.status !== 'success') throw new Error('Payment was not successful.');
  return data;
}

async function checkoutWithPaystack() {
  const cart = getCart();
  if (!cart.length) {
    showNotification('Your cart is empty.');
    return;
  }

  const emailInput = document.querySelector('#cart-checkout-email');
  const email = emailInput?.value?.trim();
  if (!email) {
    showNotification('Enter your email before checkout.');
    emailInput?.focus();
    return;
  }

  const total = cartTotal(cart);
  const checkoutBtn = document.querySelector('.cart-checkout-btn');
  if (checkoutBtn) checkoutBtn.disabled = true;

  try {
    const initRes = await fetch(`${API_BASE_URL}/api/payments/initialize/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: Number(total.toFixed(2)),
        cart: cartPayloadForApi(cart)
      })
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) {
      throw new Error(initData.detail || 'Could not start checkout.');
    }

    const publicKey = resolvePaystackPublicKey(initData.public_key);
    if (!publicKey) {
      throw new Error('Set PAYSTACK_PUBLIC_KEY on the server or in js/main.js.');
    }
    if (!initData.access_code) {
      throw new Error('No access code returned from the server.');
    }

    await loadPaystackInline();
    const PaystackPop = window.PaystackPop;
    if (!PaystackPop) {
      throw new Error('Paystack script failed to load.');
    }
    const popup = new PaystackPop();
    if (typeof popup.resumeTransaction !== 'function') {
      throw new Error('Paystack Inline v2 is required (v1 only supports openIframe).');
    }
    popup.resumeTransaction(initData.access_code, {
      onCancel: () => showNotification('Payment cancelled.'),
      onError: (error) => {
        showNotification(error?.message || 'Could not open payment.', 5000);
      },
      onSuccess: (transaction) => {
        const cartSnapshot = getCart();
        verifyPaymentOnServer(transaction.reference, cartSnapshot)
          .then(() => {
            setCart([]);
            renderCart();
            document.querySelector('#custom-cart-drawer')?.classList.remove('open');
            document.querySelector('#cart-overlay')?.classList.remove('show');
            showNotification('Payment successful — thank you!', 5000);
            const url = new URL(window.location.href);
            url.searchParams.set('payment', 'success');
            window.history.replaceState({}, '', url);
          })
          .catch((err) => {
            showNotification(err.message || 'Payment verification failed.', 5000);
          });
      }
    });
  } catch (err) {
    showNotification(err.message || 'Checkout failed.', 5000);
  } finally {
    if (checkoutBtn) checkoutBtn.disabled = !getCart().length;
  }
}

// ─── MANUAL BANK TRANSFER (proof-of-payment upload, bypasses Paystack) ────────

function injectBankTransferStyles() {
  if (document.querySelector('#bank-transfer-styles')) return;
  const style = document.createElement('style');
  style.id = 'bank-transfer-styles';
  style.textContent = `
    #bank-transfer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 9998;
      display: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #bank-transfer-overlay.show {
      display: block;
      opacity: 1;
    }
    #bank-transfer-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      width: min(440px, 92vw);
      max-height: 88vh;
      overflow-y: auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      z-index: 9999;
      display: none;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #bank-transfer-modal.open {
      display: block;
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .bank-transfer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid #eee;
    }
    .bank-transfer-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    .bank-transfer-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: #666;
    }
    .bank-transfer-body {
      padding: 20px;
    }
    .bank-transfer-intro {
      margin: 0 0 16px;
      color: #444;
      font-size: 0.92rem;
    }
    .bank-transfer-details {
      margin: 0 0 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
    }
    .bank-transfer-details > div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      font-size: 0.9rem;
    }
    .bank-transfer-details > div:nth-child(even) {
      background: #fafafa;
    }
    .bank-transfer-details dt {
      color: #777;
      font-weight: 500;
    }
    .bank-transfer-details dd {
      margin: 0;
      font-weight: 600;
      text-align: right;
    }
    .bank-transfer-upload-label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.88rem;
      font-weight: 500;
    }
    .bank-transfer-proof-input {
      display: block;
      width: 100%;
      margin-bottom: 18px;
    }
  `;
  document.head.appendChild(style);
}

function createBankTransferModal() {
  if (document.querySelector('#bank-transfer-modal')) return;
  injectBankTransferStyles();

  const overlay = document.createElement('div');
  overlay.id = 'bank-transfer-overlay';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  modal.id = 'bank-transfer-modal';
  modal.innerHTML = `
    <div class="bank-transfer-header">
      <h3>Pay via bank transfer</h3>
      <button type="button" class="bank-transfer-close" aria-label="Close">&times;</button>
    </div>
    <div class="bank-transfer-body">
      <p class="bank-transfer-intro">Make your payment using the details below, then upload proof of payment.</p>
      <dl class="bank-transfer-details">
        <div><dt>Account name</dt><dd>${BANK_TRANSFER_DETAILS.accountName}</dd></div>
        <div><dt>Bank</dt><dd>${BANK_TRANSFER_DETAILS.bank}</dd></div>
        <div><dt>Account number</dt><dd>${BANK_TRANSFER_DETAILS.accountNumber}</dd></div>
        <div><dt>Account type</dt><dd>${BANK_TRANSFER_DETAILS.accountType}</dd></div>
        <div><dt>Branch code</dt><dd>${BANK_TRANSFER_DETAILS.branchCode}</dd></div>
        <div><dt>Reference</dt><dd>${BANK_TRANSFER_DETAILS.reference}</dd></div>
      </dl>
      <label class="bank-transfer-upload-label" for="bank-transfer-proof">Proof of payment (photo)</label>
      <input type="file" id="bank-transfer-proof" class="bank-transfer-proof-input" accept="image/*" />
      <button type="button" class="btn-primary bank-transfer-submit-btn">Submit proof of payment</button>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('open');
    overlay.classList.remove('show');
  };
  overlay.addEventListener('click', close);
  modal.querySelector('.bank-transfer-close').addEventListener('click', close);
  modal.querySelector('.bank-transfer-submit-btn').addEventListener('click', submitBankTransferProof);
}

function openBankTransferModal() {
  const cart = getCart();
  if (!cart.length) {
    showNotification('Your cart is empty.');
    return;
  }
  createBankTransferModal();
  document.querySelector('#bank-transfer-modal')?.classList.add('open');
  document.querySelector('#bank-transfer-overlay')?.classList.add('show');
}

function closeBankTransferModal() {
  document.querySelector('#bank-transfer-modal')?.classList.remove('open');
  document.querySelector('#bank-transfer-overlay')?.classList.remove('show');
}

async function submitManualPaymentProof(email, cart, proofFile) {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('amount', Number(cartTotal(cart).toFixed(2)));
  formData.append('cart', JSON.stringify(cartPayloadForApi(cart)));
  formData.append('proof', proofFile);

  const res = await fetch(`${API_BASE_URL}/api/payments/manual/`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Could not submit proof of payment.');
  return data;
}

async function submitBankTransferProof() {
  const cart = getCart();
  if (!cart.length) {
    showNotification('Your cart is empty.');
    closeBankTransferModal();
    return;
  }

  const emailInput = document.querySelector('#cart-checkout-email');
  const email = emailInput?.value?.trim();
  if (!email) {
    showNotification('Enter your email before submitting proof of payment.');
    return;
  }

  const proofInput = document.querySelector('#bank-transfer-proof');
  const proofFile = proofInput?.files?.[0];
  if (!proofFile) {
    showNotification('Upload a photo of your proof of payment.');
    return;
  }

  const submitBtn = document.querySelector('.bank-transfer-submit-btn');
  if (submitBtn) submitBtn.disabled = true;

  try {
    await submitManualPaymentProof(email, cart, proofFile);
    setCart([]);
    renderCart();
    closeBankTransferModal();
    document.querySelector('#custom-cart-drawer')?.classList.remove('open');
    document.querySelector('#cart-overlay')?.classList.remove('show');
    showNotification('Proof of payment received — we will confirm shortly.', 5000);
    if (proofInput) proofInput.value = '';
  } catch (err) {
    showNotification(err.message || 'Could not submit proof of payment.', 5000);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ─── INIT ADD-TO-CART BUTTONS (called after grid renders) ─────────────────────

function initAddToCartButtons() {
  document.querySelectorAll('.snipcart-add-item').forEach((button) => {
    if (button.dataset.cartBound === 'true') return;
    button.dataset.cartBound = 'true';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const product = readProductFromButton(button);
      if (product.category === 'therapy') {
        showNotification(`Email ${THERAPY_SCHEDULING_EMAIL} to schedule therapy sessions.`);
        return;
      }
      const cart = upsertCartItem(product);
      renderCart();
      const msg = `Added to cart: ${product.name}`;
      showNotification(msg);
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
  const item = cart.find((entry) => (entry.cartKey || entry.id) === itemId);
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

// ─── BOOT ─────────────────────────────────────────────────────────────────────

function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    showNotification('Thank you — your payment was received.', 5000);
    params.delete('payment');
    const path = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState({}, '', path);
  }
}

createCartDrawer();
renderCart();
handlePaymentReturn();

document.querySelectorAll('.snipcart-checkout, .nav-cart').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openCartDrawer();
  });
});

if (document.getElementById('product-detail-root')) {
  renderProductDetail();
} else if (document.getElementById('product-featured')) {
  renderFeaturedProducts();
} else {
  renderProductGrid();
}