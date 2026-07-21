import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Cart({
  cart,
  increaseQty,
  decreaseQty,
  removeFromCart,
  savedForLater,
  saveForLater,
  moveToCart,
  removeFromSaved,
  appliedCoupon,
  setAppliedCoupon
}) {
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const VALID_COUPONS = {
    'BATHEJA10': { type: 'percentage', value: 0.1, label: 'Standard 10% Discount' },
    'WELCOME20': { type: 'percentage', value: 0.2, label: 'Welcome 20% Discount' },
    'LUXURY500': { type: 'fixed', value: 500, label: 'Flat ₹500 Discount' }
  };

  const handleApplyCoupon = () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (VALID_COUPONS[code]) {
      setAppliedCoupon({ code, ...VALID_COUPONS[code] });
      setCouponInput("");
    } else {
      setCouponError("Invalid promotional code. Please verify your credentials.");
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') discount = subtotal * appliedCoupon.value;
    else if (appliedCoupon.type === 'fixed') discount = Math.min(appliedCoupon.value, subtotal);
  }

  const taxes = (subtotal - discount) * 0.05; // 5% tax
  const shipping = subtotal > 2500 || subtotal === 0 ? 0 : 150;
  const total = Math.max(0, subtotal - discount + taxes + shipping);

  // Delivery Estimate (3-5 days from now)
  const getDeliveryDate = () => {
    const today = new Date();
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + 4);
    return delivery.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const emptyCartUI = (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "20px", color: "#111" }}>Your Atelier Bag is Empty</h2>
      <p style={{ color: "#777", marginBottom: "40px", fontSize: "18px" }}>Luxury awaits. Explore our latest acquisitions to begin your style journey.</p>
      <button
        onClick={() => navigate("/shop")}
        style={{
          padding: "18px 50px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "800",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "2px",
          transition: "all 0.3s"
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#d4af37"}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#000"}
      >
        Explore Collection
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", color: "#000", paddingBottom: "150px" }}>
      {/* Editorial Header */}
      <div style={{ padding: "60px 40px 30px", borderBottom: "1px solid #eee" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", letterSpacing: "4px", color: "var(--champagne)", textTransform: "uppercase" }}>Acquisitions Control</span>
        <h1 style={{ fontSize: "48px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", margin: "10px 0 0" }}>Shopping Bag</h1>
      </div>

      <div style={{ padding: "30px 40px", maxWidth: "1600px", margin: "0 auto" }}>
        {cart.length === 0 && savedForLater.length === 0 ? emptyCartUI : (
          <div className="responsive-cart-layout">

            {/* LEFT: CART ITEMS & SAVED SECTION */}
            <div>
              {/* Active Cart Items */}
              <div style={{ marginBottom: "60px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "30px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}>Active Ensembles ({cart.length})</h2>
                  {cart.length > 0 && <span style={{ fontSize: "12px", color: "#888" }}>Standard Delivery: {getDeliveryDate()}</span>}
                </div>

                {cart.length === 0 ? (
                  <p style={{ color: "#888", fontStyle: "italic", padding: "20px 0" }}>No active acquisitions in this session.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="responsive-cart-item">
                      {/* Image */}
                      <div style={{ height: "200px", backgroundColor: "#f9f9f9", overflow: "hidden" }}>
                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>

                      {/* Details */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "11px", fontWeight: "800", color: "var(--champagne)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>{item.category}</p>
                          <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "10px" }}>{item.name}</h3>
                          <p style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Size: <span style={{ color: "#000", fontWeight: "700" }}>{item.selectedSize || 'Standard'}</span>
                          </p>
                        </div>

                        <div style={{ display: "flex", gap: "20px" }}>
                          <button onClick={() => saveForLater(item.cartItemId)} style={{ background: "none", border: "none", padding: 0, color: "var(--champagne)", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Save</button>
                          <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: "none", border: "none", padding: 0, color: "#888", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Remove</button>
                        </div>
                      </div>

                      {/* Stepper & Price */}
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: "120px" }}>
                        <p style={{ fontSize: "22px", fontWeight: "900" }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</p>

                        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #000", borderRadius: "4px", overflow: "hidden" }}>
                          <button onClick={() => decreaseQty(item.cartItemId)} style={{ background: "#fff", border: "none", width: "35px", height: "40px", cursor: "pointer", fontSize: "16px" }}>−</button>
                          <span style={{ width: "40px", textAlign: "center", fontSize: "14px", fontWeight: "800", borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>{item.qty}</span>
                          <button onClick={() => increaseQty(item.cartItemId)} style={{ background: "#fff", border: "none", width: "35px", height: "40px", cursor: "pointer", fontSize: "16px" }}>+</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Saved For Later Section */}
              {savedForLater.length > 0 && (
                <div>
                  <h2 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "30px" }}>The Vault (Saved for Later)</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "30px" }}>
                    {savedForLater.map(item => (
                      <div key={item.cartItemId} style={{ opacity: 0.8, transition: "opacity 0.3s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>
                        <div style={{ height: "250px", backgroundColor: "#f9f9f9", overflow: "hidden", marginBottom: "15px" }}>
                          <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(30%)" }} />
                        </div>
                        <h4 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "5px" }}>{item.name}</h4>
                        <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>₹{item.price.toLocaleString('en-IN')}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button onClick={() => moveToCart(item.cartItemId)} style={{ background: "#000", color: "#fff", border: "none", padding: "10px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Move to Bag</button>
                          <button onClick={() => removeFromSaved(item.cartItemId)} style={{ background: "none", border: "1px solid #ddd", color: "#888", padding: "10px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}>Remove Forever</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: ORDER SUMMARY SIDEBAR */}
            <div style={{ position: "sticky", top: "150px" }}>
              <div style={{ backgroundColor: "#fcfcfc", border: "1px solid #eee", padding: "40px", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>Order Summary</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span style={{ color: "#666" }}>Subtotal</span>
                    <span style={{ fontWeight: "700" }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", color: "#d4af37" }}>
                      <span>Ensemble Discount</span>
                      <span>− ₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span style={{ color: "#666" }}>V.A.T (5%)</span>
                    <span style={{ fontWeight: "700" }}>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
                    <span style={{ color: "#666" }}>Atelier Shipping</span>
                    <span style={{ color: shipping === 0 ? "#2ba959" : "#000", fontWeight: "700" }}>
                      {shipping === 0 ? "Complimentary" : `₹${shipping.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                {/* Coupon Input */}
                <div style={{ marginBottom: "30px" }}>
                  <p style={{ fontSize: "10px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Promo / Member Code</p>
                  
                  {!appliedCoupon ? (
                    <>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="ENTER CODE"
                          style={{ 
                            flex: 1, padding: "12px", border: `1px solid ${couponError ? '#ff4d4d' : '#ddd'}`, 
                            fontSize: "12px", letterSpacing: "1px", outline: "none", transition: "border 0.3s" 
                          }}
                        />
                        <button
                          onClick={handleApplyCoupon}
                          style={{ background: "#000", color: "#fff", border: "none", padding: "0 20px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p style={{ fontSize: "10px", color: "#ff4d4d", marginTop: "8px", fontWeight: "700" }}>{couponError}</p>}
                    </>
                  ) : (
                    <div style={{ 
                      padding: "15px", border: "1px dashed #2ba959", backgroundColor: "#f9fffb", 
                      display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "4px" 
                    }}>
                      <div>
                        <p style={{ fontSize: "10px", color: "#2ba959", fontWeight: "900", textTransform: "uppercase", margin: 0 }}>✓ {appliedCoupon.code} ACTIVE</p>
                        <p style={{ fontSize: "11px", color: "#666", marginTop: "2px", margin: 0 }}>{appliedCoupon.label}</p>
                      </div>
                      <button 
                        onClick={() => setAppliedCoupon(null)} 
                        style={{ background: "none", border: "none", padding: 0, color: "#888", fontSize: "10px", fontWeight: "900", cursor: "pointer", textDecoration: "underline" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #000", paddingTop: "25px", marginBottom: "40px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}>Grand Total</span>
                  <span style={{ fontSize: "24px", fontWeight: "900" }}>₹{total.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={cart.length === 0}
                  style={{
                    width: "100%",
                    padding: "20px",
                    backgroundColor: cart.length === 0 ? "#ccc" : "#000",
                    color: "#fff",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: cart.length === 0 ? "not-allowed" : "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    transition: "all 0.3s"
                  }}
                  onMouseEnter={e => { if (cart.length > 0) e.currentTarget.style.backgroundColor = "#d4af37" }}
                  onMouseLeave={e => { if (cart.length > 0) e.currentTarget.style.backgroundColor = "#000" }}
                >
                  Finalize Acquisition
                </button>

                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", opacity: 0.5, filter: "grayscale(100%)" }}>
                    <span style={{ fontSize: "24px" }}>💳</span>
                    <span style={{ fontSize: "24px" }}>🏦</span>
                    <span style={{ fontSize: "24px" }}>📱</span>
                  </div>
                  <p style={{ fontSize: "10px", color: "#aaa", marginTop: "20px", letterSpacing: "1px", textTransform: "uppercase" }}>Fully Encrypted Secure Checkout</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;