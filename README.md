# Terra & Soul — E-commerce Site

## File Structure
```
giftshop/
├── index.html           ← Landing page
├── shop.html            ← Full catalogue with filters
├── product-detail.html  ← Single product page (duplicate per product)
├── about.html           ← Brand story + contact form
├── css/style.css        ← All styles
└── js/main.js           ← Nav, filters, custom cart + PayFast redirect
```

## Setup Checklist

### 1. PayFast (SA Payments)
1. Sign up at https://www.payfast.co.za
2. Open `js/main.js` and replace:
   - `YOUR_PAYFAST_MERCHANT_ID`
   - `YOUR_PAYFAST_MERCHANT_KEY`
3. Switch `PAYFAST_CHECKOUT_URL` to production when going live:
   - Sandbox: `https://sandbox.payfast.co.za/eng/process`
   - Production: `https://www.payfast.co.za/eng/process`
4. For production security, move checkout payload/signature generation to a backend endpoint and validate ITN server-side.

### 2. Hosting & contact form
1. Deploy this folder as static files on your host (for example GitHub Pages, Cloudflare Pages, or Vercel).
2. In `about.html`, set the contact form `action` to your form endpoint (Formspree, Getform, a serverless function, etc.) — replace the placeholder URL if you use one.

## Managing Stock

Mark sold out — add class to any product card:
  <div class="product-card sold-out" ...>

Restock — remove the sold-out class.

## Adding Products
Copy any product card in shop.html. Update:
- data-item-id (unique slug)
- data-item-price
- data-item-name
- data-item-description
- data-item-image
- The visible HTML name, price, description, img src
# giftshop
