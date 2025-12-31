import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
// Note: useNavigate hum function argument ke roop mein receive karte hain

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`;

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]); 
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- 🔥 NEW: SUCCESS MODAL STATE ---
  // URL ki jagah hum is state ko true karenge order hone par
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: productData } = await axios.get(`${API_URL}/products`);
        setProducts(productData.products);

        try {
            const { data: userData } = await axios.get(`${API_URL}/me`, { withCredentials: true });
            setUser(userData.user);
        } catch (authError) {
            setUser(null);
        }

      } catch (error) {
        console.error("Error loading shop data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- CART ACTIONS ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
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
        if (item._id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
        return item;
      })
    );
  };

  // --- CHECKOUT LOGIC (FIXED & UPDATED) ---
  const createOrder = async (shippingInfo, navigate) => {
    if (!user) {
        showNotification("Please login to place an order");
        navigate("/auth");
        return;
    }

    try {
        const orderItems = cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.qty,
            image: item.images[0].url,
            product: item._id
        }));

        const itemsPrice = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
        const taxPrice = itemsPrice * 0.18; // Example 18% GST
        const shippingPrice = itemsPrice > 5000 ? 0 : 200;
        const totalPrice = itemsPrice + taxPrice + shippingPrice;

        const orderData = {
            shippingInfo,
            orderItems,
            paymentInfo: {
                id: "sample_payment_id_" + Date.now(),
                status: "succeeded" // Simulating successful payment
            },
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice
        };

        const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
        
        // Send to Backend
        await axios.post(`${API_URL}/order/new`, orderData, config);

        // --- 🔥 SUCCESS LOGIC FIXED HERE ---
        setCart([]); // Clear Cart
        setIsCartOpen(false);
        
        // Modal State ko True karein
        setShowOrderSuccess(true); 
        
        // Seedha Home par bhejein (URL param ki zarurat nahi ab)
        navigate("/"); 
        
    } catch (error) {
        console.error("Order Failed", error);
        showNotification(error.response?.data?.message || "Order Failed");
    }
  };

  // --- AUTH ACTIONS ---
  const logout = async () => {
      try {
          await axios.get(`${API_URL}/logout`, { withCredentials: true });
          setUser(null);
          showNotification("Logged out successfully");
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const manualLogin = (userData) => { setUser(userData); };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  return (
    <ShopContext.Provider
      value={{
        products, loading, cart, isCartOpen, setIsCartOpen,
        addToCart, removeFromCart, updateQty, cartTotal, cartCount,
        notification, showNotification, user, logout, manualLogin,
        createOrder,
        showOrderSuccess, setShowOrderSuccess // <-- Exporting state functions
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};