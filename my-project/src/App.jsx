// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Context
import { ShopProvider } from './components/ShopContext'; 

// Import Pages
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage'; 

function App() {
  return (
    <ShopProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Page (Login/Register) */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Admin Dashboard Route (Ideally protected, but open for now) */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;