import React, { useState, useEffect, useRef } from 'react';
import { useBargain } from '../context/BargainContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import VoiceVisualizer from './VoiceVisualizer';
import { 
  X, Mic, MicOff, Send, Sparkles, CheckCircle2, 
  AlertCircle, ShieldCheck, ArrowRight, RotateCcw 
} from 'lucide-react';

export default function BargainModal() {
  const {
    isOpen,
    activeProduct,
    language,
    setLanguage,
    messages,
    roundsUsed,
    roundsRemaining,
    approvedPrice,
    status,
    isLoading,
    isListening,
    isSpeaking,
    toggleListening,
    sendCustomerMessage,
    acceptOffer,
    rejectOffer,
    closeBargaining,
  } = useBargain();

  const { setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen || !activeProduct) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    sendCustomerMessage(inputText);
    setInputText('');
  };

  const handleAcceptAndCheckout = () => {
    acceptOffer();
    navigate('/checkout');
  };

  const handleDeclineAndExplore = () => {
    rejectOffer();
    closeBargaining();
    navigate(`/shop?category=${encodeURIComponent(activeProduct.category)}`);
  };

  // Quick price suggestion chips
  const discountOptions = [0.85, 0.75, 0.65];
  const quickOffers = discountOptions.map(factor => Math.round((activeProduct.price * factor) / 50) * 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500 text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-1.5">
                  AI Voice Bargaining
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Shop Smart. Speak Your Price.</p>
              </div>
            </div>

            <button
              onClick={closeBargaining}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Pill & Language Toggle */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeProduct.image_url}
                alt={activeProduct.name}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="truncate">
                <h4 className="text-xs font-semibold text-slate-800 truncate">{activeProduct.name}</h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Listed:</span>
                  <span className="font-bold text-slate-900">₹{activeProduct.price.toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-slate-400 line-through">₹{activeProduct.mrp.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl shrink-0">
              {[
                { code: 'en', label: 'EN' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'hi', label: 'हिंदी' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    language === lang.code
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rounds & Price Indicator */}
        <div className="px-6 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Negotiation Round:</span>
            <span className="font-bold text-slate-900">{Math.min(roundsUsed + 1, 3)} / 3</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guaranteed Seller-Verified Best Price</span>
          </div>
        </div>

        {/* Voice Visualizer Indicator */}
        <div className="px-6 pt-2">
          <VoiceVisualizer isListening={isListening} isSpeaking={isSpeaking} />
        </div>

        {/* Chat History Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={idx}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mr-2 shrink-0 shadow-sm">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span>Checking seller counteroffer...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Offer Chips */}
        {status === 'active' && roundsRemaining > 0 && (
          <div className="px-4 sm:px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Quick Offer:</span>
            {quickOffers.map((price, idx) => (
              <button
                key={idx}
                onClick={() => sendCustomerMessage(`Can you give it for ₹${price.toLocaleString('en-IN')}?`)}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-700 transition-colors shrink-0 shadow-2xs"
              >
                ₹{price.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Action Area */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
          {approvedPrice && (status === 'accepted' || status === 'active') ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                <div>
                  <span className="text-xs font-medium text-amber-800">Approved Special Offer:</span>
                  <div className="text-lg font-extrabold text-amber-950">
                    ₹{approvedPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Save ₹{(activeProduct.price - approvedPrice).toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAcceptAndCheckout}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                >
                  Accept & Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDeclineAndExplore}
                  className="py-3 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : status === 'rejected' ? (
            <div className="flex flex-col gap-2 text-center">
              <p className="text-xs text-slate-600">
                We couldn't reach an agreement on this price, but we have exciting similar alternatives!
              </p>
              <button
                onClick={handleDeclineAndExplore}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Explore Similar Products in Your Budget
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title="Speak your price in Tamil, Hindi, or English"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'உங்கள் விலையைக் கூறுங்கள் (எ.கா: ₹1,500)...'
                    : language === 'hi'
                    ? 'अपनी कीमत बताएं (जैसे: ₹1,500)...'
                    : 'Speak or type your price (e.g. ₹1,500)...'
                }
                className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
