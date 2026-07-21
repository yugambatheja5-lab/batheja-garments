import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { triggerCartAnimation, triggerFavoriteAnimation } from "./utils/animations";

function Shop({ products = [], isLoading, addToCart, clearCart, favorites, toggleFavorite }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [maxPrice, setMaxPrice] = useState(25000);

  useEffect(() => {
    if (location.state?.department) {
      setSelectedDepartment(location.state.department);
      setSelectedCategory("All");
      setSearch("");
    }
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
      setSearch("");
    }
    if (location.state?.searchKey) {
      setSearch(location.state.searchKey);
      setSelectedCategory("All");
      setSelectedDepartment("All");
    }
  }, [location.state]);

  const categories = useMemo(() => 
    ["All", ...new Set(products.map(p => p.category))],
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesDept = selectedDepartment === "All" || p.department === selectedDepartment;
      const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchesPrice = p.price <= maxPrice;
      const matchesSearch = !search || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.category.toLowerCase().includes(search.toLowerCase());

      return matchesDept && matchesCat && matchesPrice && matchesSearch;
    });
  }, [products, selectedDepartment, selectedCategory, maxPrice, search]);

  const [isFilterMobileOpen, setIsFilterMobileOpen] = useState(false);

  const Sidebar = () => (
    <div className="responsive-shop-sidebar" style={{ width: "320px", position: "sticky", top: "150px", height: "fit-content", paddingRight: "50px", borderRight: "1px solid #eee" }}>
      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "4px", color: "var(--text-main)", textTransform: "uppercase", marginBottom: "20px" }}>Showroom Categories</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => { setSelectedCategory(cat); setIsFilterMobileOpen(false); }}
              style={{
                textAlign: "left",
                padding: "10px 0",
                background: "none",
                border: "none",
                fontSize: "14px",
                fontWeight: cat === selectedCategory ? "900" : "500",
                color: cat === selectedCategory ? "var(--text-main)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.4s",
                borderLeft: cat === selectedCategory ? "4px solid #000" : "4px solid transparent",
                paddingLeft: cat === selectedCategory ? "15px" : "0"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "4px", color: "var(--text-main)", textTransform: "uppercase", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
          <span>Acquisition Budget</span>
          <span style={{ color: "var(--text-accent)", fontWeight: "900" }}>₹{maxPrice.toLocaleString('en-IN')}</span>
        </p>
        <input 
          type="range" 
          min="0" 
          max="25000" 
          step="500" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          style={{ width: "100%", accentColor: "#000", height: "3px" }}
        />
      </div>

      <div style={{ position: "relative" }}>
         <input 
            placeholder="Search The Store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
               width: "100%",
               padding: "14px 0",
               background: "none",
               border: "none",
               borderBottom: "2px solid #eee",
               fontSize: "14px",
               fontWeight: "700",
               outline: "none",
               letterSpacing: "0.5px",
               color: "var(--text-main)"
            }}
         />
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", paddingBottom: "150px", color: "var(--text-main)" }}>
      
      {/* Editorial Header */}
      <div style={{ padding: "60px 5% 30px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "8px", color: "var(--text-accent)", textTransform: "uppercase", display: "block", marginBottom: "15px" }}>Est. 1994</span>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "900", letterSpacing: "4px", textTransform: "uppercase", margin: 0, color: "var(--text-main)" }}>The Collection</h1>
        <div style={{ marginTop: "15px", width: "60px", height: "2px", backgroundColor: "#000", margin: "15px auto" }}></div>
        <p style={{ fontSize: "12px", letterSpacing: "3px", color: "var(--text-muted)", textTransform: "uppercase" }}>High-Fidelity {selectedDepartment} Selection — {filtered.length} Specimens Available</p>
        
        {/* Mobile Filter Toggle Button */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
          <button 
            className="mobile-filter-btn"
            onClick={() => setIsFilterMobileOpen(!isFilterMobileOpen)}
            style={{
              padding: "10px 24px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: "30px",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer"
            }}
          >
            {isFilterMobileOpen ? "Hide Filters ▲" : "Filters & Refine ⚙️"}
          </button>
        </div>
      </div>

      {/* Category Quick-Links (Chips) */}
      <div style={{ 
        padding: "0 5% 30px", 
        display: "flex", 
        gap: "12px", 
        overflowX: "auto", 
        whiteSpace: "nowrap",
        scrollbarWidth: "none",
        borderBottom: "1px solid #f9f9f9"
      }} className="no-scrollbar">
        {["All", "New Arrivals", "Dresses", "Tops", "Outerwear", "Bottoms", "Silk Series", "Vault"].map(chip => (
          <button
            key={chip}
            onClick={() => setSelectedCategory(chip === "All" ? "All" : chip)}
            style={{
              padding: "10px 24px",
              background: selectedCategory === chip ? "#000" : "#f9f9f9",
              color: selectedCategory === chip ? "#fff" : "#000",
              border: "1px solid #eee",
              borderRadius: "40px",
              fontSize: "11px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "2px",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.2, 1, 0.3, 1)"
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="responsive-shop-layout">
        {/* Render Sidebar desktop or if mobile toggle is active */}
        {(window.innerWidth > 860 || isFilterMobileOpen) && <Sidebar />}

        <div style={{ flex: 1 }}>
          {isLoading ? (
             <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <h2 style={{ letterSpacing: "6px", fontWeight: "300", color: "#ccc", fontSize: "18px" }}>COMMUNICATING WITH ATELIER...</h2>
             </div>
          ) : filtered.length === 0 ? (
             <div style={{ textAlign: "center", padding: "100px 20px" }}>
                <h2 style={{ color: "var(--text-muted)", fontWeight: "300", letterSpacing: "2px", fontSize: "18px" }}>No specimens match your current acquisition criteria.</h2>
                <button onClick={() => { setSelectedDepartment("All"); setSelectedCategory("All"); setMaxPrice(25000); setSearch(""); }} style={{ marginTop: "30px", padding: "16px 40px", background: "#000", color: "#fff", border: "none", borderRadius: "1px", fontWeight: "900", cursor: "pointer", letterSpacing: "3px", textTransform: "uppercase", fontSize: "11px" }}>Restore Collection</button>
             </div>
          ) : (
            <div className="responsive-product-grid">
              {filtered.map(p => {
                const pid = p._id || p.id;
                const isFav = favorites.some(item => (item._id || item.id) === pid);
                return (
                  <div 
                    key={pid} 
                    className="shop-product-card"
                    style={{ 
                      cursor: "pointer",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #f0f0f0"
                    }}
                    onClick={() => navigate(`/product/${pid}`)}
                  >
                    {/* Favorite Heart */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        toggleFavorite(p); 
                        if(!isFav) triggerFavoriteAnimation(e); 
                      }} 
                      style={{ position: "absolute", top: "15px", right: "15px", background: "rgba(255,255,255,0.95)", border: "none", borderRadius: "50%", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 10, cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "18px", color: isFav ? "#ff4d4d" : "#ddd" }}>{isFav ? "❤️" : "🤍"}</span>
                    </button>

                    {/* Image Area with Cursor-Follow Zoom */}
                    <div 
                      className="responsive-product-card-img" 
                      style={{ height: "450px", overflow: "hidden", backgroundColor: "#fcfcfc", marginBottom: "20px", border: "1px solid #f9f9f9", position: "relative" }}
                      onMouseMove={(e) => {
                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - left) / width) * 100;
                        const y = ((e.clientY - top) / height) * 100;
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transformOrigin = `${x}% ${y}%`;
                      }}
                      onMouseLeave={(e) => {
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transformOrigin = "center center";
                      }}
                    >
                      <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    {/* Product Metadata */}
                    <div style={{ padding: "0 5px" }}>
                      <p style={{ margin: "0 0 10px 0", fontSize: "11px", fontWeight: "900", color: "var(--text-accent)", textTransform: "uppercase", letterSpacing: "3px" }}>{p.category}</p>
                      <h3 style={{ margin: "0 0 15px 0", fontSize: "22px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "0.5px" }}>{p.name}</h3>
                      <p style={{ margin: "0 0 35px 0", fontSize: "24px", fontWeight: "900", color: "var(--text-main)" }}>₹{p.price.toLocaleString('en-IN')}</p>
                      
                      {/* Action Grid */}
                      <div style={{ display: "flex", gap: "10px" }}>
                         <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             addToCart(p); 
                             triggerCartAnimation(e, p.image); 
                           }}
                           style={{ flex: 1, padding: "16px 0", background: "none", border: "1px solid rgba(0,0,0,0.15)", fontSize: "11px", fontWeight: "900", letterSpacing: "2px", cursor: "pointer", transition: "all 0.4s", textTransform: "uppercase", color: "var(--text-main)" }}
                           onMouseEnter={e => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
                           onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-main)"; }}
                         >
                           + Bag
                         </button>
                         <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             clearCart(); 
                             addToCart(p); 
                             navigate("/checkout");
                           }}
                           style={{ flex: 1, padding: "16px 0", background: "#000", color: "#fff", border: "none", fontSize: "11px", fontWeight: "900", letterSpacing: "2px", cursor: "pointer", transition: "all 0.4s", textTransform: "uppercase" }}
                           onMouseEnter={e => e.currentTarget.style.background = "var(--champagne)"}
                           onMouseLeave={e => e.currentTarget.style.background = "#000"}
                         >
                           Buy Now
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Shop;