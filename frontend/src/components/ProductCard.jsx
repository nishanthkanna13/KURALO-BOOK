import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBargain } from '../context/BargainContext';
import { useCart } from '../context/CartContext';
import { Star, ShoppingCart, Mic, Heart } from 'lucide-react';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { openBargaining } = useBargain();
  const { addToCart } = useCart();

  const handleCardClick = () => {
    navigate(`/product/${product.id || product.slug}`);
  };

  const handleBargainClick = (e) => {
    e.stopPropagation();
    openBargaining(product);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const discountPercent = product.discount_percent || 
    (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/60 shadow-sm hover:shadow-premium-hover transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Bargain Enabled Pill */}
        {product.bargaining_enabled && (
          <div className="absolute top-3 right-3 bg-amber-500/95 text-white text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 backdrop-blur-xs">
            <Mic className="w-2.5 h-2.5" />
            AI Bargain
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-amber-700 tracking-wider uppercase text-[10px]">{product.brand || 'Verified Seller'}</span>
            <span className="text-slate-400">{product.category}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-amber-600 transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {product.description}
          </p>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md">
              <span>{product.rating || 4.2}</span>
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
            </div>
            <span className="text-slate-400 text-xs">
              ({(product.review_count || 120).toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Pricing & CTA Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>

            {/* Buy Now / Speak Your Price */}
            <button
              onClick={handleBargainClick}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              Speak Price
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
