import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, FALLBACK_PRODUCTS } from '../services/api';
import { useBargain } from '../context/BargainContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { 
  Star, ShoppingCart, Mic, ShieldCheck, Truck, 
  RotateCcw, Sparkles, Check, Heart, Share2 
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openBargaining } = useBargain();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const data = await productApi.getDetail(id);
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.image_url);
      } catch {
        const found = FALLBACK_PRODUCTS.find(p => p.id === id || p.slug === id) || FALLBACK_PRODUCTS[0];
        setProduct(found);
        setSelectedImage(found.images?.[0] || found.image_url);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-12 h-12 bg-amber-200 rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  const discountPercent = product.discount_percent || 
    (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  const images = product.images?.length ? product.images : [product.image_url];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Product Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-premium">
        
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            {/* Brand & Category */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-bold text-amber-600 uppercase tracking-wider">{product.brand || 'Local Verified Brand'}</span>
              <span>{product.category}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings & Stock */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                <span>{product.rating || 4.3}</span>
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              </div>
              <span className="text-xs text-slate-500">
                {(product.review_count || 450).toLocaleString('en-IN')} verified reviews
              </span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-bold text-emerald-700">
                In Stock ({product.stock_quantity || 24} units left)
              </span>
            </div>

            {/* Price Box */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Current Selling Price</span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl font-black text-slate-900">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.mrp > product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      MRP ₹{product.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {product.bargaining_enabled && (
                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white inline-block">
                    AI Bargain Ready
                  </span>
                  <p className="text-[11px] text-amber-900 mt-1">Speak your price in Tamil/Hindi/EN</p>
                </div>
              )}
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-4">
              {product.description}
            </p>

            {/* Specifications Grid */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Key Specifications
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[11px] font-medium">{key}</span>
                      <span className="font-bold text-slate-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Add to Cart */}
              <button
                onClick={() => addToCart(product, 1)}
                className="py-3.5 px-6 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>

              {/* Buy Now / Speak Your Price */}
              <button
                onClick={() => openBargaining(product)}
                className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4 animate-pulse" />
                Buy Now (Speak Your Price)
              </button>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Confidential seller pricing protected by KURALO BOOK Server Security</span>
            </div>
          </div>

        </div>

      </div>

      {/* Similar Products Recommendation */}
      {product.similar_products?.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Similar Products in {product.category}
              </h2>
              <p className="text-xs text-slate-500">
                Customers also bargained and purchased these recommendations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.similar_products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
