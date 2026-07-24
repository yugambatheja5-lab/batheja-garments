import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard({ user, fetchProducts }) {
  const navigate = useNavigate();
  const [popularSearches, setPopularSearches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics"); // 'analytics', 'orders', 'catalog', 'inventory'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, inventory: 0 });

  // Form State
  const [form, setForm] = useState({
    name: "", price: "", stock: "", category: "", department: "Men", 
    image: "", description: "", variants: { sizes: [], colors: [] },
    isFeatured: false, isVaultItem: false, releaseDate: ""
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      const timer = setTimeout(() => navigate('/'), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };

      // 1. Fetch Analytics
      const analyticsRes = await fetch("/api/analytics/popular");
      const analyticsData = await analyticsRes.json();
      if (analyticsRes.ok) setPopularSearches(analyticsData);

      // 2. Fetch All Orders
      const ordersRes = await fetch("/api/admin/orders", { headers });
      const ordersData = await ordersRes.json();
      if (ordersRes.ok && Array.isArray(ordersData)) setOrders(ordersData);

      // 3. Fetch Products (for Catalog & Inventory)
      const productsRes = await fetch("/api/admin/products", { headers });
      const productsData = await productsRes.json();
      if (productsRes.ok && Array.isArray(productsData)) setProductsList(productsData);

      // 4. Fetch Summary Stats
      const statsRes = await fetch("/api/admin/stats", { headers });
      const statsData = await statsRes.json();
      if (statsRes.ok) setStats(statsData);

    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') fetchData();
  }, [user]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderStatus: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const updateBespokeStatus = async (orderId, newBespokeStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ bespokeStatus: newBespokeStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, bespokeStatus: newBespokeStatus } : o));
      }
    } catch (err) {
      console.error("Bespoke update failed", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      const data = await res.json();
      if (data.imageUrl) {
        setForm({...form, image: data.imageUrl});
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const updateStock = async (id, currentStock, delta) => {
    const newStock = Math.max(0, parseInt(currentStock) + delta);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        setProductsList(productsList.map(p => p._id === id ? { ...p, stock: newStock } : p));
        if (fetchProducts) fetchProducts();
      }
    } catch (err) {
      console.error("Stock update failed", err);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const url = editingProduct 
      ? `/api/admin/products/${editingProduct._id}`
      : `/api/admin/products`;
    
    const method = editingProduct ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchData(); // Refresh local list
        if (fetchProducts) fetchProducts(); // Refresh global collection
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Purge this item from history?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchData();
        if (fetchProducts) fetchProducts();
      }
    } catch (err) {
      console.error("Deletion failed", err);
    }
  };

  const toggleFeatured = async (product) => {
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isFeatured: !product.isFeatured })
      });
      if (res.ok) {
        fetchData();
        if (fetchProducts) fetchProducts();
      }
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setForm(product);
    } else {
      setEditingProduct(null);
      setForm({
        name: "", price: "", stock: "", category: "", department: "Men", 
        image: "", description: "", variants: { sizes: [], colors: [] },
        isFeatured: false, isVaultItem: false, releaseDate: ""
      });
    }
    setIsModalOpen(true);
  };

  if (!user) return null;

  const lowStockProducts = productsList.filter(p => p.stock < 10);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#fff", paddingBottom: "100px" }}>
      <div className="responsive-admin-header" style={{ padding: "40px 5%", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
           <h1 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "3px", color: "#fff", margin: 0 }}>
             Belvedere HQ
           </h1>
           <p style={{ color: "#666", fontSize: "12px", marginTop: "8px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
             Strategic Operations & Insights
           </p>
        </div>
        <div className="responsive-admin-tabs" style={{ display: "flex", gap: "10px" }}>
           {["analytics", "orders", "users", "catalog", "lookbook"].map(tab => (
              <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 style={{
                   padding: "10px 20px",
                   borderRadius: "4px",
                   border: activeTab === tab ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.1)",
                   background: activeTab === tab ? "rgba(212, 175, 55, 0.1)" : "transparent",
                   color: activeTab === tab ? "#d4af37" : "#888",
                   fontWeight: "800",
                   textTransform: "uppercase",
                   fontSize: "11px",
                   letterSpacing: "1.5px",
                   cursor: "pointer",
                   transition: "all 0.3s"
                 }}
              >
                 {tab === 'users' ? '🛡️ USER SECURITY' : tab}
              </button>
           ))}
        </div>
      </div>

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "20px 4%" }}>
        
        {/* COMMAND CENTER STATS */}
        <div className="responsive-admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "40px" }}>
           {[
             { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, color: "#d4af37" },
             { label: "Order Volume", value: stats.orders, color: "#fff" },
             { label: "Catalog Size", value: stats.products, color: "#fff" },
             { label: "Active Inventory", value: stats.inventory, color: stats.inventory < 50 ? "#ff4d4d" : "#00ff88" }
           ].map((s, i) => (
             <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "25px", borderRadius: "12px" }}>
                <p style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>{s.label}</p>
                <p style={{ fontSize: "24px", fontWeight: "900", color: s.color, margin: 0 }}>{s.value}</p>
             </div>
           ))}
        </div>
        
        {/* TAB 1: ANALYTICS */}
        {activeTab === "analytics" && (
           <div style={{ animation: "fadeIn 0.5s ease" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px" }}>
                Consumer Demand Intelligence
              </h2>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "40px" }}>
                {loading ? <p>Calculating Demand...</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {popularSearches.map((item, index) => {
                      const maxCount = popularSearches[0].count;
                      const percentage = (item.count / maxCount) * 100;
                      return (
                        <div key={item._id} style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                          <span style={{ width: "30px", color: "#444", fontWeight: "900" }}>{index+1}</span>
                          <span style={{ width: "180px", fontWeight: "700", textTransform: "capitalize" }}>{item._id}</span>
                          <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "5px", overflow: "hidden" }}>
                             <div style={{ width: `${percentage}%`, height: "100%", background: "#d4af37" }} />
                          </div>
                          <span style={{ color: "#666", fontSize: "13px", fontWeight: "700" }}>{item.count} SITS</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
           </div>
        )}

        {/* TAB 3: CATALOG MANAGER */}
        {activeTab === "catalog" && (
           <div style={{ animation: "fadeIn 0.5s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                 <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Boutique Inventory Catalog
                 </h2>
                 <button 
                    onClick={() => openModal()}
                    style={{ padding: "12px 25px", background: "#d4af37", color: "#000", border: "none", borderRadius: "4px", fontWeight: "900", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}
                 >
                    + NEW ACQUISITION
                 </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                 {productsList.map(item => (
                   <div key={item._id} className="responsive-admin-catalog-item" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "15px 25px", display: "grid", gridTemplateColumns: "80px 1.5fr 1fr 1fr 220px", gap: "20px", alignItems: "center" }}>
                      <img src={item.image} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div>
                         <p style={{ fontSize: "14px", fontWeight: "700", marginBottom: "2px" }}>{item.name}</p>
                         <p style={{ fontSize: "11px", color: "#666", fontWeight: "600", textTransform: "uppercase" }}>{item.category} | {item.department}</p>
                      </div>
                      <div>
                         <p style={{ fontSize: "10px", color: "#555", fontWeight: "800", textTransform: "uppercase" }}>Valuation</p>
                         <p style={{ fontSize: "14px", fontWeight: "700", color: "#d4af37" }}>₹{item.price.toLocaleString()}</p>
                      </div>
                      <div>
                         <p style={{ fontSize: "10px", color: "#555", fontWeight: "800", textTransform: "uppercase" }}>Existence</p>
                         <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button onClick={() => updateStock(item._id, item.stock, -1)} style={{ width: "24px", height: "24px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>-</button>
                            <span style={{ fontSize: "14px", fontWeight: "700", color: item.stock < 10 ? "#ff4d4d" : "#00ff88", minWidth: "30px", textAlign: "center" }}>{item.stock}</span>
                            <button onClick={() => updateStock(item._id, item.stock, 1)} style={{ width: "24px", height: "24px", border: "1px solid #444", background: "transparent", color: "#fff", cursor: "pointer", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>+</button>
                         </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                         <button 
                           onClick={() => toggleFeatured(item)} 
                           style={{ 
                             minWidth: "85px",
                             background: item.isFeatured ? "rgba(212, 175, 55, 0.2)" : "transparent", 
                             border: item.isFeatured ? "1px solid #d4af37" : "1px solid #444", 
                             color: item.isFeatured ? "#d4af37" : "#fff", 
                             padding: "8px 10px", 
                             borderRadius: "4px", 
                             fontSize: "9px", 
                             fontWeight: "900",
                             cursor: "pointer",
                             transition: "all 0.2s"
                           }}
                         >
                           {item.isFeatured ? "FEATURED" : "STANDARD"}
                         </button>
                         <button onClick={() => openModal(item)} style={{ minWidth: "50px", background: "transparent", border: "1px solid #444", color: "#fff", padding: "8px 10px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", cursor: "pointer", transition: "all 0.2s" }}>EDIT</button>
                         <button 
                           onClick={() => deleteProduct(item._id)} 
                           onMouseEnter={e => { e.target.style.background = "#ff4d4d"; e.target.style.color = "#fff"; }}
                           onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#ff4d4d"; }}
                           style={{ minWidth: "60px", background: "transparent", border: "1px solid #ff4d4d", color: "#ff4d4d", padding: "8px 10px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", cursor: "pointer", transition: "all 0.2s" }}
                         >
                            PURGE
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* PRODUCT MODAL */}
        {isModalOpen && (
           <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
              <div style={{ width: "100%", maxWidth: "800px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden", animation: "modalSlideUp 0.4s ease" }}>
                 <div style={{ padding: "30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, textTransform: "uppercase", letterSpacing: "2px", fontWeight: "900" }}>{editingProduct ? "Edit Portfolio Item" : "New Catalog Acquisition"}</h3>
                    <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}>×</button>
                 </div>
                 <form onSubmit={handleSaveProduct} style={{ padding: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                       <div>
                          <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Item Title</label>
                          <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: "100%", background: "#0c0c0c", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "4px" }} required />
                       </div>
                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <div>
                             <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Valuation (INR)</label>
                             <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={{ width: "100%", background: "#0c0c0c", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "4px" }} required />
                          </div>
                          <div>
                             <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Unit existence</label>
                             <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} style={{ width: "100%", background: "#0c0c0c", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "4px" }} required />
                          </div>
                       </div>
                       <div>
                          <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Classification</label>
                          <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Jacket, Footwear" style={{ width: "100%", background: "#0c0c0c", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "4px" }} required />
                       </div>
                       <div>
                          <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Collection Narrative</label>
                          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: "100%", background: "#0c0c0c", border: "1px solid #222", padding: "12px", color: "#fff", borderRadius: "4px", minHeight: "80px" }} />
                       </div>
                       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#d4af37" }} />
                          <label htmlFor="featured" style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>MARK AS NEW COLLECTION / FEATURED</label>
                       </div>
                       <div style={{ border: "1px solid #333", padding: "15px", borderRadius: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                             <input type="checkbox" id="vault" checked={form.isVaultItem} onChange={e => setForm({...form, isVaultItem: e.target.checked})} style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#d4af37" }} />
                             <label htmlFor="vault" style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", color: "#d4af37" }}>LOCK IN MASTERPIECE VAULT 🛡️</label>
                          </div>
                          {form.isVaultItem && (
                            <div>
                              <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>DROP RELEASE DATE</label>
                              <input type="date" value={form.releaseDate ? form.releaseDate.substring(0, 10) : ""} onChange={e => setForm({...form, releaseDate: e.target.value})} style={{ width: "100%", background: "#000", border: "1px solid #d4af37", padding: "10px", color: "#fff", borderRadius: "4px" }} />
                            </div>
                          )}
                       </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                       <div>
                          <label style={{ fontSize: "10px", fontWeight: "800", color: "#555", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Asset Representation (Cloudinary)</label>
                          <div style={{ width: "100%", height: "200px", border: "2px dashed #222", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                             {form.image ? (
                                <img src={form.image} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                             ) : (
                                <span style={{ color: "#444", fontSize: "11px", fontWeight: "700" }}>NO ASSET ATTACHED</span>
                             )}
                             {uploading && (
                                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800" }}>UPLOADING TO CDN...</div>
                             )}
                          </div>
                          <input type="file" onChange={handleImageUpload} style={{ marginTop: "15px", fontSize: "11px" }} />
                       </div>
                       <button type="submit" style={{ marginTop: "auto", padding: "18px", background: "#fff", color: "#000", border: "none", borderRadius: "4px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>
                          {editingProduct ? "EXECUTE UPDATES" : "FINALIZE ACQUISITION"}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
             <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px" }}>
                Order Fulfillment Queue
             </h2>
             <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {orders.map(order => (
                  <div key={order._id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "25px", display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1fr", gap: "20px", alignItems: "center" }}>
                     <div>
                        <p style={{ fontSize: "10px", color: "#555", fontWeight: "800", textTransform: "uppercase" }}>Order ID</p>
                        <p style={{ fontSize: "14px", fontWeight: "700" }}>#{order._id.substring(18).toUpperCase()}</p>
                     </div>
                     <div>
                        <p style={{ fontSize: "10px", color: "#555", fontWeight: "800", textTransform: "uppercase" }}>Acquirer</p>
                        <p style={{ fontSize: "14px", fontWeight: "700" }}>{order.user?.name || "Guest"}</p>
                        <p style={{ fontSize: "11px", color: "#888" }}>{order.user?.email}</p>
                     </div>
                     <div>
                        <p style={{ fontSize: "10px", color: "#555", fontWeight: "800", textTransform: "uppercase" }}>Value</p>
                        <p style={{ fontSize: "16px", fontWeight: "800" }}>₹{order.totalAmount.toLocaleString('en-IN')}</p>
                        <p style={{ 
                          fontSize: "10px", 
                          fontWeight: "800", 
                          color: order.paymentStatus === 'Completed' ? '#38a169' : '#d69e2e' 
                        }}>
                          {order.paymentStatus === 'Completed' ? '✔ PAID' : '⌛ PENDING / COD'}
                        </p>
                     </div>
                     <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <select 
                           value={order.orderStatus} 
                           onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                           style={{ background: "#000", color: "#d4af37", border: "1px solid #d4af37", padding: "8px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                        >
                           <option value="Processing">Processing</option>
                           <option value="Shipped">Shipped</option>
                           <option value="Delivered">Delivered</option>
                           <option value="Cancelled">Cancelled</option>
                        </select>
                        
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "10px" }}>
                           <p style={{ fontSize: "8px", color: "#555", fontWeight: "900", textTransform: "uppercase", marginBottom: "5px" }}>Craftsmanship Journey</p>
                           <select 
                              value={order.bespokeStatus || "Consultation"} 
                              onChange={(e) => updateBespokeStatus(order._id, e.target.value)}
                              style={{ background: "#111", color: "#fff", border: "1px solid #333", padding: "6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", cursor: "pointer", width: "100%" }}
                           >
                              <option value="Consultation">Consultation</option>
                              <option value="Design & Sourcing">Design & Sourcing</option>
                              <option value="Drafting & Cutting">Drafting & Cutting</option>
                              <option value="Hand-Stitching">Hand-Stitching</option>
                              <option value="Final Fitting">Final Fitting</option>
                              <option value="In Transit">In Transit</option>
                           </select>
                        </div>
                      </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB 3: INVENTORY */}
        {activeTab === "inventory" && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
             <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px" }}>
                Stock Integrity Monitor
             </h2>
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {productsList.map(p => (
                  <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: p.stock < 10 ? "1px solid #ff4d4d" : "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "20px" }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "700", maxWidth: "70%" }}>{p.name}</p>
                        <span style={{ 
                          fontSize: "10px", 
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          background: p.stock < 10 ? "#ff4d4d" : "#2ba959",
                          color: "#fff",
                          fontWeight: "800"
                        }}>
                          {p.stock} STOCK
                        </span>
                     </div>
                     <p style={{ fontSize: "11px", color: "#666" }}>{p.category} | {p.department}</p>
                     {p.stock < 10 && (
                        <p style={{ fontSize: "10px", color: "#ff4d4d", marginTop: "10px", fontWeight: "800", textTransform: "uppercase" }}>⚠️ RESTOCK REQUIRED</p>
                     )}
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminDashboard;
