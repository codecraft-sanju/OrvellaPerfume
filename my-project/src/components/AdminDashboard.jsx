import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, ArrowLeft, 
  TrendingUp, Package, Search, Bell, CheckCircle, Clock, X, Plus, 
  Mail, Menu, Loader2, Save, Edit, Trash2, Calendar, Star
} from 'lucide-react';

// --- API CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`; 
const socket = io(BACKEND_URL); 

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

  // --- PRODUCT MODAL STATE (ADD & EDIT) ---
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editProductId, setEditProductId] = useState(null); 

  // Default set to Orvella context
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    category: "Signature Scent", // Updated default
    stock: 0,
    imageUrl: "" 
  });

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

    socket.on("new_order_notification", (data) => {
        showNotification("New Order Received!");
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

  // --- PRODUCT ACTIONS ---
  const openCreateModal = () => {
      setIsEditing(false);
      setNewProduct({ name: "", price: "", description: "", category: "Signature Scent", stock: 0, imageUrl: "" });
      setShowAddProduct(true);
  };

  const openEditModal = (product) => {
      setIsEditing(true);
      setEditProductId(product._id);
      setNewProduct({
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          stock: product.stock,
          imageUrl: product.images && product.images.length > 0 ? product.images[0].url : ""
      });
      setShowAddProduct(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };

    try {
        const productData = {
            ...newProduct,
            images: [{ public_id: "manual_entry_" + Date.now(), url: newProduct.imageUrl }]
        };

        if (isEditing) {
            const { data } = await axios.put(`${API_URL}/admin/product/${editProductId}`, productData, config);
            setProducts(products.map(p => p._id === editProductId ? data.product : p));
            showNotification("Product Updated Successfully!");
        } else {
            const { data } = await axios.post(`${API_URL}/admin/product/new`, productData, config);
            setProducts([data.product, ...products]); // New product added to top
            showNotification("Product Added Successfully!");
        }
        setShowAddProduct(false); 
    } catch (error) {
        showNotification(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDeleteProduct = async (id) => {
      if(!window.confirm("Are you sure? This will remove the item from the store.")) return;
      try {
          await axios.delete(`${API_URL}/admin/product/${id}`, { withCredentials: true });
          setProducts(products.filter(p => p._id !== id));
          showNotification("Product Deleted Successfully");
      } catch (error) {
          showNotification(error.response?.data?.message || "Failed to delete product");
      }
  };

  // Update Order Status
  const cycleStatus = async (id, currentStatus) => {
    const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
        await axios.put(`${API_URL}/admin/order/${id}`, { status: nextStatus }, { withCredentials: true });
        setOrders(orders.map(order => 
            order._id === id ? { ...order, orderStatus: nextStatus } : order
        ));
        showNotification(`Order updated to ${nextStatus}`);
    } catch (error) {
        showNotification("Failed to update status");
    }
  };

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

  const updateUserRole = async (userId, newRole) => {
    if(!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
        const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
        await axios.put(`${API_URL}/admin/user/${userId}`, { role: newRole }, config);
        setCustomers(customers.map(user => 
            user._id === userId ? { ...user, role: newRole } : user
        ));
        showNotification(`Role updated to ${newRole}`);
    } catch (error) {
        showNotification("Failed to update role");
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
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white bg-white/5 p-2 rounded-full">
               <X size={20} />
             </button>
          )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders' },
              { id: 'inventory', icon: Package, label: 'Collection' }, // Renamed from Inventory
              { id: 'customers', icon: Users, label: 'Clientele' }, // Renamed from Customers
              { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(item => (
              <button 
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-4 md:py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                      activeTab === item.id 
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B5952F] text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.4)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                  <item.icon size={22} className={activeTab === item.id ? "scale-110" : "group-hover:scale-110 transition-transform"} /> 
                  <span className="z-10 text-sm md:text-base">{item.label}</span>
              </button>
          ))}
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto">
          <Link to="/" className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 hover:text-[#D4AF37] transition-colors p-3 rounded hover:bg-white/5 border border-transparent hover:border-white/10">
              <ArrowLeft size={16} /> <span className="font-medium">Back to Boutique</span>
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
            className="fixed top-2 left-4 right-4 md:left-auto md:right-8 z-[110] bg-gradient-to-r from-[#D4AF37] to-[#F2D06B] text-black px-4 py-3 rounded-lg shadow-[0_10px_40px_-10px_rgba(212,175,55,0.5)] font-bold flex items-center gap-3 border border-white/20 text-sm md:text-base"
          >
            <div className="bg-black/10 p-1 rounded-full"><CheckCircle size={16}/></div> 
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
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10">
                    <Menu size={20} />
                </button>
                <div className="block">
                    <h2 className="text-lg md:text-xl font-serif text-white tracking-wide">
                        {activeTab === 'dashboard' ? 'Overview' : activeTab === 'inventory' ? 'Collection' : activeTab === 'customers' ? 'Clientele' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                {/* Mobile Search Icon / Desktop Search Bar */}
                <div className="relative hidden md:block">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#121212] border border-white/10 rounded-full px-4 py-2 pl-10 text-sm focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] w-64 transition-all placeholder:text-gray-600"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                </div>
                
                <div className="flex items-center gap-3 border-l border-white/10 pl-3 md:pl-6">
                    <div className="relative cursor-pointer group">
                        <div className="p-2 rounded-full hover:bg-white/5 transition-colors">
                            <Bell className="text-gray-400 group-hover:text-[#D4AF37] transition-colors" size={20} />
                        </div>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8a7020] flex items-center justify-center text-black font-bold shadow-lg cursor-pointer">
                        A
                    </div>
                </div>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-[#D4AF37]/20 scrollbar-track-transparent pb-24 md:pb-8">
            
            {/* Mobile Search Bar (Visible only on mobile below header) */}
            <div className="md:hidden mb-6 relative">
                 <input 
                    type="text" 
                    placeholder="Search orders, customers..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:border-[#D4AF37] text-white"
                />
                <Search className="absolute left-3 top-3.5 text-gray-500" size={16} />
            </div>

            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-6 md:space-y-8"
            >
                {/* 1. DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 md:space-y-8">
                        {/* Stats Cards Grid - Stack on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                title="Active Clientele" 
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

                {/* 2. ORDERS TAB - Responsive Layout */}
                {(activeTab === 'orders' || activeTab === 'dashboard') && activeTab !== 'inventory' && activeTab !== 'customers' && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Recent Orders</h3>
                                <p className="text-xs md:text-sm text-gray-500">Latest transactions</p>
                            </div>
                        </div>
                        
                        {/* --- DESKTOP VIEW: TABLE --- */}
                        <div className="hidden md:block bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#1a1a1a]/50 text-xs uppercase font-bold text-gray-300">
                                        <tr>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Items</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                                            <DesktopOrderRow 
                                                key={order._id} 
                                                order={order} 
                                                cycleStatus={cycleStatus} 
                                                deleteOrder={deleteOrder} 
                                                index={i} 
                                            />
                                        )) : (
                                            <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-600 italic">No orders found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* --- MOBILE VIEW: CARDS (User Friendly) --- */}
                        <div className="md:hidden space-y-4">
                            {filteredOrders.length > 0 ? filteredOrders.map((order, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    key={order._id}
                                    className="bg-[#121212] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden"
                                >
                                    {/* Status Badge Top Right */}
                                    <div className="absolute top-4 right-4">
                                        <StatusBadge status={order.orderStatus} onClick={() => cycleStatus(order._id, order.orderStatus)} />
                                    </div>

                                    {/* Order ID & User */}
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 font-mono">#{order._id.slice(-6)}</p>
                                        <h4 className="text-white font-bold text-lg">{order.user?.name || "Unknown"}</h4>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5 border-b mb-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Total</p>
                                            <p className="text-[#D4AF37] font-bold text-lg">₹{order.totalPrice.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase">Items</p>
                                            <p className="text-white font-medium">{order.orderItems.length} Products</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-between items-center">
                                         <span className="text-xs text-gray-600 flex items-center gap-1">
                                            <Clock size={12}/> {new Date(order.createdAt).toLocaleDateString()}
                                         </span>
                                         <button 
                                            onClick={() => deleteOrder(order._id)}
                                            className="text-red-400 text-xs flex items-center gap-1 px-3 py-1.5 bg-red-500/10 rounded border border-red-500/20"
                                         >
                                             <Trash2 size={12} /> Delete
                                         </button>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-10 text-gray-600">No orders found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. INVENTORY (COLLECTION) TAB - Mobile Optimized Grid */}
                {activeTab === 'inventory' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Add New Product Card */}
                        <motion.div 
                            whileTap={{ scale: 0.98 }}
                            onClick={openCreateModal}
                            className="border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-6 md:p-8 text-gray-500 active:text-[#D4AF37] active:border-[#D4AF37] active:bg-[#D4AF37]/5 cursor-pointer transition-all min-h-[250px]"
                        >
                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Plus size={28} />
                            </div>
                            <span className="font-serif text-lg">Add Edition</span>
                        </motion.div>

                        {products.map((product, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                key={product._id} 
                                className={`bg-[#121212] border rounded-xl overflow-hidden group flex flex-col ${idx === 0 ? "border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]" : "border-white/10"}`}
                            >
                                <div className="h-48 bg-[#0a0a0a] relative p-4 flex items-center justify-center overflow-hidden">
                                    <img src={product.images && product.images[0]?.url ? product.images[0].url : "/placeholder.png"} alt={product.name} className="h-full object-contain relative z-0 group-hover:scale-110 transition-transform duration-500" />
                                    
                                    {/* HERO Badge for First Product */}
                                    {idx === 0 && (
                                        <div className="absolute top-3 left-3 z-20">
                                            <span className="bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                <Star size={10} fill="black" /> HERO PRODUCT
                                            </span>
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border backdrop-blur-md ${
                                            product.stock > 10 ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                        }`}>
                                            {product.stock > 0 ? `${product.stock} IN STOCK` : "OUT OF STOCK"}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <p className="text-[10px] text-[#D4AF37] uppercase tracking-wider mb-1">{product.category}</p>
                                        <h3 className="text-lg font-serif text-white">{product.name}</h3>
                                        <p className="text-xl font-bold text-white mt-2">₹{product.price}</p>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-white/10"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product._id); }}
                                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-red-500/20"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                      </div>
                )}

                {/* 4. CUSTOMERS (CLIENTELE) TAB */}
                {activeTab === 'customers' && (
                    <div className="space-y-4">
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                                        <tr>
                                            <th className="px-6 py-4">Client</th>
                                            <th className="px-6 py-4">Contact</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4 text-right">Join Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {customers.map((customer, i) => (
                                            <DesktopCustomerRow key={customer._id} customer={customer} updateUserRole={updateUserRole} i={i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Customer Cards */}
                        <div className="md:hidden space-y-3">
                             {customers.map((customer, i) => (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                    key={customer._id}
                                    className="bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-sm">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-white block">{customer.name}</span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10}/> {customer.email}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                        <span className="text-xs text-gray-600 flex items-center gap-1">
                                            <Calendar size={12}/> {new Date(customer.createdAt).toLocaleDateString()}
                                        </span>
                                        <select
                                            value={customer.role}
                                            onChange={(e) => updateUserRole(customer._id, e.target.value)}
                                            className={`text-xs font-bold uppercase px-2 py-1 rounded border outline-none bg-[#050505] ${
                                                customer.role === 'admin' ? 'text-purple-400 border-purple-500/30' : 'text-gray-400 border-white/10'
                                            }`}
                                        >
                                            <option value="user">USER</option>
                                            <option value="admin">ADMIN</option>
                                        </select>
                                    </div>
                                </motion.div>
                             ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
      </main>

      {/* --- MOBILE OPTIMIZED MODAL --- */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                onClick={() => setShowAddProduct(false)} 
                className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-[#121212] border-t md:border border-white/10 w-full md:max-w-lg md:rounded-xl rounded-t-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#121212] z-10 pb-2 border-b border-white/5">
                    <h2 className="text-xl font-serif text-[#D4AF37]">{isEditing ? "Edit Edition" : "New Edition"}</h2>
                    <button onClick={() => setShowAddProduct(false)} className="bg-white/5 p-1 rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleProductSubmit} className="space-y-4 pb-4">
                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold">Product Name</label>
                        <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold">Price (₹)</label>
                            <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1" />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-500 font-bold">Stock</label>
                            <input type="number" required value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold">Category (Edition)</label>
                        <input type="text" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1" />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold">Description</label>
                        <textarea required value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1 h-24" />
                    </div>
                    <div>
                        <label className="text-xs uppercase text-gray-500 font-bold">Image URL</label>
                        <input type="text" placeholder="https://..." required value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} className="w-full bg-[#050505] border border-white/10 rounded p-3 text-white focus:border-[#D4AF37] outline-none mt-1" />
                    </div>
                    
                    <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold uppercase py-4 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 mt-4 shadow-lg shadow-[#D4AF37]/20">
                        <Save size={18} /> {isEditing ? "Update Edition" : "Launch Edition"}
                    </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatusBadge({ status, onClick }) {
    const styles = {
        "Pending": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        "Shipped": "bg-blue-500/10 text-blue-400 border-blue-500/20",
        "Delivered": "bg-green-500/10 text-green-400 border-green-500/20",
        "Cancelled": "bg-red-500/10 text-red-400 border-red-500/20"
    };

    return (
        <button 
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${styles[status] || styles["Pending"]}`}
        >
            {status}
        </button>
    );
}

function StatCard({ title, value, icon: Icon, color, bg, trend, trendUp }) {
    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#121212] border border-white/5 p-5 md:p-6 rounded-xl relative overflow-hidden group hover:border-[#D4AF37]/30 transition-colors shadow-lg"
        >
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 font-mono">{value}</h3>
                </div>
                <div className={`p-3 ${bg} rounded-xl ${color} shadow-inner bg-opacity-50`}>
                    <Icon size={20}/>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trend}
                </span>
                <span className="text-gray-600 text-[10px] uppercase">vs last month</span>
            </div>
        </motion.div>
    );
}

function DesktopOrderRow({ order, cycleStatus, deleteOrder, index }) {
    return (
        <motion.tr 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
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
                <StatusBadge status={order.orderStatus} onClick={() => cycleStatus(order._id, order.orderStatus)} />
            </td>
            <td className="px-6 py-4 text-right">
                <button onClick={() => deleteOrder(order._id)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
            </td>
        </motion.tr>
    )
}

function DesktopCustomerRow({ customer, updateUserRole, i }) {
    return (
        <motion.tr 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            className="hover:bg-white/[0.02] transition-colors"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-xs shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                        {customer.name.charAt(0)}
                    </div>
                    <div>
                        <span className="font-bold text-white block">{customer.name}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-gray-400 text-xs">
                {customer.email}
            </td>
            <td className="px-6 py-4">
                <select
                    value={customer.role}
                    onChange={(e) => updateUserRole(customer._id, e.target.value)}
                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded border outline-none cursor-pointer transition-all duration-300 appearance-none ${
                        customer.role === 'admin' ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-gray-400/10 border-gray-400/30 text-gray-300'
                    }`}
                >
                    <option value="user" className="bg-[#121212] text-gray-400">USER</option>
                    <option value="admin" className="bg-[#121212] text-purple-400 font-bold">ADMIN</option>
                </select>
            </td>
            <td className="px-6 py-4 text-right text-white font-mono text-xs">
                {new Date(customer.createdAt).toLocaleDateString()}
            </td>
        </motion.tr>
    )
}