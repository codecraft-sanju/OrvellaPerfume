import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  LayoutDashboard, ShoppingBag, Users, ArrowLeft, 
  TrendingUp, Package, Search, Bell, CheckCircle, Clock, X, 
  Save, Edit, Trash2, Calendar, Star, AlertTriangle
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

  // --- DATA STATES ---
  const [orders, setOrders] = useState([]);
  // Hum array use karenge lekin sirf first item pe focus karenge
  const [products, setProducts] = useState([]); 
  const [customers, setCustomers] = useState([]);
  const [revenue, setRevenue] = useState(0);

  // --- MODAL STATE (ONLY EDIT) ---
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Single Product Form State
  const [productForm, setProductForm] = useState({
    _id: null,
    name: "",
    price: "",
    description: "",
    category: "Signature Scent",
    stock: 0,
    imageUrl: "" 
  });

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    try {
      const { data: orderData } = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
      setOrders(orderData.orders);
      setRevenue(orderData.totalAmount);

      const { data: productData } = await axios.get(`${API_URL}/products`);
      setProducts(productData.products);

      const { data: userData } = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
      setCustomers(userData.users);

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      if(error.response?.status === 401) navigate("/auth");
    }
  };

  useEffect(() => {
    fetchData();
    socket.on("new_order_notification", () => {
        showNotification("New Order Received!");
        fetchData(); 
    });
    return () => socket.off("new_order_notification");
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- SINGLE PRODUCT LOGIC ---
  
  // 1. Initialize (Agar database khali hai to default Orvella product banaye)
  const initializeProduct = async () => {
    const defaultData = {
        name: "Orvella The Golden Root",
        price: 5999, 
        description: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention.",
        category: "Signature Scent",
        stock: 50,
        images: [{ public_id: "init", url: "/orvella.jpeg" }]
    };

    try {
        await axios.post(`${API_URL}/admin/product/new`, defaultData, { 
            headers: { "Content-Type": "application/json" }, 
            withCredentials: true 
        });
        showNotification("Orvella Product Initialized!");
        fetchData(); // Refresh data
    } catch (error) {
        showNotification("Failed to initialize");
    }
  };

  // 2. Open Edit Modal (Load existing data)
  const openEditModal = () => {
      if (products.length === 0) return;
      const currentProduct = products[0]; // Always take the first product
      
      setProductForm({
          _id: currentProduct._id,
          name: currentProduct.name,
          price: currentProduct.price,
          description: currentProduct.description,
          category: currentProduct.category,
          stock: currentProduct.stock,
          imageUrl: currentProduct.images?.[0]?.url || ""
      });
      setShowEditModal(true);
  };

  // 3. Update Product
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
        const updateData = {
            ...productForm,
            images: [{ public_id: "update_" + Date.now(), url: productForm.imageUrl }]
        };

        const { data } = await axios.put(`${API_URL}/admin/product/${productForm._id}`, updateData, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
        });

        // Update local state locally to avoid refetch flicker
        setProducts([data.product]); 
        showNotification("Product Updated Successfully!");
        setShowEditModal(false);
    } catch (error) {
        showNotification("Update Failed");
    }
  };

  // --- ORDER & USER ACTIONS ---
  const cycleStatus = async (id, currentStatus) => {
    const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    try {
        await axios.put(`${API_URL}/admin/order/${id}`, { status: nextStatus }, { withCredentials: true });
        setOrders(orders.map(o => o._id === id ? { ...o, orderStatus: nextStatus } : o));
        showNotification(`Status: ${nextStatus}`);
    } catch (e) { showNotification("Failed to update"); }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Delete this order?")) return;
    try {
        await axios.delete(`${API_URL}/admin/order/${id}`, { withCredentials: true });
        setOrders(orders.filter(o => o._id !== id));
        showNotification("Order deleted");
    } catch (e) { showNotification("Failed delete"); }
  };

  const updateUserRole = async (userId, newRole) => {
    if(!window.confirm(`Make user ${newRole}?`)) return;
    try {
        await axios.put(`${API_URL}/admin/user/${userId}`, { role: newRole }, { headers: { "Content-Type": "application/json" }, withCredentials: true });
        setCustomers(customers.map(u => u._id === userId ? { ...u, role: newRole } : u));
        showNotification("Role Updated");
    } catch (e) { showNotification("Failed update"); }
  };

  // --- RENDER HELPERS ---
  const filteredOrders = orders.filter(o => 
    (o.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    o._id.includes(searchQuery)
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#D4AF37]">Loading Admin...</div>;

  // The Active Product (Orvella)
  const masterProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-2 left-1/2 -translate-x-1/2 z-[110] bg-[#D4AF37] text-black px-6 py-2 rounded-full font-bold shadow-lg">
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 w-72 h-full bg-[#121212] border-r border-white/10 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 flex justify-between items-center">
             <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest">ORVELLA <span className="block text-[10px] text-gray-500 font-sans tracking-[0.3em]">ADMIN</span></h1>
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden"><X /></button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'orders', icon: ShoppingBag, label: 'Orders' },
                { id: 'inventory', icon: Package, label: 'Product Details' }, // Renamed
                { id: 'customers', icon: Users, label: 'Clientele' },
            ].map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? "bg-[#D4AF37] text-black font-bold" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                    <item.icon size={20} /> {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4"><Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#D4AF37] p-3"><ArrowLeft size={16} /> Back to Store</Link></div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden"><div className="space-y-1"><div className="w-6 h-0.5 bg-white"></div><div className="w-6 h-0.5 bg-white"></div><div className="w-6 h-0.5 bg-white"></div></div></button>
                <h2 className="text-xl font-serif text-white capitalize">{activeTab === 'inventory' ? 'Product Management' : activeTab}</h2>
            </div>
            {activeTab === 'orders' && (
                <div className="relative">
                    <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#121212] border border-white/10 rounded-full px-4 py-2 pl-10 text-sm focus:border-[#D4AF37] w-64 outline-none" />
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                </div>
            )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
            
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={TrendingUp} color="text-[#D4AF37]" />
                    <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="text-purple-400" />
                    <StatCard title="Active Clients" value={customers.length} icon={Users} color="text-blue-400" />
                    <StatCard title="Pending Orders" value={orders.filter(o => o.orderStatus === 'Pending').length} icon={Clock} color="text-orange-400" />
                </div>
            )}

            {/* 2. ORDERS */}
            {(activeTab === 'orders' || activeTab === 'dashboard') && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Orders</h3>
                    <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-white/5">
                                        <td className="px-6 py-4 font-mono">#{order._id.slice(-6)}</td>
                                        <td className="px-6 py-4">{order.user?.name || "Unknown"}</td>
                                        <td className="px-6 py-4 text-[#D4AF37]">₹{order.totalPrice}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => cycleStatus(order._id, order.orderStatus)} className={`px-2 py-1 rounded text-xs border ${order.orderStatus === 'Delivered' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'}`}>{order.orderStatus}</button>
                                        </td>
                                        <td className="px-6 py-4 text-right"><button onClick={() => deleteOrder(order._id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredOrders.length === 0 && <div className="p-8 text-center text-gray-600">No orders found.</div>}
                    </div>
                </div>
            )}

            {/* 3. PRODUCT MANAGEMENT (SINGLE PRODUCT MODE) */}
            {activeTab === 'inventory' && (
                <div className="max-w-4xl mx-auto">
                    {!masterProduct ? (
                        // EMPTY STATE: Show Initialization Button
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/20 rounded-xl bg-[#121212]">
                            <AlertTriangle size={48} className="text-[#D4AF37] mb-4" />
                            <h3 className="text-2xl text-white font-serif mb-2">Product Not Initialized</h3>
                            <p className="text-gray-500 mb-8">Admin database is empty. Initialize to setup "Orvella".</p>
                            <button onClick={initializeProduct} className="bg-[#D4AF37] text-black font-bold px-8 py-3 rounded hover:bg-white transition-colors">
                                Initialize Master Product
                            </button>
                        </div>
                    ) : (
                        // FILLED STATE: Show Single Product Card
                        <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.1)]">
                            <div className="grid md:grid-cols-2">
                                <div className="bg-[#050505] p-10 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                                    <img src={masterProduct.images[0]?.url} alt="Orvella" className="max-h-[300px] object-contain drop-shadow-[0_10px_30px_rgba(212,175,55,0.2)]" />
                                </div>
                                <div className="p-8 md:p-10 flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[#D4AF37] uppercase tracking-widest text-xs font-bold">Active Product</span>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${masterProduct.stock > 0 ? "border-green-500 text-green-500" : "border-red-500 text-red-500"}`}>
                                                {masterProduct.stock} IN STOCK
                                            </span>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-serif text-white mb-2">{masterProduct.name}</h2>
                                    <p className="text-2xl text-[#D4AF37] font-serif mb-6">₹{masterProduct.price}</p>
                                    <div className="bg-white/5 p-4 rounded mb-6">
                                        <h4 className="text-xs text-gray-500 uppercase mb-2">Description Preview</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{masterProduct.description}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={openEditModal}
                                        className="w-full bg-white/10 hover:bg-[#D4AF37] hover:text-black text-white border border-white/20 hover:border-[#D4AF37] py-4 rounded font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit size={18} /> Update Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. CUSTOMERS */}
            {activeTab === 'customers' && (
                <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                         <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                            <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th></tr>
                        </thead>
                        <tbody>
                            {customers.map(u => (
                                <tr key={u._id} className="border-t border-white/5">
                                    <td className="p-4 font-bold text-white">{u.name}</td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4"><select value={u.role} onChange={(e) => updateUserRole(u._id, e.target.value)} className="bg-black border border-white/20 rounded px-2 py-1 text-xs"><option value="user">USER</option><option value="admin">ADMIN</option></select></td>
                                    <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>

        {/* --- EDIT MODAL (Simplified) --- */}
        <AnimatePresence>
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-[#121212] border border-[#D4AF37]/50 w-full max-w-lg rounded-xl p-6 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-serif text-[#D4AF37]">Update Product</h2>
                            <button onClick={() => setShowEditModal(false)}><X className="text-gray-400 hover:text-white"/></button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <div><label className="text-xs uppercase text-gray-500">Name</label><input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded text-white mt-1"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs uppercase text-gray-500">Price (₹)</label><input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded text-white mt-1"/></div>
                                <div><label className="text-xs uppercase text-gray-500">Stock</label><input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded text-white mt-1"/></div>
                            </div>
                            <div><label className="text-xs uppercase text-gray-500">Image URL</label><input type="text" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded text-white mt-1"/></div>
                            <div><label className="text-xs uppercase text-gray-500">Description</label><textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded text-white mt-1 h-24"/></div>
                            <button type="submit" className="w-full bg-[#D4AF37] text-black font-bold uppercase py-4 rounded hover:bg-white transition-colors mt-2">Save Changes</button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

      </main>
    </div>
  );
}

// Simple Stat Card Helper
function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-[#121212] border border-white/5 p-6 rounded-xl hover:border-[#D4AF37]/30 transition-colors">
            <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-xs uppercase">{title}</p><h3 className="text-2xl font-bold text-white mt-1">{value}</h3></div>
                <div className={`p-2 bg-white/5 rounded-lg ${color}`}><Icon size={20}/></div>
            </div>
        </div>
    );
}