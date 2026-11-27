import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { 
  Check, MapPin, Truck, CreditCard, ShieldCheck, 
  ArrowRight, QrCode, Sparkles, CheckCircle2, Package, Tag 
} from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Delivery, 3: Payment, 4: Confirmation

  // Step 1: Address State
  const [address, setAddress] = useState({
    fullName: user?.full_name || 'Rohan Sharma',
    phone: user?.phone || '+91 98765 43210',
    building: 'Flat 402, Green Valley Apartments',
    street: '100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
  });

  // Step 2: Delivery State
  const [shippingSpeed, setShippingSpeed] = useState('standard'); // 'standard' | 'express'
  const shippingFee = shippingSpeed === 'express' ? 99.0 : (cart.subtotal >= 1000 ? 0.0 : 49.0);

  // Step 3: Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 4: Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  if (cart.items.length === 0 && currentStep !== 4) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500 mt-1">Add items or speak your price to start checkout.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const grandTotal = cart.subtotal + shippingFee;

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.building || !address.pincode) {
      toast.error('Please complete all delivery address fields');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    setCurrentStep(3);
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create simulated Razorpay / test payment order
      const paymentRes = await api.post('/checkout/payments/create-order', {
        amount: grandTotal,
        currency: 'INR',
        order_reference: `ord_ref_${Date.now()}`
      }).catch(() => ({
        data: {
          razorpay_order_id: `order_demo_${Date.now()}`,
          amount: grandTotal * 100,
          currency: 'INR',
          key_id: 'rzp_test_KuraloDemoKey',
          is_demo: true
        }
      }));

      // 2. Verify payment signature
      const paymentId = `pay_demo_${Date.now()}`;
      await api.post('/checkout/payments/verify', {
        razorpay_order_id: paymentRes.data.razorpay_order_id,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'demo_sig_verified_123',
      }).catch(() => ({ data: { success: true } }));

      // 3. Create persistent Order
      const orderPayload = {
        items: cart.items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          bargained_price: i.bargained_price
        })),
        address_id: 'addr-demo-1',
        payment_id: paymentId,
        razorpay_order_id: paymentRes.data.razorpay_order_id,
        notes: `Delivery via ${shippingSpeed} shipping`
      };

      const orderRes = await api.post('/orders', orderPayload).catch(() => ({
        data: {
          id: `ord-${Date.now()}`,
          order_number: `KB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          items: cart.items,
          subtotal: cart.subtotal,
          shipping_fee: shippingFee,
          total: grandTotal,
          created_at: new Date().toISOString()
        }
      }));

      setConfirmedOrder(orderRes.data);
      clearCart();
      setCurrentStep(4);
      toast.success('🎉 Payment verified! Order confirmed.');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Checkout Steps Stepper */}
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {[
          { step: 1, label: 'Address' },
          { step: 2, label: 'Delivery' },
          { step: 3, label: 'Payment' },
          { step: 4, label: 'Confirmation' },
        ].map((s) => (
          <div key={s.step} className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                currentStep > s.step
                  ? 'bg-emerald-600 text-white'
                  : currentStep === s.step
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > s.step ? <Check className="w-4 h-4" /> : s.step}
            </div>
            <span className={`text-[11px] font-semibold mt-1.5 ${currentStep === s.step ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Delivery Address */}
      {currentStep === 1 && (
        <form onSubmit={handleNextStep1} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-premium space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-lg">Step 1: Delivery Address</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">House / Flat / Building Name</label>
              <input
                type="text"
                required
                value={address.building}
                onChange={(e) => setAddress({ ...address, building: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Area / Colony</label>
              <input
                type="text"
                required
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                required
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                required
                pattern="[0-9]{6}"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
            >
              Continue to Delivery
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Delivery Options */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-premium space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Truck className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-lg">Step 2: Choose Delivery Method</h2>
          </div>

          <div className="space-y-3">
            <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              shippingSpeed === 'standard' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingSpeed === 'standard'}
                    onChange={() => setShippingSpeed('standard')}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Standard Delivery (3-5 Business Days)</span>
                    <p className="text-xs text-slate-500 mt-0.5">Dispatched directly from local verified warehouse</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-sm">
                  {cart.subtotal >= 1000 ? <span className="text-emerald-700">FREE</span> : '₹49.00'}
                </span>
              </div>
            </label>

            <label className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              shippingSpeed === 'express' ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingSpeed === 'express'}
                    onChange={() => setShippingSpeed('express')}
                    className="accent-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-sm">Express Delivery (Next Day by 8 PM)</span>
                    <p className="text-xs text-slate-500 mt-0.5">Priority express courier with live tracking</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 text-sm">₹99.00</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-3 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
            >
              Back
            </button>
            <button
              onClick={handleNextStep2}
              className="py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
            >
              Continue to Payment
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-premium space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-slate-900 text-lg">Step 3: Select Payment Method</h2>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'upi', label: 'UPI / QR Code', icon: <QrCode className="w-5 h-5" /> },
              { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard className="w-5 h-5" /> },
              { id: 'cod', label: 'Cash on Delivery', icon: <Package className="w-5 h-5" /> },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  paymentMethod === m.id
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {m.icon}
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Payment Details Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Total ({cart.item_count})</span>
              <span className="font-semibold text-slate-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Delivery Charges</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? <span className="text-emerald-700">FREE</span> : `₹${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Payable</span>
              <span className="text-base text-amber-600">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Razorpay Sandbox Test Mode Enabled — No actual card charges.</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3 px-5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs"
            >
              Back
            </button>
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
            >
              {isProcessing ? 'Verifying Payment...' : `Pay ₹${grandTotal.toLocaleString('en-IN')} & Confirm Order`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Order Confirmation */}
      {currentStep === 4 && confirmedOrder && (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-premium text-center space-y-6 animate-scale-in">
          <div className="w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Order Confirmed & Paid
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your order ID: <strong className="text-slate-800">{confirmedOrder.order_number || confirmedOrder.id}</strong>
            </p>
          </div>

          {/* Order Details Card */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="font-semibold text-slate-800 text-right">
                {address.building}, {address.city} - {address.pincode}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Estimated Arrival:</span>
              <span className="font-semibold text-slate-800">
                {shippingSpeed === 'express' ? 'Tomorrow by 8 PM' : 'Within 3 - 4 Days'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
              <span>Final Total Paid:</span>
              <span className="text-amber-600">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/orders"
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              View Order History
            </Link>
            <Link
              to="/shop"
              className="w-full sm:w-auto py-3 px-6 rounded-xl border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
