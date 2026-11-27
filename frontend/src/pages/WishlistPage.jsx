import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { FALLBACK_PRODUCTS } from '../services/api';
import { Heart, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const [wishlistItems] = useState([
    FALLBACK_PRODUCTS[0], // boAt
    FALLBACK_PRODUCTS[3], // Kanchipuram Saree
    FALLBACK_PRODUCTS[6], // Sony Headphones
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" />
          My Wishlist & Saved Deals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Items saved for instant AI voice bargaining whenever you are ready.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
