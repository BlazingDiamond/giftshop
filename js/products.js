/**
 * Product catalogue now lives in the Django backend (Catalog → Stock).
 *
 * - Public API: GET http://127.0.0.1:8000/api/catalog/products/
 * - Manage items: Django admin → Catalog → Stock
 *
 * Run once after migrate: python manage.py seed_catalog
 *
 * The shop loads products via loadProducts() in main.js.
 */
