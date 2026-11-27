import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBargain } from '../context/BargainContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES } from '../services/api';
import { 
  Mic, Sparkles, ShoppingBag, ShieldCheck, ArrowRight, 
  Volume2, CheckCircle2, Zap, Users, MessageSquareQuote 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { openBargaining, language, setLanguage } = useBargain();
  const { openAuth, isAuthenticated } = useAuth();
  const [activeTabLang, setActiveTabLang] = useState('en');

  // Featured sample product for hero live demo
  const sampleProduct = FALLBACK_PRODUCTS[0]; // boAt Airdopes 141

  const demoPhrases = {
    en: {
      customer: "Hey! Can you offer this for ₹850?",
      assistant: "I understand your offer! Let me check with our seller rules... I can offer this for ₹890! Deal?",
      tag: "English (en-IN)"
    },
    ta: {
      customer: "வணக்கம்! இதை ₹850 விலைக்கு தர முடியுமா?",
      assistant: "உங்கள் சலுகை புரிகிறது! சரிபார்த்துவிட்டேன்... ₹890 விலைக்கு வழங்க முடியும்! வாங்கலாமா?",
      tag: "தமிழ் (ta-IN)"
    },
    hi: {
      customer: "नमस्ते! क्या आप इसे ₹850 में दे सकते हैं?",
      assistant: "मैं आपका ऑफ़र समझ गया! विक्रेता की शर्तों के अनुसार... मैं इसे ₹890 में दे सकता हूँ! क्या डील पक्की करें?",
      tag: "हिंदी (hi-IN)"
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* ─────────────────────── Hero Section ─────────────────────── */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 bg-gradient-to-b from-amber-500/10 via-slate-50 to-slate-50">
        
        {/* Glow backdrop shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-amber-400/20 via-orange-300/15 to-amber-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200 shadow-sm text-xs font-bold text-amber-900 animate-fade-in">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Next-Gen E-Commerce with Multilingual Voice AI</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Shop Smart. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500">
                  Speak Your Price.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Welcome to <strong>KURALO BOOK</strong> — India's premier online marketplace where you don't just accept listed prices. Speak naturally in <strong>Tamil, Hindi, or English</strong>, and our intelligent AI negotiates instant verified discounts directly with sellers!
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <button
                  onClick={() => openBargaining(sampleProduct)}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Try AI Voice Bargaining Now</span>
                </button>

                {!isAuthenticated && (
                  <button
                    onClick={() => openAuth('register')}
                    className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm transition-colors"
                  >
                    Create Account
                  </button>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Server-Safe Confidential Floor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant Razorpay & UPI Checkout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <span>Tamil • English • Hindi</span>
                </div>
              </div>

            </div>

            {/* Right Interactive AI Bargaining Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={sampleProduct.image_url}
                      alt={sampleProduct.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{sampleProduct.name}</h4>
                      <p className="text-xs text-slate-500">Listed: <span className="font-bold text-slate-800">₹{sampleProduct.price.toLocaleString('en-IN')}</span></p>
                    </div>
                  </div>

                  {/* Language switch */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                    {['en', 'ta', 'hi'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setActiveTabLang(l)}
                        className={`px-2 py-0.5 rounded ${activeTabLang === l ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                      >
                        {l.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Conversation */}
                <div className="py-4 space-y-3 text-xs">
                  {/* Customer bubble */}
                  <div className="flex justify-end">
                    <div className="bg-slate-900 text-white rounded-2xl rounded-br-none p-3 max-w-[85%] shadow-sm">
                      <p className="font-medium">{demoPhrases[activeTabLang].customer}</p>
                    </div>
                  </div>

                  {/* AI Assistant bubble */}
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold mr-2 mt-1 shrink-0">
                      AI
                    </div>
                    <div className="bg-amber-50/80 border border-amber-200/60 text-slate-800 rounded-2xl rounded-bl-none p-3 max-w-[85%] shadow-2xs">
                      <p className="leading-relaxed">{demoPhrases[activeTabLang].assistant}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Counteroffer: ₹890 (Save ₹109!)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Launch Button */}
                <button
                  onClick={() => openBargaining(sampleProduct, activeTabLang)}
                  className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Start Live Negotiation On This Item</span>
                </button>

                <p className="text-[11px] text-center text-slate-400 mt-2.5">
                  Try speaking your price right now with real microphone audio!
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────── Category Bar ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Browse Popular Categories
          </h2>
          <Link to="/shop" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {FALLBACK_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={cat.slug ? `/shop?category=${cat.slug}` : '/shop'}
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-400/60 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────── Featured Products Grid ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Trending Deals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Top-rated products ready for real-time AI price bargaining.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            Explore 100+ Deals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FALLBACK_PRODUCTS.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─────────────────────── How AI Bargaining Works ─────────────────────── */}
      <section className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Unique Innovation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2">
              How AI Voice Bargaining Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Experience the natural excitement of Indian street bargaining brought safely into e-commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Product",
                desc: "Pick any product from verified local sellers across Electronics, Sarees, Home Decor, and more."
              },
              {
                step: "02",
                title: "Speak Your Price",
                desc: "Hit 'Speak Price' and make your offer using voice or text in Tamil, Hindi, or English."
              },
              {
                step: "03",
                title: "Instant Counteroffer",
                desc: "Our server-side algorithm calculates safe, permitted discounts without exposing confidential seller margins."
              },
              {
                step: "04",
                title: "Lock Deal & Checkout",
                desc: "Accept the approved offer, proceed seamlessly to address and UPI/card payment, and enjoy the savings!"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-black text-amber-500/40 mb-3">{item.step}</div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 py-3.5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg transition-colors"
            >
              Start Bargaining Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────── More Products Grid ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Recommended For You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hand-picked selections tailored to your taste.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FALLBACK_PRODUCTS.slice(4, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

    </div>
  );
}
