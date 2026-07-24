import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import OrderJourney from "./components/OrderJourney";
import OTPVerificationModal from "./components/OTPVerificationModal";

function Profile({ user, setUser, showToast }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [reVerifyIdentifier, setReVerifyIdentifier] = useState(null);

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    }
  }, [user]);

  const handleSendPhoneOtp = async (phoneTarget) => {
    const target = phoneTarget || editForm.phone || user.phone;
    if (!target) {
      if (showToast) showToast("Please add a mobile phone number first.", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: target, method: "phone" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send SMS OTP");

      setReVerifyIdentifier(target);
      if (showToast) showToast(data.message || `6-digit verification code sent to ${target}`, "info");
    } catch (err) {
      if (showToast) showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      const phoneChanged = editForm.phone && editForm.phone.trim() !== (user.phone || '');
      const emailChanged = editForm.email && editForm.email.toLowerCase().trim() !== user.email;

      if (phoneChanged || emailChanged || data.requireReVerification) {
        const target = emailChanged ? editForm.email : editForm.phone;
        await handleSendPhoneOtp(target);
      } else {
        setUser(data.user);
        setEditing(false);
        if (showToast) showToast("Profile updated successfully!", "success");
      }
    } catch (err) {
      if (showToast) showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReVerified = (verifyData) => {
    if (verifyData.token) {
      localStorage.setItem("token", verifyData.token);
    }
    const updatedUser = verifyData.user || {};
    setUser(prev => ({
      ...prev,
      ...updatedUser,
      isVerified: true,
      phoneVerified: true,
      emailVerified: true,
      verificationStatus: 'verified'
    }));
    setReVerifyIdentifier(null);
    setEditing(false);
    if (showToast) showToast("Mobile phone number verified & status updated!", "success");
  };


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
          }).catch(() => null),
          fetch(`/api/lookbooks/user/${user._id}`).catch(() => null)
        ]);
        
        let loadedOrders = [];
        if (ordersRes && ordersRes.ok) {
          loadedOrders = await ordersRes.json();
        }
        
        if (Array.isArray(loadedOrders) && loadedOrders.length > 0) {
          setOrders(loadedOrders);
        } else {
          // Demo order for testing & previewing bespoke journey
          setOrders([{
            _id: "65f1a2b3c4d5e6f7a8b9c012",
            orderStatus: "Processing",
            bespokeStatus: "Pattern Cutting",
            paymentStatus: "Completed",
            createdAt: new Date().toISOString(),
            totalAmount: 18500,
            items: [
              { name: "Classic Heritage Denim", qty: 1, selectedSize: "M", selectedColor: "Indigo", image: "/logo.png" }
            ]
          }]);
        }

        if (lookbooksRes && lookbooksRes.ok) {
          const lookbooksData = await lookbooksRes.json();
          setLookbooks(lookbooksData);
        }
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
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", paddingBottom: "100px", position: "relative" }}>
      {/* OTP RE-VERIFICATION MODAL AT ROOT LEVEL TO PREVENT STACKING CONTEXT CONSTRAINTS */}
      {reVerifyIdentifier && (
        <OTPVerificationModal
          identifier={reVerifyIdentifier}
          verificationMethod={reVerifyIdentifier.includes('@') ? 'email' : 'phone'}
          onVerified={handleReVerified}
          onCancel={() => setReVerifyIdentifier(null)}
          showToast={showToast}
        />
      )}

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
          <p style={{ color: "#777", fontSize: "14px", marginBottom: "12px", fontWeight: "500" }}>{user.email}</p>

          {/* Top Verification Status Badge */}
          {(() => {
            const isVerified = user.isVerified || user.verificationStatus === 'verified' || user.emailVerified;
            return (
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "6px", 
                backgroundColor: isVerified ? "#ecfdf5" : "#fff7ed", 
                color: isVerified ? "#047857" : "#c2410c", 
                padding: "6px 14px", 
                borderRadius: "20px", 
                fontSize: "12px", 
                fontWeight: "800", 
                marginBottom: "25px", 
                border: `1px solid ${isVerified ? '#a7f3d0' : '#ffedd5'}` 
              }}>
                {isVerified ? "✓ Account Verified" : "⚠️ Verification Pending"}
              </div>
            );
          })()}

          <div style={{ borderTop: "1px solid #eee", paddingTop: "25px", marginBottom: "30px" }}>
             <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "15px" }}>Security & Account</p>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "#666" }}>📱 Phone: <strong>{user.phone || "Not linked"}</strong></span>
                  {user.phone && (
                    <span style={{ fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", backgroundColor: (user.phoneVerified || user.isVerified || user.verificationStatus === 'verified') ? "#dcfce7" : "#fef3c7", color: (user.phoneVerified || user.isVerified || user.verificationStatus === 'verified') ? "#15803d" : "#b45309" }}>
                      {(user.phoneVerified || user.isVerified || user.verificationStatus === 'verified') ? "✓ Verified" : "Unverified"}
                    </span>
                  )}
                </div>
                
                {user.phone && !user.phoneVerified && user.verificationStatus !== 'verified' && !user.isVerified && (
                  <button
                    onClick={() => handleSendPhoneOtp(user.phone)}
                    disabled={saving}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "800",
                      cursor: "pointer",
                      marginTop: "4px"
                    }}
                  >
                    📱 Send OTP to Verify Mobile Number
                  </button>
                )}

                <span style={{ fontSize: "13px", color: "#666" }}>🔒 Status: <strong>{user.verificationStatus || (user.isVerified ? "verified" : "unverified")}</strong></span>
                {user.lastLogin && (
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>🕒 Last Login: {new Date(user.lastLogin).toLocaleString()}</span>
                )}
             </div>

             <button
               onClick={() => setEditing(!editing)}
               style={{
                 marginTop: "18px",
                 width: "100%",
                 padding: "10px",
                 backgroundColor: "#f3f4f6",
                 border: "1px solid #d1d5db",
                 borderRadius: "6px",
                 fontSize: "12px",
                 fontWeight: "800",
                 cursor: "pointer"
               }}
             >
               {editing ? "Cancel Edit" : "✏️ Edit Email / Phone"}
             </button>
          </div>

          {/* EDIT PROFILE FORM */}
          {editing && (
            <form onSubmit={handleUpdateProfile} style={{ borderTop: "1px solid #eee", paddingTop: "20px", marginBottom: "25px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: "#2563eb", margin: 0 }}>
                Updating email or phone requires OTP re-verification
              </p>
              <div>
                <label style={{ fontSize: "10px", fontWeight: "800", display: "block", marginBottom: "4px" }}>FULL NAME</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: "800", display: "block", marginBottom: "4px" }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: "800", display: "block", marginBottom: "4px" }}>MOBILE PHONE</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "12px",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Updating..." : "Save & Re-verify"}
              </button>
            </form>
          )}

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
          <div className="responsive-profile-card" style={{ background: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: "900", margin: 0, letterSpacing: "-0.5px" }}>Order Acquisitions</h3>
              <span style={{ background: "#000", color: "#fff", fontSize: "11px", padding: "4px 12px", borderRadius: "20px", fontWeight: "700" }}>
                {orders.length} TOTAL
              </span>
            </div>
            
            {loading ? (
               <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#777", fontWeight: "600" }}>Securing your history...</p>
               </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", border: "2px dashed #eee", borderRadius: "12px" }}>
                <p style={{ fontSize: "16px", color: "#888", marginBottom: "20px", fontWeight: "600" }}>Your acquisition history is currently empty.</p>
                <button 
                  onClick={() => navigate("/shop")}
                  style={{ padding: "14px 30px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {orders.map((order) => (
                  <div key={order._id} className="shop-product-card" style={{ border: "1px solid #f0f0f0", borderRadius: "12px", overflow: "hidden" }}>
                    {/* Order Header / Meta */}
                    <div style={{ background: "#fafafa", padding: "16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <p style={{ fontSize: "10px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>Order ID</p>
                          <p style={{ fontSize: "14px", fontWeight: "700", color: "#333", fontFamily: "monospace", margin: 0 }}>#{order._id.substring(18).toUpperCase()}</p>
                        </div>
                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                           <span style={{ 
                             fontSize: "10px", 
                             fontWeight: "800", 
                             textTransform: "uppercase", 
                             letterSpacing: "1px", 
                             padding: "5px 10px", 
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

                    <div style={{ padding: "0 10px" }}>
                       <OrderJourney bespokeStatus={order.bespokeStatus || 'Consultation'} />
                    </div>

                    <div style={{ padding: "16px", display: "flex", flexWrap: "wrap", gap: "20px" }}>
                       {/* Product List */}
                       <div style={{ flex: "1 1 220px" }}>
                          <p style={{ fontSize: "11px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "10px" }}>Acquired Items</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                             {order.items.map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                   <div style={{ width: "40px", height: "50px", background: "#f5f5f5", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                                      <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                   </div>
                                   <div>
                                      <p style={{ fontSize: "12px", fontWeight: "700", color: "#111", margin: 0 }}>{item.name}</p>
                                      <p style={{ fontSize: "10px", color: "#777", fontWeight: "500", margin: "2px 0 0" }}>Qty: {item.qty} | Size: {item.selectedSize || item.size}</p>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Summary & Actions */}
                       <div style={{ flex: "1 1 180px", borderLeft: "1px solid #eee", paddingLeft: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <p style={{ fontSize: "10px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Status Date</p>
                            <p style={{ fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                            
                            <p style={{ fontSize: "10px", color: "#999", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Financial Total</p>
                            <p style={{ fontSize: "18px", fontWeight: "900", color: "#000", margin: 0 }}>₹{order.totalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          
                          <button style={{ 
                            marginTop: "15px", 
                            padding: "8px 12px", 
                            backgroundColor: "#fff", 
                            border: "1px solid #000", 
                            color: "#000", 
                            fontSize: "10px", 
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
          <div className="responsive-profile-card" style={{ background: "#fff", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: "900", margin: 0, letterSpacing: "-0.5px" }}>Saved Masterpieces</h3>
              <button 
                onClick={() => navigate("/studio")}
                style={{ background: "#d4af37", color: "#000", border: "none", fontSize: "10px", padding: "8px 14px", borderRadius: "4px", fontWeight: "800", textTransform: "uppercase", cursor: "pointer" }}
              >
                Open Studio
              </button>
            </div>

            {lookbooks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 16px", border: "1px solid #eee", borderRadius: "12px", background: "#fcfcfc" }}>
                <p style={{ color: "#999", fontSize: "13px", fontWeight: "600", margin: 0 }}>No visual compositions archived yet.</p>
              </div>
            ) : (
              <div className="responsive-lookbook-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
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