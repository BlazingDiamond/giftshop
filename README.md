# Huda Therapy

## File Structure
```
giftshop/
├── index.html           ← Landing page
├── shop.html            ← Full catalogue with filters
├── product.html         ← Dynamic product page (?id=product-slug)
├── about.html           ← Brand story + contact form
├── css/style.css        ← All styles
├── js/main.js           ← Nav, filters, custom cart + Paystack popup checkout
└── giftshop-backend/    ← Django API (payments, orders, operations items)
```

## Paystack checkout flow

```
[Browser] -- cart total + email --> [Django /api/payments/initialize/]
[Browser] <-- access_code -------- [Django] -- secret key --> [Paystack API]
[Browser] -- PaystackPop.resumeTransaction(access_code) --> [Paystack popup]
[Browser] -- reference -----------> [Django /api/payments/verify/] (after success)
                                              ↓
                              Order saved in DB + email to ORDER_NOTIFICATION_EMAIL
```

Successful payments are catalogued as `payments.Order` records (visible in Django admin) and an email is sent to `kiangoing0604@gmail.com` by default. In development, messages print to the runserver console unless SMTP is configured (see `.env.example`).

### 1. Paystack keys
1. Sign up at https://dashboard.paystack.com
2. Copy your **test** public and secret keys.
3. Export them before starting Django (see `giftshop-backend/.env.example`):

```bash
export PAYSTACK_SECRET_KEY=sk_test_...
export PAYSTACK_PUBLIC_KEY=pk_test_...
```

Optional: set `PAYSTACK_PUBLIC_KEY` in `js/main.js` as a fallback if the API response does not include it.

### 2. Run the backend
```bash
cd giftshop-backend
pip install -r requirements.txt
cd mysite
python manage.py migrate
python manage.py runserver
```

API base URL defaults to `http://127.0.0.1:8000` in `js/main.js` (`API_BASE_URL`).

### 3. Run the frontend
Serve the `giftshop/` folder with any static server, for example:

```bash
cd giftshop
python -m http.server 5500
```

Open `http://127.0.0.1:5500`, add items to the cart, enter an email, and click **Pay securely**.

### 4. CORS
`CORS_ALLOW_ALL_ORIGINS` is enabled in Django for local development. Restrict origins before production.

## Hosting & contact form
Deploy the static frontend on your host (GitHub Pages, Cloudflare Pages, Vercel, etc.) and point `API_BASE_URL` in `js/main.js` to your deployed Django API.

In `about.html`, set the contact form `action` to your form endpoint (Formspree, Getform, etc.) if you use one.

## Managing stock

Mark sold out — add class to any product card:
```html
<div class="product-card sold-out" ...>
```

Restock — remove the `sold-out` class.

## Managing products (stock catalog)

Products are stored in the database and served at `GET /api/catalog/products/`.

1. Open Django admin: http://127.0.0.1:8000/admin/
2. Go to **Catalog → Stock**
3. Add or edit items: name, slug, price, descriptions, **images** (JSON list of URLs), stock quantity, sold out, category, etc.

First-time setup:

```bash
cd giftshop-backend/mysite
python manage.py migrate
python manage.py seed_catalog
```

The shop and product pages update automatically when you save changes in admin.

Therapy items use category `therapy` — they are not sold through the cart; customers email **huda1therapy@gmail.com** to book.

## Order emails (real inbox delivery)

1. Copy `giftshop-backend/.env.example` → `giftshop-backend/.env`
2. Set `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` (Gmail **App Password**, not your normal login password)
3. Restart `runserver`
4. Test: `python manage.py send_test_order_email`

When SMTP credentials are in `.env`, Django sends to **kiangoing0604@gmail.com** automatically. Without them, emails only print in the terminal.

## Product photos in admin

In **Catalog → Stock**, open a product and use **Stock images** at the bottom — click **Choose File** on each row. Images are stored under `media/catalog/stock/` and served at `http://127.0.0.1:8000/media/...` for the shop.
