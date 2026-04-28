/**
 * products.js — Single source of truth for the product catalogue.
 *
 * HOW TO ADD / EDIT / REMOVE A PRODUCT
 * ─────────────────────────────────────
 * Just edit the PRODUCTS array below. The shop page renders itself from this list.
 *
 * FIELD REFERENCE
 * ───────────────
 * id          {string}  Unique slug. Used as the cart key and future API identifier.
 * name        {string}  Display name shown on the card.
 * category    {string}  Must match a filter-btn data-filter value:
 *                         "jewellery" | "crystals" | "remedies"
 * categoryLabel {string} Human-readable category label shown on the card.
 * price       {number}  Price in ZAR (no currency symbol).
 * description {string}  Short blurb shown on the card.
 * image       {string}  URL or relative path to the product image.
 * imageAlt    {string}  Alt text for the image.
 * badge       {string|null}  Optional badge text e.g. "New", "Popular". null = no badge.
 * soldOut     {boolean} true disables the Add to Cart button and shows a Sold Out badge.
 *
 * BACKEND SWAP
 * ────────────
 * When you have an API, replace the PRODUCTS export in main.js's loadProducts()
 * with a fetch call. The shape of each object should match this schema.
 * Example:
 *   async function loadProducts() {
 *     const res = await fetch('/api/products');
 *     return res.json(); // expects an array matching the schema above
 *   }
 */

const PRODUCTS = [

  // ─── JEWELLERY ────────────────────────────────────────────────────────────

  {
    id: "sacred-journey",
    name: "Sacred Journey Turtle Earrings",
    category: "jewellery",
    categoryLabel: "Jewellery",
    price: 38,
    description: "Tutles are a powerful symbol of longevity, wear this as a reminder of that you are protected and grounded.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    imageAlt: "placeholder",
    badge: "New",
    soldOut: false
  },
  {
    id: "turquoise-bracelet",
    name: "Turquoise Wrap Bracelet",
    category: "jewellery",
    categoryLabel: "Jewellery",
    price: 260,
    description: "Woven leather cord with genuine turquoise beads. Adjustable and hand-knotted for durability.",
    image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80",
    imageAlt: "Turquoise Wrap Bracelet",
    badge: null,
    soldOut: false
  },
  {
    id: "labradorite-pendant",
    name: "Labradorite Pendant",
    category: "jewellery",
    categoryLabel: "Jewellery",
    price: 395,
    description: "A flashing labradorite cabochon wire-wrapped in copper. Hung on an 18-inch chain.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    imageAlt: "Labradorite Pendant",
    badge: null,
    soldOut: false
  },

  // ─── CRYSTALS ─────────────────────────────────────────────────────────────

  {
    id: "amethyst-cluster",
    name: "Amethyst Cluster",
    category: "crystals",
    categoryLabel: "Crystals",
    price: 320,
    description: "Natural deep-purple amethyst cluster, ethically sourced. Known for calm and mental clarity.",
    image: "https://images.unsplash.com/photo-1567225557594-88d73398014a?w=600&q=80",
    imageAlt: "Amethyst Cluster",
    badge: "Popular",
    soldOut: false
  },
  {
    id: "clear-quartz-point",
    name: "Clear Quartz Point",
    category: "crystals",
    categoryLabel: "Crystals",
    price: 210,
    description: "A single polished clear quartz point. The master healer — amplifies energy and intention.",
    image: "https://images.unsplash.com/photo-1589568569637-c8bbf24b5398?w=600&q=80",
    imageAlt: "Clear Quartz Point",
    badge: null,
    soldOut: false
  },
  {
    id: "black-tourmaline-set",
    name: "Black Tourmaline Set",
    category: "crystals",
    categoryLabel: "Crystals",
    price: 285,
    description: "Three raw black tourmaline pieces for protection. Place in corners of a room or carry one daily.",
    image: "https://images.unsplash.com/photo-1576061645904-571db29a48d6?w=600&q=80",
    imageAlt: "Black Tourmaline Set",
    badge: null,
    soldOut: true
  },

  // ─── HEALING REMEDIES ─────────────────────────────────────────────────────

  {
    id: "lavender-healing-balm",
    name: "Lavender Healing Balm",
    category: "remedies",
    categoryLabel: "Healing Remedies",
    price: 185,
    description: "Beeswax base with lavender oil and dried chamomile. Soothes skin and settles the mind.",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80",
    imageAlt: "Lavender Healing Balm",
    badge: null,
    soldOut: true
  },
  {
    id: "rooibos-buchu-tea",
    name: "Rooibos & Buchu Immunity Tea",
    category: "remedies",
    categoryLabel: "Healing Remedies",
    price: 145,
    description: "A uniquely South African blend of rooibos, buchu, and honey bush. 30 loose-leaf sachets per tin.",
    image: "https://images.unsplash.com/photo-1543362906-acfc16c67564?w=600&q=80",
    imageAlt: "Rooibos & Buchu Immunity Tea",
    badge: "New",
    soldOut: false
  },
  {
    id: "rosehip-marula-oil",
    name: "Rosehip & Marula Face Oil",
    category: "remedies",
    categoryLabel: "Healing Remedies",
    price: 295,
    description: "Cold-pressed rosehip and marula oil blended with frankincense. Anti-inflammatory and deeply nourishing.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80",
    imageAlt: "Rosehip & Marula Face Oil",
    badge: null,
    soldOut: false
  },

  //-----------------Therapy-------------------------
  {
    id: "huda-therapy",
    name: "Huda Therapy",
    category: "therapy",
    categoryLabel: "Therapies",
    price: 750,
    description: "Using crystals and oils you'll be harmonized and balanced in the seven main energy centers of the body.",
    image: "images/Huda_Logo_1-removebg-preview.png",
    imageAlt: "placeholder",
    badge: "popular",
    soldOut: false
  }

];
