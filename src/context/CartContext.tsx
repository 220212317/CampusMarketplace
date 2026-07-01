// src/context/CartContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartContextType, CartItem, Product } from '../types';

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  updateQuantity: async () => {},
  getTotal: () => 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('@cm_cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem('@cm_cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      const existingItem = cartItems.find(item => item.id === product.id);
      let newCart: CartItem[];

      if (existingItem) {
        newCart = cartItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...cartItems, { ...product, quantity: 1 }];
      }

      setCartItems(newCart);
      await saveCart(newCart);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const newCart = cartItems.filter(item => item.id !== productId);
      setCartItems(newCart);
      await saveCart(newCart);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      await saveCart([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      const newCart = cartItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      setCartItems(newCart);
      await saveCart(newCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        updateQuantity,
        getTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};