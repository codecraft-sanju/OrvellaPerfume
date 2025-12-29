// components/ShopContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

// Backend URL
const API_URL = "http://localhost:5000/api/v1";

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]); // Now using Real Data
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null); // Real User State
  const [loading, setLoading] = useState(true);

  // --- 1. FETCH DATA ON LOAD ---
  // This runs once when the app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        // A. Fetch Real Products from Database
        const { data: productData } = await axios.get(`${API_URL}/products`);
        setProducts(productData.products);

        // B. Check if User is Logged In (Verify Cookie)
        try {
            const { data: userData } = await axios.get(`${API_URL}/me`, { withCredentials: true });
            setUser(userData.user);
        } catch (authError) {
            // User is not logged in, which is fine for a guest
            setUser(null);
        }

      } catch (error) {
        console.error("Error loading shop data:", error);
        showNotification("Server is sleeping. Please wake it up!");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- CART ACTIONS ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id); // Note: MongoDB uses _id, not id
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
    showNotification(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id === id) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  // --- AUTH ACTIONS ---
  // Login is handled in AuthPage.jsx, but Logout is global
  const logout = async () => {
      try {
          await axios.get(`${API_URL}/logout`, { withCredentials: true });
          setUser(null);
          showNotification("Logged out successfully");
          // Optional: Clear cart on logout
          // setCart([]); 
      } catch (error) {
          console.error("Logout failed", error);
          showNotification("Logout failed");
      }
  };

  // Helper to manually update user (used by AuthPage after successful login)
  const manualLogin = (userData) => {
      setUser(userData);
  };

  // Toast Notification Logic
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <ShopContext.Provider
      value={{
        products,
        loading,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQty,
        cartTotal,
        cartCount,
        notification,
        showNotification,
        user,
        logout,
        manualLogin // Exported so AuthPage can update state instantly
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};