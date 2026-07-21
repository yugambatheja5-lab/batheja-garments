import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import OrderJourney from "./components/OrderJourney";

function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const [ordersRes, lookbooksRes] = await Promise.all([
          fetch("/api/orders/my", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
          }),
          fetch(`/api/lookbooks/user/${user._id}`)
        ]);
        
        const ordersData = await ordersRes.json();
        const lookbooksData = await lookbooksRes.json();
        
        if (ordersRes.ok) setOrders(ordersData);
        if (lookbooksRes.ok) setLookbooks(lookbooksData);
      } catch (err) {
        console.error("Failed to fetch profile archives:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return '#3182ce';
      case 'Shipped': return '#d69e2e';
      case 'Delivered': return '#38a169';
      case 'Cancelled': return '#e53e3e';
      default: return '#718096';
    }
  };

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Profile Header */}
      <div style={{ backgroundColor: "#000", color: "#fff", padding: "40px 16px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 42px)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Member Profile</h1>
        <p style={{ fontSize: "clamp(13px, 2vw, 16px)", color: "#ccc", maxWidth: "600px", margin: "0 auto" }}>
          Track your luxury acquisitions and manage your shipping preferences.
        </p>
      </div>

      <div className="responsive-profile-grid" style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "50px", alignItems: "start" }}>
        
        {/* Left Column: Identity & Logout */}
        <div className="responsive-profile-sidebar" style={{ background: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)", position: "sticky", top: "120px" }}>
          <div style={{ 
            width: "90px", 
            height: "90px", 
            borderRadius: "50%", 
            backgroundColor: "#000", 
            color: "#d4af37",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "36px", 
            fontWeight: "900", 
            marginBottom: "25px",
            border: "2px solid #d4af37"
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <h2 style={{ fontSize: "26px", fontWeight: "900", marginBottom: "5px", letterSpacing: "-0.5px" }}>{user.name}</h2>
          <p style={{ color: "#777", fontSize: "14px", marginBottom: "30px", fontWeight: "500" }}>{user.email}</p>

          <div style={{ borderTop: "1px solid #eee", paddingTop: "25px", marginBottom: "30px" }}>
             <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "15px" }}>Account Preferences</p>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#444", cursor: "pointer" }}>Edit Personal Details</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#444", cursor: "pointer" }}>Saved Addresses</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#444", cursor: "pointer" }}>Payment Methods</span>
             </div>
          </div>

          <button 
            onClick={handleLogout}
            style={{ 
              width: "100%", 
              padding: "16px", 
              backgroundColor: "transparent", 
              color: "#ff4d4d", 
              border: "2px solid #ff4d4d", 
              borderRadius: "8px", 
              fontSize: "13px", 
              fontWeight: "800", 
              cursor: "pointer", 
              textTransform: "uppercase", 
              letterSpacing: "2px",
              transition: "all 0.3s"
            }}
            onMouseEnter={e => { e.target.style.backgroundColor = "#ff4d4d"; e.target.style.color = "#fff"; }}
            onMouseLeave={e => { e.target.style.backgroundColor = "transparent"; e.target.style.color = "#ff4d4d"; }}
          >
            Terminal Logout
          </button>
        </div>

        {/* Right Column: Dynamic Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* Order History Section */}
          <div style={{ background: "#fff", padding: "50px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-1px" }}>Order Acquisitions</h3>
              <span style={{ background: "#000", color: "#fff", fontSize: "12px", padding: "5px 15px", borderRadius: "20px", fontWeight: "700" }}>
                {orders.length} TOTAL
              </span>
            </div>
            
            {loading ? (
               <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#777", fontWeight: "600" }}>Securing your history...</p>
               </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed #eee", borderRadius: "12px" }}>
                <p style={{ fontSize: "18px", color: "#888", marginBottom: "25px", fontWeight: "600" }}>Your acquisition history is currently empty.</p>
                <button 
                  onClick={() => navigate("/shop")}
                  style={{ padding: "16px 40px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                {orders.map((order) => (
                  <div key={order._id} className="shop-product-card" style={{ border: "1px solid #f0f0f0", borderRadius: "12px", overflow: "hidden" }}>
                    {/* Order Header / Meta */}
                    <div style={{ background: "#fafafa", padding: "20px 30px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: "11px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "5px", letterSpacing: "1px" }}>Order ID</p>
                          <p style={{ fontSize: "15px", fontWeight: "700", color: "#333", fontFamily: "monospace" }}>#{order._id.substring(18).toUpperCase()}</p>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
                           <span style={{ 
                             fontSize: "11px", 
                             fontWeight: "800", 
                             textTransform: "uppercase", 
                             letterSpacing: "1.5px", 
                             padding: "6px 14px", 
                             borderRadius: "4px", 
                             backgroundColor: getStatusColor(order.orderStatus), 
                             color: "#fff" 
                           }}>
                             {order.orderStatus}
                           </span>
                           <span style={{ 
                             fontSize: "10px", 
                             fontWeight: "700", 
                             color: order.paymentStatus === 'Completed' ? '#38a169' : '#d69e2e',
                             textTransform: "uppercase" 
                           }}>
                             Payment: {order.paymentStatus === 'Completed' ? 'PAID' : 'PENDING'}
                           </span>
                        </div>
                    </div>

                    <div style={{ padding: "0 30px" }}>
                       <OrderJourney bespokeStatus={order.bespokeStatus || 'Consultation'} />
                    </div>

                    <div style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "25px" }}>
                       {/* Product List */}
                       <div style={{ flex: "1 1 250px" }}>
                          <p style={{ fontSize: "11px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>Acquired Items</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                             {order.items.map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                   <div style={{ width: "45px", height: "55px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                                      <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                   </div>
                                   <div>
                                      <p style={{ fontSize: "13px", fontWeight: "700", color: "#111", margin: 0 }}>{item.name}</p>
                                      <p style={{ fontSize: "11px", color: "#777", fontWeight: "500", margin: "2px 0 0" }}>Qty: {item.qty} | Size: {item.selectedSize || item.size} | {item.selectedColor || item.color}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Summary & Actions */}
                       <div style={{ flex: "1 1 200px", borderLeft: "1px solid #eee", paddingLeft: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ fontSize: "11px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Status Date</p>
                            <p style={{ fontSize: "13px", fontWeight: "700", marginBottom: "15px" }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                            
                            <p style={{ fontSize: "11px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Financial Total</p>
                            <p style={{ fontSize: "20px", fontWeight: "900", color: "#000", margin: 0 }}>₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          
                          <button style={{ 
                            marginTop: "20px", 
                            padding: "10px", 
                            backgroundColor: "#fff", 
                            border: "1px solid #000", 
                            color: "#000", 
                            fontSize: "11px", 
                            fontWeight: "800", 
                            textTransform: "uppercase", 
                            letterSpacing: "1px", 
                            cursor: "pointer" 
                          }}>
                            Track Shipment
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lookbook Studio Archives */}
          <div style={{ background: "#fff", padding: "50px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
              <h3 style={{ fontSize: "28px", fontWeight: "900", margin: 0, letterSpacing: "-1px" }}>Saved Masterpieces</h3>
              <button 
                onClick={() => navigate("/studio")}
                style={{ background: "#d4af37", color: "#000", border: "none", fontSize: "11px", padding: "8px 15px", borderRadius: "4px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
              >
                Open Studio
              </button>
            </div>

            {lookbooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", border: "1px solid #eee", borderRadius: "12px", background: "#fcfcfc" }}>
                <p style={{ color: "#999", fontSize: "14px", fontWeight: "600" }}>No visual compositions archived yet.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                {lookbooks.map((look) => (
                  <div key={look._id} className="shop-product-card" style={{ border: "1px solid #eee", borderRadius: "12px", overflow: "hidden", background: "#fff" }}>
                    <div style={{ height: "180px", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                       {look.items.slice(0, 3).map((item, idx) => (
                         <img 
                          key={idx} 
                          src={item.image} 
                          alt="" 
                          style={{ 
                            width: "80px", 
                            height: "auto", 
                            position: "absolute", 
                            left: `${20 + (idx * 25)}%`,
                            zIndex: idx,
                            boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
                            transform: `rotate(${idx % 2 === 0 ? '-5deg' : '5deg'})`
                          }} 
                        />
                       ))}
                       <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
                       <span style={{ position: "relative", zIndex: 10, color: "#fff", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}>
                         {look.items.length} PIECES
                       </span>
                    </div>
                    <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "800", margin: 0 }}>{look.name}</p>
                        <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{new Date(look.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Permanently deconstruct this masterpiece?")) {
                            await fetch(`/api/lookbooks/${look._id}`, { method: 'DELETE' });
                            window.location.reload();
                          }
                        }}
                        style={{ background: "none", border: "none", color: "#ff4444", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;