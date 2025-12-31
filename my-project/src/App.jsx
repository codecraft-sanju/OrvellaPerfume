import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Context
import { ShopProvider } from './components/ShopContext'; 

// Import Pages
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage'; 
import OrderSuccess from './components/OrderSuccess';
import Checkout from './components/Checkout'; // <--- YE LINE ADD KARO (Make sure path sahi ho)

function App() {
  return (
    <ShopProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Page (Login/Register) */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Checkout Route - YE MISSING THA */}
          <Route path="/checkout" element={<Checkout />} />

          <Route path="/success" element={<OrderSuccess />} />
        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;