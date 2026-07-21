import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function AtelierAI({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConsultation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stylist/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: user?.age || 25, gender: user?.gender || 'Other' })
      });
      if (!res.ok) throw new Error("Stylist is busy");
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("AI Stylist failed", err);
      setError("The Atelier is temporarily closed. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset suggestions when user context changes
    setSuggestions(null);
    setError(null);
  }, [user?.email]);

  useEffect(() => {
    if (isOpen && !suggestions && !loading && !error) {
      fetchConsultation();
    }
  }, [isOpen]);

  const guestMessage = "Join our elite circle for bespoke AI styling. Showing our flagship collection.";

  return (
    <>
      {/* Floating Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "#d4af37",
          color: "#000",
          border: "none",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          cursor: "pointer",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          transition: "transform 0.3s ease"
        }}
        onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}
      >
        ✨
      </button>

      {/* AI Panel */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          width: "350px",
          background: "#111",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          zIndex: 1000,
          overflow: "hidden",
          animation: "modalSlideUp 0.3s ease"
        }}>
          <div style={{ padding: "20px", background: "rgba(212, 175, 55, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", color: "#d4af37" }}>Resident Stylist</span>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>×</button>
          </div>

          <div style={{ padding: "25px", minHeight: "200px" }}>
            {loading ? (
              <p style={{ fontSize: "12px", color: "#666", textAlign: "center", marginTop: "40px" }}>Curating your bespoke look...</p>
            ) : error ? (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p style={{ fontSize: "12px", color: "#ff4d4d", marginBottom: "20px" }}>{error}</p>
                <button 
                  onClick={fetchConsultation}
                  style={{
                    background: "#d4af37",
                    color: "#000",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    cursor: "pointer"
                  }}
                >
                  Consult Stylist
                </button>
              </div>
            ) : suggestions ? (
              <div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginBottom: "20px", lineHeight: "1.6" }}>
                  "{user ? suggestions.message : guestMessage}"
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {suggestions.items.map(item => (
                    <Link 
                      key={item._id} 
                      to={`/product/${item._id}`}
                      className="shop-product-card"
                      onClick={() => setIsOpen(false)}
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "15px", 
                        padding: "10px", 
                        background: "rgba(255,255,255,0.05)", 
                        borderRadius: "8px", 
                        textDecoration: "none",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)"
                      }}
                    >
                      <img src={item.image} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "11px", fontWeight: "800", margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: "10px", color: "#d4af37", fontWeight: "700", margin: 0 }}>₹{item.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p style={{ color: "#444", fontSize: "11px", marginBottom: "20px" }}>The Atelier is ready for your consultation.</p>
                <button 
                  onClick={fetchConsultation}
                  style={{
                    background: "none",
                    color: "#d4af37",
                    border: "1px solid #d4af37",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    cursor: "pointer"
                  }}
                >
                  Start Consultation
                </button>
              </div>
            )}
          </div>
          <div style={{ padding: "15px 25px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0c0c0c" }}>
             <p style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "1px", margin: 0 }}>Powered by Belvedere AI Engine</p>
          </div>
        </div>
      )}
    </>
  );
}

export default AtelierAI;
