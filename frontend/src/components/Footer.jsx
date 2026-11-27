import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mic, ShieldCheck, Truck, Headphones, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Value Props Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800 text-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Speak Your Price</h4>
              <p className="text-xs text-slate-400 mt-1">Real-time AI voice bargaining in Tamil, English, and Hindi.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Protected Pricing</h4>
              <p className="text-xs text-slate-400 mt-1">Server-side safe negotiation with verified local sellers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Fast Local Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">Free delivery over ₹1,000 with express 1-day options.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">24/7 Smart Support</h4>
              <p className="text-xs text-slate-400 mt-1">Multilingual customer assistance ready whenever you need it.</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center font-black shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-white text-lg tracking-tight">KURALO <span className="text-amber-500">BOOK</span></span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
              KURALO BOOK connects conscious shoppers with India's best local sellers, empowering natural voice negotiation powered by advanced AI.
            </p>
            <div className="text-xs text-amber-400 font-semibold">
              Tagline: "Shop Smart. Speak Your Price."
            </div>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Categories</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/shop?category=electronics" className="hover:text-amber-400">Electronics</Link></li>
              <li><Link to="/shop?category=fashion" className="hover:text-amber-400">Fashion & Sarees</Link></li>
              <li><Link to="/shop?category=home-living" className="hover:text-amber-400">Home & Living</Link></li>
              <li><Link to="/shop?category=books" className="hover:text-amber-400">Books</Link></li>
              <li><Link to="/shop?category=beauty-care" className="hover:text-amber-400">Beauty & Wellness</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Platform</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/shop" className="hover:text-amber-400">Explore Catalog</Link></li>
              <li><Link to="/orders" className="hover:text-amber-400">Track Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-amber-400">Wishlist</Link></li>
              <li><span className="text-slate-500 cursor-not-allowed">Seller Portal (Coming)</span></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-4">Supported Languages</h5>
            <div className="flex flex-col gap-1.5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                English (en-IN)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                தமிழ் (ta-IN)
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                हिंदी (hi-IN)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KURALO BOOK Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for Indian Commerce</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
