import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios'; // Import Axios
import io from 'socket.io-client'; // Import Socket.io
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, ArrowLeft, 
  TrendingUp, Package, Search, Bell, CheckCircle, Clock, X, Plus, 
  MapPin, Mail, Menu, MoreVertical, Filter, Download, ChevronRight, Loader2
} from 'lucide-react';

// --- API CONFIGURATION ---
const API_URL = "http://localhost:5000/api/v1"; 
const socket = io("http://localhost:5000"); // Connect to Backend

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- REAL DATA STATES ---
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // --- 1. FETCH DATA ON MOUNT ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Orders & Revenue
        const { data: orderData } = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
        setOrders(orderData.orders);
        setRevenue(orderData.totalAmount);

        // Fetch Products
        const { data: productData } = await axios.get(`${API_URL}/products`);
        setProducts(productData.products);

        // Fetch Customers
        const { data: userData } = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
        setCustomers(userData.users);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if(error.response?.status === 401 || error.response?.status === 403) {
            alert("Unauthorized. Please login as Admin.");
            navigate("/auth");
        }
        setLoading(false);
      }
    };

    fetchData();

    // --- 2. SOCKET.IO LISTENER (Real-Time) ---
    socket.on("connect", () => {
        console.log("Connected to Socket.io");
    });

    // Listen for new orders from server.js
    socket.on("new_order_notification", (data) => {
        showNotification("New Order Received!");
        // Refresh orders to show the new one immediately
        fetchData(); 
    });

    return () => {
        socket.off("new_order_notification");
    };
  }, [navigate]);


  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ACTIONS ---
  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Update Order Status via API
  const cycleStatus = async (id, currentStatus) => {
    const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
        await axios.put(`${API_URL}/admin/order/${id}`, { status: nextStatus }, { withCredentials: true });
        
        // Update local state to reflect change immediately
        setOrders(orders.map(order => 
            order._id === id ? { ...order, orderStatus: nextStatus } : order
        ));
        
        showNotification(`Order status updated to ${nextStatus}`);
    } catch (error) {
        showNotification("Failed to update status");
    }
  };

  // Delete Order via API
  const deleteOrder = async (id) => {
    if(window.confirm("Are you sure you want to delete this order?")) {
        try {
            await axios.delete(`${API_URL}/admin/order/${id}`, { withCredentials: true });
            setOrders(orders.filter(o => o._id !== id));
            showNotification("Order deleted successfully");
        } catch (error) {
            showNotification("Failed to delete order");
        }
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(o => 
    (o.user?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase()) || 
    o._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- SUB-COMPONENTS ---
  const SidebarContent = () => (
    <>
      <div className="p-8 flex items-center justify-between">
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest cursor-pointer">
            ORVELLA 
            <span className="text-[10px] text-gray-500 block font-sans tracking-[0.3em] mt-1">ADMINISTRATION</span>
          </h1>
          {isMobileMenuOpen && (
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
               <X size={24} />
             </button>
          )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
          {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'inventory', icon: Package, label: 'Inventory' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(item => (
              <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                      activeTab === item.id 
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B5952F] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                  <item.icon size={20} className={activeTab === item.id ? "scale-110" : "group-hover:scale-110 transition-transform"} /> 
                  <span className="z-10">{item.label}</span>
                  {activeTab === item.id && (
                      <motion.div layoutId="activeTabGlow" className="absolute inset-0 bg-white/20 blur-md" />
                  )}
              </button>
          ))}
      </nav>

      <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4AF37] transition-colors p-2 rounded hover:bg-white/5">
              <ArrowLeft size={16} /> Back to Store
          </Link>
      </div>
    </>
  );

  if (loading) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#D4AF37]">
              <Loader2 className="animate-spin" size={48} />
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden">
      
      {/* --- TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -50, opacity: 0, scale: 0.9 }} 
            animate={{ y: 20, opacity: 1, scale: 1 }} 
            exit={{ y: -50, opacity: 0, scale: 0.9 }}
            className="fixed top-0 right-4 md:right-8 z-[100] bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black px-6 py-4 rounded-lg shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] font-bold flex items-center gap-3 border border-white/20"
          >
            <div className="bg-black/10 p-1 rounded-full"><CheckCircle size={18}/></div> 
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 bg-[#121212] border-r border-white/10 h-screen sticky top-0 z-40">
         <SidebarContent />
      </aside>

      {/* --- MOBILE SIDEBAR (DRAWER) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
                />
                <motion.aside 
                    initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 w-[85%] max-w-sm h-full bg-[#121212] z-[60] flex flex-col border-r border-white/10 shadow-2xl md:hidden"
                >
                    <SidebarContent />
                </motion.aside>
            </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#0f0f0f]">
        
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-white/5">
                    <Menu size={24} />
                </button>
                <div className="hidden md:block">
                    <h2 className="text-xl font-serif text-white tracking-wide">
                        {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h2>
                    <p className="text-gray-500 text-xs">Real-time Admin Console</p>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="relative hidden sm:block">
                    <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#121212] border border-white/10 rounded-full px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-48 md:w-80 transition-all placeholder:text-gray-600"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                </div>
                
                <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                    <div className="relative cursor-pointer group">
                        <div className="p-2 rounded-full hover:bg-white/5 transition-colors">
                            <Bell className="text-gray-400 group-hover:text-[#D4AF37] transition-colors" size={20} />
                        </div>
                        {/* Notification Dot Logic can be added here */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8a7020] flex items-center justify-center text-black font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform">
                        A
                    </div>
                </div>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-[#D4AF37]/20 scrollbar-track-transparent">
            
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-8 pb-20"
            >
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <StatCard 
                                title="Total Revenue" 
                                value={`₹${revenue.toLocaleString()}`} 
                                icon={TrendingUp} 
                                color="text-[#D4AF37]" 
                                bg="bg-[#D4AF37]/10" 
                                trend="+12.5%" 
                                trendUp={true} 
                            />
                            <StatCard 
                                title="Total Orders" 
                                value={orders.length} 
                                icon={ShoppingBag} 
                                color="text-purple-400" 
                                bg="bg-purple-500/10" 
                                trend="Real-time" 
                                trendUp={true} 
                            />
                            <StatCard 
                                title="Active Customers" 
                                value={customers.length} 
                                icon={Users} 
                                color="text-blue-400" 
                                bg="bg-blue-500/10" 
                                trend="+8.1%" 
                                trendUp={true} 
                            />
                            <StatCard 
                                title="Pending" 
                                value={orders.filter(o => o.orderStatus === 'Pending').length} 
                                icon={Clock} 
                                color="text-orange-400" 
                                bg="bg-orange-500/10" 
                                trend="Needs Action" 
                                trendUp={false} 
                            />
                        </div>
                    </div>
                )}

                {/* 2. ORDERS TAB */}
                {(activeTab === 'orders' || activeTab === 'dashboard') && activeTab !== 'inventory' && activeTab !== 'customers' && (
                    <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Recent Orders</h3>
                                <p className="text-sm text-gray-500">Manage your latest transactions</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] text-xs font-bold text-gray-300 rounded border border-white/5 transition-colors">
                                    <Filter size={14}/> Filter
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-white text-black text-xs font-bold rounded transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                    <Download size={14}/> Export
                                </button>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-[#1a1a1a]/50 text-xs uppercase font-bold text-gray-300">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Order ID</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Items</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            key={order._id} 
                                            className="hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-6 py-4 font-mono text-white/70">#{order._id.slice(-6)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                                                        {order.user?.name ? order.user.name.charAt(0) : "U"}
                                                    </div>
                                                    <div className="font-medium text-white">{order.user?.name || "Unknown"}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{order.orderItems.length} items</td>
                                            <td className="px-6 py-4 font-bold text-[#D4AF37]">₹{order.totalPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <button 
                                                    onClick={() => cycleStatus(order._id, order.orderStatus)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                                        order.orderStatus === "Delivered" ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" :
                                                        order.orderStatus === "Shipped" ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" :
                                                        order.orderStatus === "Cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" :
                                                        "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                                                    }`}
                                                >
                                                    {order.orderStatus}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => deleteOrder(order._id)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-400 hover:text-red-500"><X size={16}/></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-600 italic">
                                                No orders found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. INVENTORY TAB (Using Real Products) */}
                {activeTab === 'inventory' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Add New Product Card */}
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-8 text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 cursor-pointer transition-all group min-h-[300px]"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                                <Plus size={32} />
                            </div>
                            <span className="font-serif text-lg">Add New Product</span>
                        </motion.div>

                        {products.map((product, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                key={product._id} 
                                className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
                            >
                                <div className="h-48 bg-[#0a0a0a] relative p-6 flex items-center justify-center overflow-hidden">
                                    <img src={product.images && product.images[0]?.url ? product.images[0].url : "/orvella.jpeg"} alt={product.name} className="h-full object-contain relative z-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700 ease-out" />
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border backdrop-blur-md ${
                                            product.stock > 10 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                        }`}>
                                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-6 relative z-20 bg-[#121212]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs text-[#D4AF37] uppercase tracking-wider mb-1">{product.category}</p>
                                            <h3 className="text-xl font-serif text-white group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                                        <div>
                                            <p className="text-gray-500 text-xs">Price</p>
                                            <p className="text-white font-bold">₹{product.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-500 text-xs">Inventory</p>
                                            <p className="text-white font-bold">{product.stock} units</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                      </div>
                )}

                {/* 4. CUSTOMERS TAB (Using Real Users) */}
                {activeTab === 'customers' && (
                    <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Contact</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Role</th>
                                        <th className="px-6 py-4 whitespace-nowrap text-right">Join Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {customers.map((customer, i) => (
                                        <motion.tr 
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                            key={customer._id} 
                                            className="hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-sm shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white block">{customer.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Mail size={14}/> {customer.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                                                    customer.role === 'admin' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-gray-400/10 border-gray-400/30 text-gray-300'
                                                }`}>
                                                    {customer.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-white font-mono">
                                                {new Date(customer.createdAt).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
      </main>
    </div>
  );
}

// --- HELPER COMPONENTS ---
function StatCard({ title, value, icon: Icon, color, bg, trend, trendUp }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#121212] border border-white/5 p-6 rounded-xl relative overflow-hidden group hover:border-[#D4AF37]/30 transition-colors shadow-lg"
        >
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{value}</h3>
                </div>
                <div className={`p-3 ${bg} rounded-xl ${color} shadow-inner bg-opacity-50`}>
                    <Icon size={22}/>
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend}
                </span>
                <span className="text-gray-600 text-[10px] uppercase">vs last month</span>
            </div>

            {/* Background Decoration */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} opacity-20 blur-2xl group-hover:scale-150 transition-transform duration-700`}></div>
        </motion.div>
    );
}