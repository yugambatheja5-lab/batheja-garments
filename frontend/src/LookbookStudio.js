import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

function LookbookStudio({ user }) {
  const [products, setProducts] = useState([]);
  const [lookItems, setLookItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookName, setLookName] = useState("Untitled Masterpiece");
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data.filter(p => p.stock > 0));
        setLoading(false);
      });
  }, []);

  const addToCanvas = (product) => {
    const newItem = {
      id: Date.now(),
      productId: product._id,
      image: product.image,
      name: product.name,
      x: 100 + (lookItems.length * 20),
      y: 100 + (lookItems.length * 20),
      scale: 1,
      zIndex: lookItems.length + 1
    };
    setLookItems([...lookItems, newItem]);
    setSelectedId(newItem.id);
  };

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setSelectedId(id);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || selectedId === null) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    setLookItems(items => items.map(item => 
      item.id === selectedId ? { ...item, x, y } : item
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateItem = (updates) => {
    setLookItems(items => items.map(item => 
      item.id === selectedId ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (id) => {
    setLookItems(items => items.filter(item => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const bringToFront = () => {
    const maxZ = Math.max(...lookItems.map(i => i.zIndex), 0);
    updateItem({ zIndex: maxZ + 1 });
  };

  const saveLook = async () => {
    console.log("💾 Attempting to archive masterpiece...", { user, lookName, itemsCount: lookItems.length });
    if (!user) {
      console.warn("⚠️ Save aborted: No user context found.");
      if (window.confirm("Bespoke archiving is reserved for our elite circle. Would you like to join the atelier now?")) {
        navigate("/login");
      }
      return;
    }
    setSaving(true);
    try {
      console.log("📤 Sending payload to atelier floor...");
      const userId = user._id || user.id;
      const res = await fetch("/api/lookbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: userId,
          name: lookName,
          items: lookItems
        })
      });
      if (res.ok) {
        console.log("✅ Masterpiece archived successfully!");
        alert("Your masterpiece has been archived in the atelier.");
        navigate("/profile");
      } else {
        let errData = { error: "Unrecognized response" };
        try { errData = await res.json(); } catch (e) { /* ignore parse error */ }
        console.error("❌ Atelier rejected the masterpiece:", errData);
        alert("The atelier was unable to archive this piece: " + (errData.error || "Unknown server error"));
      }
    } catch (err) {
      console.error("🔥 Critical failure during archiving:", err);
      alert(`A critical failure occurred while communicating with the atelier.\n\nDetails: ${err.message || 'Network Disruption'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ height: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37" }}>Initializing Studio...</div>;

  const selectedItem = lookItems.find(i => i.id === selectedId);

  return (
    <div style={{ 
      height: "calc(100vh - 80px)", 
      display: "flex", 
      background: "#050505", 
      color: "#fff",
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* 🧥 Wardrobe Sidebar */}
      <div style={{ 
        width: "300px", 
        borderRight: "1px solid rgba(255,255,255,0.05)", 
        display: "flex", 
        flexDirection: "column",
        background: "#080808"
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", color: "#d4af37", margin: 0 }}>The Wardrobe</h2>
          <p style={{ fontSize: "10px", color: "#666", marginTop: "5px" }}>Drag or click to add pieces</p>
        </div>
        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "15px", 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "10px" 
        }} className="no-scrollbar">
          {products.map(product => (
            <div 
              key={product._id} 
              className="shop-product-card"
              onClick={() => addToCanvas(product)}
              style={{ 
                background: "rgba(255,255,255,0.04)", 
                borderRadius: "8px", 
                padding: "8px", 
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <img src={product.image} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "4px" }} />
              <p style={{ fontSize: "9px", fontWeight: "700", marginTop: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🏛️ The Studio Floor */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          right: 0, 
          padding: "20px 40px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "linear-gradient(to bottom, rgba(5,5,5,0.9), transparent)",
          zIndex: 100
        }}>
          <input 
            value={lookName} 
            onChange={(e) => setLookName(e.target.value)}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#fff", 
              fontSize: "20px", 
              fontWeight: "300", 
              letterSpacing: "1px",
              width: "300px",
              outline: "none",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}
          />
          <button 
            onClick={saveLook}
            disabled={saving || lookItems.length === 0}
            style={{
              background: !user ? "rgba(255,255,255,0.05)" : "#d4af37",
              color: !user ? "#666" : "#000",
              border: !user ? "1px solid rgba(255,255,255,0.1)" : "none",
              padding: "12px 30px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              opacity: (saving || lookItems.length === 0) ? 0.5 : 1,
              transition: "all 0.3s"
            }}
          >
            {saving ? "Archiving..." : !user ? "Login to Archive" : "Save Masterpiece"}
          </button>
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            width: "100%", 
            height: "100%", 
            background: "radial-gradient(circle at 50% 50%, #151515 0%, #050505 100%)",
            position: "relative"
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Grid effect */}
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            opacity: 0.1, 
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", 
            backgroundSize: "40px 40px" 
          }} />

          {lookItems.map(item => (
            <div
              key={item.id}
              onMouseDown={(e) => handleMouseDown(e, item.id)}
              style={{
                position: "absolute",
                left: item.x,
                top: item.y,
                transform: `translate(-50%, -50%) scale(${item.scale})`,
                zIndex: item.zIndex,
                cursor: isDragging && selectedId === item.id ? "grabbing" : "grab",
                border: selectedId === item.id ? "1px solid #d4af37" : "1px solid transparent",
                padding: "2px",
                boxShadow: selectedId === item.id ? "0 0 20px rgba(212,175,55,0.2)" : "none",
                transition: "border 0.2s"
              }}
            >
              <img 
                src={item.image} 
                alt="" 
                style={{ width: "200px", height: "auto", display: "block", pointerEvents: "none" }} 
              />
              {selectedId === item.id && (
                <div 
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  style={{ 
                    position: "absolute", 
                    top: "-10px", 
                    right: "-10px", 
                    width: "20px", 
                    height: "20px", 
                    background: "#ff4444", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >×</div>
              )}
            </div>
          ))}

          {lookItems.length === 0 && (
            <div style={{ 
              position: "absolute", 
              top: "50%", 
              left: "50%", 
              transform: "translate(-50%, -50%)",
              textAlign: "center"
            }}>
              <p style={{ fontSize: "24px", fontWeight: "200", color: "#333", letterSpacing: "8px", textTransform: "uppercase" }}>The Atelier Floor</p>
              <p style={{ fontSize: "12px", color: "#222", marginTop: "10px" }}>Add pieces from your wardrobe to begin</p>
            </div>
          )}
        </div>

        {/* Selected Item Controls */}
        {selectedItem && (
          <div style={{ 
            position: "absolute", 
            bottom: "40px", 
            left: "50%", 
            transform: "translateX(-50%)",
            background: "rgba(10,10,10,0.95)",
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "10px 20px",
            borderRadius: "40px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            zIndex: 200
          }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#d4af37", margin: 0, borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: "15px" }}>{selectedItem.name}</p>
            
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={() => updateItem({ scale: Math.max(0.5, selectedItem.scale - 0.1) })}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}
              >−</button>
              <span style={{ fontSize: "10px", width: "40px", textAlign: "center" }}>Scale: {selectedItem.scale.toFixed(1)}x</span>
              <button 
                onClick={() => updateItem({ scale: Math.min(2, selectedItem.scale + 0.1) })}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}
              >+</button>
            </div>

            <button 
              onClick={bringToFront}
              style={{ 
                background: "rgba(255,255,255,0.05)", 
                border: "none", 
                color: "#fff", 
                fontSize: "10px", 
                padding: "6px 12px", 
                borderRadius: "4px",
                cursor: "pointer",
                textTransform: "uppercase",
                fontWeight: "700"
              }}
            >Bring to Front</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LookbookStudio;
