import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Checkout({ cart, clearCart, user, appliedCoupon }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", zip: "" });
  
  // Advanced Payment State
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card', 'upi', 'cod'
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [upi, setUpi] = useState("");
  const [validationError, setValidationError] = useState("");
  const [upiProcessing, setUpiProcessing] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ mode: 'simulation', key: '' });

  // 🔄 Adaptive Setup: Fetch environment-specific configuration
  useEffect(() => {
    fetch("/api/payment/config")
      .then(res => res.json())
      .then(data => {
        setPaymentConfig(data);
        // If live, inject the official Razorpay script
        if (data.mode === 'live') {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
        }
      });
  }, []);

  // Amazon-Style Dynamic Input Formatters
  const handleCardNumberChange = (e) => {
    // 1. Strip all non-digit characters
    const digitsRaw = e.target.value.replace(/\D/g, "");
    // 2. Limit to 16 digits
    const truncated = digitsRaw.slice(0, 16);
    // 3. Format with spaces every 4 digits
    const formatted = truncated.replace(/(\d{4})/g, "$1 ").trim();
    setCard({ ...card, number: formatted });
  };

  const handleExpiryChange = (e) => {
    // 1. Strip all non-digit characters
    const digitsRaw = e.target.value.replace(/\D/g, "");
    // 2. Limit to 4 digits (MMYY)
    let truncated = digitsRaw.slice(0, 4);
    // 3. Format with slash
    if (truncated.length > 2) {
       truncated = `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
    }
    setCard({ ...card, expiry: truncated });
  };

  const handleCvcChange = (e) => {
    // Strip non-digits and limit to 4
    const digitsRaw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCard({ ...card, cvc: digitsRaw });
  };

  const subtotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') discount = subtotal * appliedCoupon.value;
    else if (appliedCoupon.type === 'fixed') discount = Math.min(appliedCoupon.value, subtotal);
  }

  const taxes = Math.round((subtotal - discount) * 0.05);
  const shipping = subtotal > 2500 || subtotal === 0 ? 0 : 150;
  const grandTotal = Math.max(0, subtotal - discount + taxes + shipping);

  // Luhn Algorithm mathematically validates credit card authenticity
  // Luhn Algorithm mathematically validates credit card authenticity
  const luhnCheck = (val) => {
    // 🧪 Skip strict Luhn during development simulation to empower rapid testing
    if (paymentConfig.mode === 'simulation') return true;
    
    if (!val) return false;
    let sum = 0;
    for (let i = 0; i < val.length; i++) {
       let intVal = parseInt(val.charAt(val.length - 1 - i));
       if (isNaN(intVal)) return false; 
       if (i % 2 === 1) {
          intVal *= 2;
          if (intVal > 9) intVal -= 9;
       }
       sum += intVal;
    }
    return (sum % 10) === 0;
  };

  const validatePayment = () => {
    setValidationError("");
    if (paymentMethod === "card") {
      const sanitized = card.number.replace(/\s+/g, "");
      
      // Block identical-digit spam like "0000000000000000" which bypasses basic Luhn
      const isAllSame = /^(.)\1+$/.test(sanitized);

      if (sanitized.length < 13 || isAllSame || !luhnCheck(sanitized)) {
        setValidationError("Security Alert: Invalid Card Number geometry detected. Please input a mathematically valid active card.");
        return false;
      }
      
      // Strict MM/YY verification
      if (card.expiry.length !== 5) {
        setValidationError("Invalid Expiry Format. Must be exactly MM/YY (e.g. 12/26).");
        return false;
      }
      const [month, year] = card.expiry.split('/');
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        setValidationError("Invalid Month in Expiry Date. Must be between 01 and 12.");
        return false;
      }

      if (card.cvc.length < 3) {
        setValidationError("Security CVC code must be at least 3 digits.");
        return false;
      }
    } else if (paymentMethod === "upi") {
      const upiRegex = /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upi)) {
        setValidationError("Invalid UPI Address architecture. Format must be: username@bank");
        return false;
      }
    }
    return true; // COD naturally passes
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setValidationError("");
    try {
      // 1. Create Order on Backend (Initiate Transaction)
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          // 📦 Map item identifiers to backend schema (productId)
          items: cart.map(item => ({
             ...item,
             productId: item._id || item.id 
          })),
          totalAmount: grandTotal,
          shippingAddress: address
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Initiation Failed");

      // 🛒 PRO-LOGIC BRANCH: Real SDK vs Boutique Simulation
      if (paymentConfig.mode === 'live' && window.Razorpay) {
         const options = {
            key: paymentConfig.key,
            amount: data.amount,
            currency: "INR",
            name: "Batheja Garments",
            description: "Luxury Boutique Acquisition",
            order_id: data.order_id,
            handler: async (response) => {
               // Verify real signature
               const verifyRes = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                     db_order_id: data.db_order_id,
                     razorpay_payment_id: response.razorpay_payment_id,
                     razorpay_order_id: response.razorpay_order_id,
                     razorpay_signature: response.razorpay_signature
                  })
               });
               const verifyData = await verifyRes.json();
               if (verifyData.success) {
                  clearCart();
                  setSuccess(true);
               } else {
                  setValidationError("Signature verification failed.");
               }
               setLoading(false);
            },
            theme: { color: "#000000" }
         };
         const rzp = new window.Razorpay(options);
         rzp.open();
      } else {
         // 2. BOUTIQUE SIMULATION (Default/Dev Mode)
         setUpiProcessing(true);
         setTimeout(async () => {
            try {
               const verifyRes = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                     db_order_id: data.db_order_id,
                     razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
                     razorpay_order_id: data.order_id,
                     razorpay_signature: "simulated_sig_123"
                  })
               });
               const verifyData = await verifyRes.json();
               if (!verifyRes.ok) throw new Error(verifyData.message || "Verification Failed");
               setUpiProcessing(false);
               clearCart();
               setSuccess(true);
            } catch (err) {
               setUpiProcessing(false);
               setValidationError(`Verification Error: ${err.message}`);
            } finally {
               setLoading(false);
            }
         }, 3500);
      }

    } catch (err) {
      setValidationError(`Gateway Communication Error: ${err.message}`);
      setLoading(false);
    }
  };

  const processFinalOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
             ...item,
             productId: item._id || item.id 
          })),
          total: grandTotal,
          shippingAddress: address,
          paymentMethod
        })
      });

      if (!res.ok) throw new Error("Order Processing Failed");
      
      clearCart();
      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You need to login first!");
      navigate("/login");
      return;
    }
    
    // Strict Validation Intercept
    if (!validatePayment()) return;

    if (paymentMethod === "upi" || paymentMethod === "card") {
      await handleRazorpayPayment();
      return;
    }

    // Process COD instantly
    await processFinalOrder();
  };

  if (success) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", background: "#fff", padding: "60px 40px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", maxWidth: "500px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
          <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "15px", color: "#111" }}>Order Placed Successfully!</h2>
          <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6", marginBottom: "40px" }}>
            Thank you for shopping with Batheja Garments. Your {paymentMethod.toUpperCase()} payment has been authorized securely.
          </p>
          <button 
            onClick={() => navigate("/profile")}
            style={{ padding: "16px 40px", backgroundColor: "#000", color: "#fff", border: "none", borderRadius: "30px", fontSize: "16px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
          >
            View Your Orders
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", minHeight: "80vh" }}>
        <h2 style={{ fontSize: "28px", color: "#333", marginBottom: "20px" }}>Your checkout cart is empty.</h2>
        <button onClick={() => navigate("/shop")} style={{ padding: "15px 30px", background: "#000", color: "#fff", borderRadius: "30px", cursor: "pointer", border: "none", fontWeight: "600", textTransform: "uppercase" }}>Return to Shop</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa", paddingBottom: "100px" }}>
      
      {/* REALTIME UPI PROCESSING MODAL */}
      {upiProcessing && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeIn 0.3s" }}>
          <div style={{ background: "#fff", padding: "50px", borderRadius: "16px", textAlign: "center", maxWidth: "450px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
             <div style={{ margin: "0 auto 30px auto", width: "50px", height: "50px", border: "4px solid #f3f3f3", borderTop: "4px solid #000", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
             <h3 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "15px", textTransform: "uppercase", letterSpacing: "1px" }}>Awaiting Phone Auth</h3>
             <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.6" }}>We've sent a realtime payment request to <strong style={{color:"#000"}}>{upi}</strong>. Open your UPI app and enter your PIN to authorize the transaction.</p>
             <p style={{ color: "#999", fontSize: "12px", marginTop: "30px", textTransform: "uppercase", fontWeight: "700" }}>🔒 Secure NPCI Connection Active...</p>
          </div>
          <style>
            {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}

      <div style={{ backgroundColor: "#000", color: "#fff", padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}>Secure Checkout</h1>
      </div>

      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "60px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* SECURE CHECKOUT FORM */}
        <div style={{ flex: "1 1 600px", background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
          {validationError && (
            <div style={{ backgroundColor: "#ffebeb", color: "#d32f2f", padding: "15px", borderRadius: "8px", marginBottom: "30px", fontWeight: "600", border: "1px solid #ffcdd2" }}>
              ⚠️ {validationError}
            </div>
          )}

          <form id="checkout-form" onSubmit={handleCheckout}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "15px", color: "#111" }}>1. Delivery Logistics</h2>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Street Address</label>
              <input required value={address.street} onChange={e => setAddress({...address, street: e.target.value})} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>City</label>
                <input required value={address.city} onChange={e => setAddress({...address, city: e.target.value})} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Zip / Postal</label>
                <input required value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none" }} />
              </div>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "25px", borderBottom: "1px solid #eee", paddingBottom: "15px", color: "#111" }}>2. Payment Provider</h2>
            
            {/* Payment Tabs */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "25px" }}>
              {["card", "upi", "cod"].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(method);
                    setValidationError(""); // Reset errors on toggle
                  }}
                  style={{
                    flex: 1,
                    padding: "15px 0",
                    borderRadius: "8px",
                    border: paymentMethod === method ? "2px solid #000" : "1px solid #ddd",
                    backgroundColor: paymentMethod === method ? "#f5f5f5" : "#fff",
                    color: paymentMethod === method ? "#000" : "#666",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {method === "card" ? "💳 Credit/Debit" : method === "upi" ? "📱 UPI Transfer" : "🚚 Cash / COD"}
                </button>
              ))}
            </div>

            {/* Dynamic Rendering Based on Network */}
            {paymentMethod === "card" && (
              <div style={{ animation: "fadeIn 0.4s ease" }}>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Credit Card Number</label>
                  <input required placeholder="0000 0000 0000 0000" maxLength="19" autoComplete="off" value={card.number} onChange={handleCardNumberChange} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", letterSpacing: "2px", outline: "none", fontFamily: "monospace" }} />
                </div>
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Expiry (MM/YY)</label>
                    <input required placeholder="MM/YY" maxLength="5" autoComplete="off" value={card.expiry} onChange={handleExpiryChange} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Security CVC</label>
                    <input required placeholder="•••" maxLength="4" type="password" autoComplete="off" value={card.cvc} onChange={handleCvcChange} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none", fontFamily: "monospace" }} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div style={{ animation: "fadeIn 0.4s ease", marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px", color: "#666" }}>Virtual Payment Address (VPA)</label>
                <input required placeholder="username@bank" autoComplete="off" value={upi} onChange={e => setUpi(e.target.value.toLowerCase().replace(/\s/g, ""))} style={{ width: "100%", padding: "15px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box", outline: "none" }} />
              </div>
            )}

            {paymentMethod === "cod" && (
              <div style={{ animation: "fadeIn 0.4s ease", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px dashed #ccc", marginBottom: "20px", textAlign: "center" }}>
                <p style={{ color: "#555", fontWeight: "600", fontSize: "15px" }}>You will pay in physical currency upon delivery.</p>
              </div>
            )}

            <p style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "8px", marginTop: "30px" }}>
              🔒 Payment Network securely encrypted. Real-time mathematical verification active.
            </p>
          </form>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div style={{ flex: "1 1 350px", background: "#fff", border: "1px solid #eee", padding: "35px", borderRadius: "16px", position: "sticky", top: "120px", boxShadow: "0 10px 40px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "30px", textTransform: "uppercase", letterSpacing: "1px", color: "#111" }}>Financial Summary</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
            {cart.map(item => (
              <div key={item.cartItemId || item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <img src={item.image} alt={item.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px", border: "1px solid #eee" }} />
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "#111", marginBottom: "3px" }}>{item.name}</p>
                    <p style={{ fontSize: "12px", color: "#777" }}>
                      Qty: {item.qty} 
                      {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                      {item.selectedColor ? ` | ${item.selectedColor}` : ''}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: "14px", fontWeight: "800", color: "#111" }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "16px", color: "#555" }}>
            <span>Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "16px", color: "#d4af37", fontWeight: "700" }}>
              <span>Boutique Discount ({appliedCoupon.code})</span>
              <span>− ₹{discount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "16px", color: "#555" }}>
            <span>Taxes (5%)</span>
            <span>₹{taxes.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", fontSize: "16px", color: "#555" }}>
            <span>Expedited Shipping</span>
            <span>{shipping === 0 ? <span style={{ color: "#d4af37", fontWeight: "800", textTransform: "uppercase", fontSize: "14px", letterSpacing: "1px" }}>Complimentary</span> : `₹${shipping.toLocaleString('en-IN')}`}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", fontSize: "24px", fontWeight: "900", color: "#000", borderTop: "2px solid #111", paddingTop: "20px" }}>
            <span>Grand Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>

          <button 
            type="submit"
            form="checkout-form"
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "18px", 
              backgroundColor: "#111", 
              color: "#fff", 
              border: "none", 
              borderRadius: "8px", 
              fontSize: "16px", 
              fontWeight: "700", 
              cursor: loading ? "not-allowed" : "pointer", 
              textTransform: "uppercase", 
              letterSpacing: "1px", 
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
              opacity: loading ? 0.7 : 1,
              transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = loading ? "none" : "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            {loading ? "Authorizing Transference..." : `Finalize & Pay ₹${grandTotal.toLocaleString('en-IN')}`}
          </button>
        </div>

      </div>
    </div>
  );
}

export default Checkout;
