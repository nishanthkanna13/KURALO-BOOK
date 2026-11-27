import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Package, Truck, CheckCircle2, Clock, ArrowRight, Tag } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders || []);
      } catch {
        // Fallback demo order history
        setOrders([
          {
            id: 'ord-demo-1',
            order_number: 'KB-20261127-994A1E',
            status: 'confirmed',
            payment_status: 'paid',
            subtotal: 890.0,
            shipping_fee: 49.0,
            total: 939.0,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            items: [
              {
                id: 'it-1',
                product_id: 'prod-001',
                product: {
                  name: 'boAt Airdopes 141 True Wireless Earbuds',
                  image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80',
                  mrp: 2499.0
                },
                quantity: 1,
                unit_price: 999.0,
                bargained_price: 890.0,
                total_price: 890.0
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Orders & Bargain History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track packages and review discounts secured via KURALO BOOK AI Bargaining.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading order history...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1">Experience AI voice bargaining on your first order!</p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Explore Deals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-bold text-slate-900 ml-1.5">{ord.order_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Paid & Confirmed
                  </span>
                  <span className="text-slate-400">
                    {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-slate-100">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={it.product?.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{it.product?.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>Qty: {it.quantity}</span>
                          {it.bargained_price && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              <Tag className="w-2.5 h-2.5" />
                              Bargained Price: ₹{it.bargained_price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-sm text-slate-900">
                        ₹{(it.bargained_price || it.unit_price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>Estimated Delivery in 2 - 3 Days</span>
                </div>
                <div className="font-extrabold text-sm text-slate-900">
                  Total: <span className="text-amber-600">₹{ord.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
