import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cartApi } from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kb_cart');
    return saved ? JSON.parse(saved) : { items: [], item_count: 0, subtotal: 0, total_savings: 0, total: 0 };
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('kb_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = async (product, quantity = 1, bargainedPrice = null, sessionId = null) => {
    try {
      const updated = await cartApi.addItem(product.id, quantity, bargainedPrice, sessionId);
      setCart(updated);
      toast.success(
        bargainedPrice 
          ? `Added with Bargained Price: ₹${bargainedPrice.toLocaleString('en-IN')}! 🛍️`
          : `Added '${product.name.slice(0, 24)}...' to cart!`
      );
      return true;
    } catch {
      // Local addition
      setCart(prev => {
        const effectivePrice = bargainedPrice || product.price;
        const items = [...prev.items];
        const existing = items.find(i => i.product_id === product.id && i.bargained_price === bargainedPrice);

        if (existing) {
          existing.quantity = Math.min(10, existing.quantity + quantity);
          existing.total_price = existing.quantity * effectivePrice;
        } else {
          items.push({
            id: `item-${Date.now()}`,
            product_id: product.id,
            product,
            quantity,
            unit_price: product.price,
            bargained_price: bargainedPrice,
            total_price: quantity * effectivePrice
          });
        }

        const count = items.reduce((s, i) => s + i.quantity, 0);
        const sub = items.reduce((s, i) => s + i.total_price, 0);
        const savings = items.reduce((s, i) => s + ((i.product.mrp - (i.bargained_price || i.unit_price)) * i.quantity), 0);

        return {
          items,
          item_count: count,
          subtotal: sub,
          total_savings: savings,
          total: sub
        };
      });
      toast.success('Added to cart!');
      return true;
    }
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => {
      const items = prev.items.map(item => {
        if (item.id === itemId) {
          const effectivePrice = item.bargained_price || item.unit_price;
          return {
            ...item,
            quantity: newQty,
            total_price: newQty * effectivePrice
          };
        }
        return item;
      });

      const count = items.reduce((s, i) => s + i.quantity, 0);
      const sub = items.reduce((s, i) => s + i.total_price, 0);
      const savings = items.reduce((s, i) => s + ((i.product.mrp - (i.bargained_price || i.unit_price)) * i.quantity), 0);

      return {
        ...prev,
        items,
        item_count: count,
        subtotal: sub,
        total_savings: savings,
        total: sub
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const items = prev.items.filter(i => i.id !== itemId);
      const count = items.reduce((s, i) => s + i.quantity, 0);
      const sub = items.reduce((s, i) => s + i.total_price, 0);
      const savings = items.reduce((s, i) => s + ((i.product.mrp - (i.bargained_price || i.unit_price)) * i.quantity), 0);
      return {
        ...prev,
        items,
        item_count: count,
        subtotal: sub,
        total_savings: savings,
        total: sub
      };
    });
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setCart({ items: [], item_count: 0, subtotal: 0, total_savings: 0, total: 0 });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
