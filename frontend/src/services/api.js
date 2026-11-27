import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kb_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fallback Demo Products Data
export const FALLBACK_PRODUCTS = [
  {
    id: "prod-001",
    name: "boAt Airdopes 141 True Wireless Earbuds",
    slug: "boat-airdopes-141",
    description: "True Wireless Earbuds with 42H Playback, ENx™ Noise Cancellation Tech, BEAST™ Low Latency Mode (60ms), Quad Mics, IPX4 Water Resistance & Bluetooth v5.3.",
    price: 999.0,
    mrp: 2499.0,
    discount_percent: 60.0,
    category: "Electronics",
    category_id: "cat-1",
    brand: "boAt",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80"
    ],
    rating: 4.3,
    review_count: 12540,
    stock_quantity: 45,
    is_featured: true,
    is_trending: true,
    specifications: { "Battery": "42 Hours", "Connectivity": "Bluetooth 5.3", "Water Resistance": "IPX4", "Driver": "8mm Dynamic" },
    seller_id: "seller-001",
    bargaining_enabled: true,
  },
  {
    id: "prod-002",
    name: "Samsung Galaxy M14 5G (Icy Silver, 128GB)",
    slug: "samsung-galaxy-m14-5g",
    description: "50MP Triple Camera setup with F1.8 aperture, massive 6000 mAh Battery with 25W fast charging, 5G ready with 13 bands support.",
    price: 13499.0,
    mrp: 16999.0,
    discount_percent: 21.0,
    category: "Electronics",
    category_id: "cat-1",
    brand: "Samsung",
    image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80"],
    rating: 4.2,
    review_count: 5678,
    stock_quantity: 20,
    is_featured: true,
    is_trending: false,
    specifications: { "RAM": "4GB", "Storage": "128GB", "Display": "6.6-inch FHD+ 90Hz", "Processor": "Exynos 1330" },
    seller_id: "seller-001",
    bargaining_enabled: true,
  },
  {
    id: "prod-003",
    name: "Noise ColorFit Pulse 2 Max Smartwatch",
    slug: "noise-colorfit-pulse-2",
    description: "1.85'' TFT LCD Display, Bluetooth Calling with TruSync, 100 Sports Modes, 550 nits Brightness, 10-day battery life.",
    price: 1499.0,
    mrp: 5999.0,
    discount_percent: 75.0,
    category: "Electronics",
    category_id: "cat-1",
    brand: "Noise",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"],
    rating: 4.4,
    review_count: 24100,
    stock_quantity: 60,
    is_featured: true,
    is_trending: true,
    specifications: { "Display": "1.85 inch TFT", "Battery": "10 Days", "Calling": "Bluetooth calling enabled", "Sensors": "SpO2 & Heart Rate" },
    seller_id: "seller-001",
    bargaining_enabled: true,
  },
  {
    id: "prod-004",
    name: "Pure Kanchipuram Silk Saree (Royal Crimson)",
    slug: "kanchipuram-silk-saree",
    description: "Authentic hand-woven traditional Kanchipuram silk saree with pure zari woven pallu and border. Includes unstitched blouse piece.",
    price: 6499.0,
    mrp: 12999.0,
    discount_percent: 50.0,
    category: "Fashion",
    category_id: "cat-2",
    brand: "Sri Krishna Silks",
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"],
    rating: 4.7,
    review_count: 890,
    stock_quantity: 15,
    is_featured: true,
    is_trending: true,
    specifications: { "Fabric": "Pure Mulberry Silk", "Zari": "Gold Plated Zari", "Length": "6.3 Meters with Blouse", "Occasion": "Festive & Wedding" },
    seller_id: "seller-002",
    bargaining_enabled: true,
  },
  {
    id: "prod-005",
    name: "Classic Men's Slim-Fit Linen Casual Shirt",
    slug: "mens-linen-shirt",
    description: "Breathable 100% pure organic linen casual button-down shirt. Perfect for Indian summers, crafted with premium mother-of-pearl buttons.",
    price: 1799.0,
    mrp: 3499.0,
    discount_percent: 48.0,
    category: "Fashion",
    category_id: "cat-2",
    brand: "Linen Club",
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80"],
    rating: 4.5,
    review_count: 1420,
    stock_quantity: 35,
    is_featured: false,
    is_trending: true,
    specifications: { "Material": "100% Linen", "Fit": "Slim Fit", "Collar": "Spread Collar", "Wash": "Machine Wash Cold" },
    seller_id: "seller-002",
    bargaining_enabled: true,
  },
  {
    id: "prod-006",
    name: "Handcrafted Sheesham Wood Coffee Table",
    slug: "sheesham-wood-coffee-table",
    description: "Solid Sheesham wood center table with natural teak finish and spacious lower shelf for books and storage. Hand-carved by local artisans.",
    price: 7999.0,
    mrp: 14999.0,
    discount_percent: 47.0,
    category: "Home & Living",
    category_id: "cat-3",
    brand: "Artisan Woodworks",
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80"],
    rating: 4.6,
    review_count: 670,
    stock_quantity: 8,
    is_featured: true,
    is_trending: false,
    specifications: { "Material": "Sheesham Wood (Rosewood)", "Dimensions": "90 x 50 x 42 cm", "Weight": "16 kg", "Finish": "Natural Teak Finish" },
    seller_id: "seller-003",
    bargaining_enabled: true,
  },
  {
    id: "prod-007",
    name: "Sony WH-1000XM5 Wireless ANC Headphones",
    slug: "sony-wh-1000xm5",
    description: "Industry Leading Noise Canceling with 8 Microphones, Auto NC Optimizer, 30h Battery, Crystal Clear Hands-Free Calling and Multipoint Connection.",
    price: 26990.0,
    mrp: 34990.0,
    discount_percent: 23.0,
    category: "Electronics",
    category_id: "cat-1",
    brand: "Sony",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
    rating: 4.8,
    review_count: 3120,
    stock_quantity: 12,
    is_featured: true,
    is_trending: true,
    specifications: { "Battery": "30 Hours", "ANC": "Integrated Processor V1", "Quick Charge": "3 min for 3 hours", "Codec": "LDAC, AAC, SBC" },
    seller_id: "seller-001",
    bargaining_enabled: true,
  },
  {
    id: "prod-008",
    name: "Philips 4.1L Digital Air Fryer with Rapid Air Tech",
    slug: "philips-air-fryer-digital",
    description: "Fry with up to 90% less fat. Rapid Air Technology, touch screen with 7 presets, keep warm function, dishwasher-safe basket.",
    price: 6999.0,
    mrp: 11999.0,
    discount_percent: 41.0,
    category: "Home & Living",
    category_id: "cat-3",
    brand: "Philips",
    image_url: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&q=80",
    images: ["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80"],
    rating: 4.6,
    review_count: 4890,
    stock_quantity: 22,
    is_featured: false,
    is_trending: true,
    specifications: { "Capacity": "4.1 Litres", "Power": "1400 Watts", "Presets": "7 Digital Presets", "Technology": "Rapid Air 360" },
    seller_id: "seller-003",
    bargaining_enabled: true,
  }
];

export const FALLBACK_CATEGORIES = [
  { id: "cat-all", name: "All Categories", slug: "", icon: "✨" },
  { id: "cat-1", name: "Electronics", slug: "electronics", icon: "💻" },
  { id: "cat-2", name: "Fashion", slug: "fashion", icon: "👗" },
  { id: "cat-3", name: "Home & Living", slug: "home-living", icon: "🏠" },
  { id: "cat-4", name: "Books", slug: "books", icon: "📚" },
  { id: "cat-5", name: "Sports & Fitness", slug: "sports-fitness", icon: "🏋️" },
  { id: "cat-6", name: "Beauty & Care", slug: "beauty-care", icon: "💄" },
  { id: "cat-7", name: "Food & Groceries", slug: "food-groceries", icon: "🛒" },
];

export const productApi = {
  async getAll(params = {}) {
    try {
      const res = await api.get('/products', { params });
      return res.data;
    } catch {
      let filtered = [...FALLBACK_PRODUCTS];
      if (params.category) {
        filtered = filtered.filter(p => p.category.toLowerCase() === params.category.toLowerCase() || p.category_id === params.category);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
      }
      return { products: filtered, total: filtered.length, page: 1, limit: 20, total_pages: 1 };
    }
  },

  async getCategories() {
    try {
      const res = await api.get('/products/categories');
      return res.data;
    } catch {
      return FALLBACK_CATEGORIES;
    }
  },

  async getDetail(idOrSlug) {
    try {
      const res = await api.get(`/products/${idOrSlug}`);
      return res.data;
    } catch {
      const found = FALLBACK_PRODUCTS.find(p => p.id === idOrSlug || p.slug === idOrSlug) || FALLBACK_PRODUCTS[0];
      const similar = FALLBACK_PRODUCTS.filter(p => p.category === found.category && p.id !== found.id);
      return { ...found, similar_products: similar };
    }
  },

  async getFeatured() {
    try {
      const res = await api.get('/products/featured');
      return res.data;
    } catch {
      return FALLBACK_PRODUCTS.filter(p => p.is_featured);
    }
  },

  async getTrending() {
    try {
      const res = await api.get('/products/trending');
      return res.data;
    } catch {
      return FALLBACK_PRODUCTS.filter(p => p.is_trending);
    }
  }
};

export const bargainApi = {
  async start(productId, language = 'en') {
    try {
      const res = await api.post('/bargain/start', { product_id: productId, language });
      return res.data;
    } catch {
      const prod = FALLBACK_PRODUCTS.find(p => p.id === productId) || FALLBACK_PRODUCTS[0];
      const greetings = {
        en: `Hello! Welcome to KURALO BOOK 🛍️ You selected '${prod.name}'. The listed price is ₹${prod.price.toLocaleString('en-IN')}. Would you like to negotiate the price?`,
        ta: `வணக்கம்! KURALO BOOK-க்கு வரவேற்கிறோம் 🛍️ நீங்கள் '${prod.name}' தேர்ந்தெடுத்துள்ளீர்கள். இதன் நிர்ணயிக்கப்பட்ட விலை ₹${prod.price.toLocaleString('en-IN')}. நீங்கள் விலையை பேரம் பேச விரும்புகிறீர்களா?`,
        hi: `नमस्ते! KURALO BOOK में आपका स्वागत है 🛍️ आपने '${prod.name}' चुना है। इसकी वर्तमान कीमत ₹${prod.price.toLocaleString('en-IN')} है। क्या आप कीमत पर बातचीत करना चाहते हैं?`
      };
      return {
        session_id: `demo-session-${Date.now()}`,
        product_id: productId,
        listed_price: prod.price,
        greeting_message: greetings[language] || greetings.en,
        language,
        rounds_remaining: 3
      };
    }
  },

  async sendMessage(sessionId, message, offerPrice = null) {
    try {
      const res = await api.post('/bargain/message', {
        session_id: sessionId,
        message,
        offer_price: offerPrice
      });
      return res.data;
    } catch {
      // Local fallback bargaining calculation
      const numMatch = message.replace(/,/g, '').match(/\d{2,6}/);
      const parsedOffer = offerPrice || (numMatch ? parseFloat(numMatch[0]) : null);

      if (!parsedOffer) {
        return {
          session_id: sessionId,
          action: 'clarify',
          message: 'Could you please specify the price you have in mind (e.g. ₹1,200)?',
          rounds_used: 0,
          rounds_remaining: 3,
          is_final: false
        };
      }

      // Safe local counter calculation
      const counter = Math.round((parsedOffer * 1.1) / 50) * 50;
      return {
        session_id: sessionId,
        action: 'counter',
        message: `I understand your offer. Let me check the best available price for you. I can offer this product for ₹${counter.toLocaleString('en-IN')}. Would you like to proceed?`,
        approved_price: counter,
        counter_price: counter,
        rounds_used: 1,
        rounds_remaining: 2,
        is_final: false
      };
    }
  },

  async accept(sessionId) {
    try {
      const res = await api.post(`/bargain/accept?session_id=${sessionId}`);
      return res.data;
    } catch {
      return {
        session_id: sessionId,
        action: 'accept',
        message: "🎉 Wonderful! Let's continue with your order at the agreed price.",
        is_final: true
      };
    }
  },

  async reject(sessionId) {
    try {
      const res = await api.post(`/bargain/reject?session_id=${sessionId}`);
      return res.data;
    } catch {
      return {
        session_id: sessionId,
        action: 'reject',
        message: "Sorry, we are unable to offer this product at that price. However, I can suggest another attractive offer or a similar product.",
        is_final: true
      };
    }
  }
};

export const cartApi = {
  async get() {
    try {
      const res = await api.get('/cart');
      return res.data;
    } catch {
      const saved = localStorage.getItem('kb_cart');
      return saved ? JSON.parse(saved) : { items: [], item_count: 0, subtotal: 0, total_savings: 0, total: 0 };
    }
  },

  async addItem(productId, quantity = 1, bargainedPrice = null, sessionId = null) {
    try {
      const res = await api.post('/cart/items', {
        product_id: productId,
        quantity,
        bargained_price: bargainedPrice,
        bargaining_session_id: sessionId
      });
      return res.data;
    } catch {
      // Local cart storage
      const prod = FALLBACK_PRODUCTS.find(p => p.id === productId) || FALLBACK_PRODUCTS[0];
      const saved = localStorage.getItem('kb_cart');
      const cart = saved ? JSON.parse(saved) : { items: [], item_count: 0, subtotal: 0, total_savings: 0, total: 0 };

      const effectivePrice = bargainedPrice || prod.price;
      const existing = cart.items.find(i => i.product_id === productId && i.bargained_price === bargainedPrice);
      if (existing) {
        existing.quantity += quantity;
        existing.total_price = existing.quantity * effectivePrice;
      } else {
        cart.items.push({
          id: `item-${Date.now()}`,
          product_id: productId,
          product: prod,
          quantity,
          unit_price: prod.price,
          bargained_price: bargainedPrice,
          total_price: quantity * effectivePrice
        });
      }

      cart.item_count = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      cart.subtotal = cart.items.reduce((sum, i) => sum + i.total_price, 0);
      cart.total = cart.subtotal;
      cart.total_savings = cart.items.reduce((sum, i) => sum + ((i.product.mrp - (i.bargained_price || i.unit_price)) * i.quantity), 0);
      localStorage.setItem('kb_cart', JSON.stringify(cart));
      return cart;
    }
  }
};

export default api;
