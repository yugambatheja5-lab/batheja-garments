import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";

import Home from "./Home";
import "./responsive.css";
import Shop from "./Shop";
import Cart from "./Cart";
import ProductDetail from "./ProductDetail";
import Favorites from "./Favorites";
import Login from "./Login";
import Signup from "./Signup";
import Profile from "./Profile";
import Checkout from "./Checkout";
import AdminDashboard from "./AdminDashboard";
import ForgotPassword from "./ForgotPassword";
import HelpCentre from "./HelpCentre";
import AtelierAI from "./components/AtelierAI";
import SearchOverlay from "./components/SearchOverlay";
import HelpCorner from "./components/HelpCorner";
import { products as fallbackProducts } from "./data/products";

// --- Sub-components extracted to prevent re-creation on App render ---

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const NavLinkDropdown = ({ label, targetKey, productsList, linkStyle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  
  const departmentProducts = useMemo(() => 
    productsList.filter(p => p.department === targetKey),
    [productsList, targetKey]
  );
  
  const categories = useMemo(() => 
    [...new Set(departmentProducts.map(p => p.category))],
    [departmentProducts]
  );
  
  const isActive = location.state?.department === targetKey;

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: "flex", alignItems: "center", position: "relative" }}
    >
      <Link 
        to="/shop" 
        state={{ department: targetKey }}
        style={linkStyle}
        className={`nav-btn-scale nav-pill ${isActive ? 'nav-active' : ''}`}
        onMouseEnter={(e) => {e.currentTarget.style.color = "var(--champagne)"}} 
        onMouseLeave={(e) => {e.currentTarget.style.color = isActive ? "var(--champagne)" : "var(--text-main-inv)"}}
      >
        {label}
      </Link>
      
      <div style={{
        position: "fixed",
        top: "100px",
        left: 0,
        right: 0,
        opacity: isHovered ? 1 : 0,
        visibility: isHovered ? "visible" : "hidden",
        transform: `translateY(${isHovered ? '0' : '20px'})`,
        transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        backgroundColor: "#fff",
        borderTop: "1px solid #eee",
        boxShadow: "0 50px 100px rgba(0,0,0,0.15)",
        padding: "60px 10%",
        display: "grid",
        gridTemplateColumns: "1fr 3fr",
        gap: "80px",
        zIndex: 999,
        willChange: "transform, opacity"
      }}>
        <div style={{ borderRight: "1px solid #eee", paddingRight: "60px" }}>
          <h3 style={{ margin: 0, fontSize: "42px", fontWeight: "900", letterSpacing: "6px", textTransform: "uppercase" }}>{label}</h3>
          <p style={{ marginTop: "20px", fontSize: "14px", color: "var(--text-muted)", lineHeight: "1.8" }}>
             The absolute pinnacle of luxury. Expertly tailored specimens for the elite {label.toLowerCase()} wardrobe.
          </p>
          <Link to="/shop" state={{ department: targetKey }} onClick={() => setIsHovered(false)} style={{ marginTop: "40px", display: "inline-block", textDecoration: "none" }}>
            <span style={{ fontWeight: "900", textTransform: "uppercase", fontSize: "12px", letterSpacing: "3px", color: "#000", border: "1px solid #000", padding: "15px 35px", borderRadius: "1px" }}>
              Explore Entire Series
            </span>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px" }}>
          {categories.slice(0, 4).map(cat => {
            const repProduct = departmentProducts.find(p => p.category === cat);
            return (
              <Link 
                key={cat} 
                to="/shop" 
                state={{ department: targetKey, category: cat }}
                onClick={() => setIsHovered(false)}
                style={{ textDecoration: "none", color: "#000", group: "true" }}
              >
                <div style={{ height: "220px", width: "100%", overflow: "hidden", backgroundColor: "#f9f9f9" }}>
                  <img src={repProduct?.image} alt={cat} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s ease" }} onMouseEnter={e => e.target.style.transform = "scale(1.1)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                </div>
                <div style={{ paddingTop: "15px", textAlign: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}>{cat}</h4>
                  <p style={{ margin: "5px 0 0", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Discovery Collection</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(x => x);
  if (location.pathname === "/") return null;

  return (
    <div className="breadcrumbs-container" style={{ padding: "16px 40px", backgroundColor: "#fcfcfc", borderBottom: "1px solid #eee", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-muted)", overflowX: "auto", whiteSpace: "nowrap" }}>
      <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        return (
          <span key={name}>
            <span style={{ margin: "0 10px", opacity: 0.5 }}>/</span>
            {isLast ? (
              <span style={{ color: "#000" }}>{name.replace(/-/g, " ")}</span>
            ) : (
              <Link to={routeTo} style={{ color: "inherit", textDecoration: "none" }}>{name.replace(/-/g, " ")}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

const CartPreview = ({ cart, linkStyle, bubbleStyle }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const subtotal = useMemo(() => cart.reduce((t, i) => t + (i.price * i.qty), 0), [cart]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <Link to="/cart" style={{ ...linkStyle, fontSize: "12px", padding: "8px 12px" }} className="nav-pill">
         <span id="nav-cart-icon" style={{ fontSize: "20px" }}>👜</span>
         <span className="cart-text-label" style={{ display: "none" }}>Cart</span>
         <span style={bubbleStyle}>{cart.reduce((t, i) => t + i.qty, 0)}</span>
      </Link>
      
      {isHovered && cart.length > 0 && (
        <div className="cart-preview-popover">
          <p style={{ margin: "0 0 20px 0", fontSize: "12px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb", paddingBottom: "15px", color: "#111827" }}>Cart Preview</p>
          <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
            {cart.slice(0, 3).map(item => (
              <div key={item.cartItemId} style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                <img src={item.image} alt="" style={{ width: "60px", height: "80px", objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#111827", lineHeight: "1.35" }}>{item.name}</p>
                  <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#374151", fontWeight: "600" }}>Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
            {cart.length > 3 && <p style={{ fontSize: "11px", textAlign: "center", color: "#6b7280" }}>+ {cart.length - 3} more items</p>}
          </div>
          <div style={{ borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontWeight: "700", fontSize: "12px", color: "#111827" }}>SUBTOTAL</span>
              <span style={{ fontWeight: "900", fontSize: "15px", color: "#111827" }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <button onClick={() => navigate("/cart")} style={{ width: "100%", padding: "15px", backgroundColor: "#000", color: "#fff", border: "none", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer" }}>Check Out</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Constant Styles moved out of component to prevent re-definitions ---
const linkStyle = {
  color: "var(--text-main-inv)",
  textDecoration: "none",
  fontWeight: "800",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "3px",
  padding: "10px 18px",
  transition: "color 0.3s ease",
  cursor: "pointer",
  background: "rgba(255,255,255,0.04)",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const bubbleStyle = {
  background: "#d4a656",
  color: "#131921",
  fontSize: "11px",
  minWidth: "20px",
  height: "20px",
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
  marginLeft: "4px"
};

const AppLayout = ({ 
  productsList, isLoading, user, setUser, 
  cart, addToCart, increaseQty, decreaseQty, removeFromCart, 
  favorites, toggleFavorite, 
  savedForLater, saveForLater, moveToCart, removeFromSaved, clearCart,
  appliedCoupon, setAppliedCoupon,
  isSearchOpen, setIsSearchOpen, showBackToTop, fetchProducts 
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="main-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "20px",
              padding: "5px 10px",
              cursor: "pointer"
            }}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="BELVEDERE" className="brand-logo-img" />
            <span className="brand-logo-text">BELVEDERE</span>
          </Link>
        </div>

        <div className="desktop-nav-links" style={{ marginLeft: "30px" }}>
          <NavLinkDropdown label="Men" targetKey="Men" productsList={productsList} linkStyle={linkStyle} />
          <NavLinkDropdown label="Women" targetKey="Women" productsList={productsList} linkStyle={linkStyle} />
          <NavLinkDropdown label="Kids" targetKey="Kids" productsList={productsList} linkStyle={linkStyle} />
          
          <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.2)", margin: "0 10px" }} />
          
          <Link to="/shop" style={{ ...linkStyle, color: location.pathname === "/shop" ? "var(--champagne)" : "var(--text-main-inv)" }} className={`nav-pill ${location.pathname === "/shop" ? "nav-active" : ""}`}>Collection</Link>
          
          {user?.role === "admin" && (
            <Link to="/admin" style={{ ...linkStyle, color: "var(--champagne)" }} className="nav-pill">
               <span style={{ fontSize: "18px" }}>🛡️</span>
               <span>Atelier HQ</span>
            </Link>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>

          <button 
            onClick={() => setIsSearchOpen(true)}
            style={{ ...linkStyle, fontSize: "12px", border: "none", background: "none", padding: "8px" }}
            aria-label="Search"
          >
             <span style={{ fontSize: "18px" }}>🔍</span>
          </button>

          <Link to="/favorites" style={{ ...linkStyle, fontSize: "12px", padding: "8px 10px" }} className="nav-pill" aria-label="Favorites">
             <span id="nav-fav-icon" style={{ fontSize: "18px" }}>❤️</span>
             {favorites.length > 0 && <span style={{ ...bubbleStyle, background: "#ff4d4d" }}>{favorites.length}</span>}
          </Link>

          {user ? (
            <Link to="/profile" style={{ ...linkStyle, fontSize: "12px", padding: "8px 10px", color: location.pathname === "/profile" ? "var(--champagne)" : "var(--text-main-inv)" }} className={`nav-pill ${location.pathname === "/profile" ? "nav-active" : ""}`} aria-label="Profile">
               <span style={{ fontSize: "18px" }}>👤</span>
            </Link>
          ) : (
            <Link to="/login" style={{ ...linkStyle, color: location.pathname === "/login" ? "var(--champagne)" : "var(--text-main-inv)", padding: "6px 12px", fontSize: "11px" }} className={`nav-pill ${location.pathname === "/login" ? "nav-active" : ""}`}>Login</Link>
          )}

          <CartPreview cart={cart} linkStyle={linkStyle} bubbleStyle={bubbleStyle} />
        </div>
      </nav>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-drawer">
          <Link to="/shop" state={{ department: 'Men' }} onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "16px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>MEN'S COLLECTION</Link>
          <Link to="/shop" state={{ department: 'Women' }} onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "16px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>WOMEN'S COLLECTION</Link>
          <Link to="/shop" state={{ department: 'Kids' }} onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "16px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>KIDS COLLECTION</Link>
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)", margin: "5px 0" }} />
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--champagne)", textDecoration: "none", fontSize: "15px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>ALL MASTERPIECES</Link>
          <Link to="/favorites" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "700" }}>FAVORITES ({favorites.length})</Link>
          <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "700" }}>BAG ({cart.length})</Link>
          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "700" }}>MY PROFILE</Link>
          <Link to="/help" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "#aaa", textDecoration: "none", fontSize: "14px" }}>HELP & SUPPORT</Link>
        </div>
      )}

      <Breadcrumbs />

      <Routes>
        <Route path="/" element={<Home products={productsList} isLoading={isLoading} addToCart={addToCart} clearCart={clearCart} favorites={favorites} toggleFavorite={toggleFavorite} user={user} openSearch={() => setIsSearchOpen(true)} />} />
        <Route path="/shop" element={<Shop products={productsList} isLoading={isLoading} addToCart={addToCart} clearCart={clearCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/product/:id" element={<ProductDetail allProducts={productsList} addToCart={addToCart} clearCart={clearCart} favorites={favorites} toggleFavorite={toggleFavorite} />} />
        <Route path="/favorites" element={<Favorites favorites={favorites} toggleFavorite={toggleFavorite} addToCart={addToCart} clearCart={clearCart} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
        <Route path="/admin" element={<AdminDashboard user={user} fetchProducts={fetchProducts} />} />
        <Route path="/cart" element={
          <Cart 
            cart={cart} 
            increaseQty={increaseQty} 
            decreaseQty={decreaseQty} 
            removeFromCart={removeFromCart}
            savedForLater={savedForLater}
            saveForLater={saveForLater}
            moveToCart={moveToCart}
            removeFromSaved={removeFromSaved}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
          />
        } />
        <Route path="/checkout" element={
          <Checkout cart={cart} clearCart={clearCart} user={user} appliedCoupon={appliedCoupon} />
        } />
        <Route path="/help" element={<HelpCentre />} />
      </Routes>

      <AtelierAI user={user} fetchProducts={fetchProducts} />
      
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        products={productsList} 
      />

      <div 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span style={{ fontSize: "24px" }}>↑</span>
      </div>

      <HelpCorner />

      <footer style={{ background: "#131921", padding: "50px 5%", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "60px" }}>
        <div className="responsive-footer-grid">
          <div>
            <h3 style={{ fontSize: "22px", fontWeight: "900", letterSpacing: "5px", color: "#fff", marginBottom: "20px" }}>BELVEDERE</h3>
            <p style={{ color: "#888", lineHeight: "1.6", maxWidth: "300px", fontSize: "13px" }}>Architecting the future of high-fidelity acquisition journeys for the modern icon.</p>
          </div>
          <div>
             <p style={{ fontSize: "12px", fontWeight: "900", color: "#d4af37", letterSpacing: "3px", marginBottom: "15px", textTransform: "uppercase" }}>Collections</p>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               <Link to="/shop" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Masterpieces</Link>
               <Link to="/shop" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>The Vault</Link>
               <Link to="/shop" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>New Arrivals</Link>
             </div>
          </div>
          <div>
             <p style={{ fontSize: "12px", fontWeight: "900", color: "#d4af37", letterSpacing: "3px", marginBottom: "15px", textTransform: "uppercase" }}>Acquisition</p>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               <Link to="/help" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Shipping Guide</Link>
               <Link to="/help" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Masterpiece Return</Link>
               <Link to="/help" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Consultation</Link>
             </div>
          </div>
          <div>
             <p style={{ fontSize: "12px", fontWeight: "900", color: "#d4af37", letterSpacing: "3px", marginBottom: "15px", textTransform: "uppercase" }}>Support</p>
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               <Link to="/help" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Help Centre</Link>
               <Link to="/profile" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Order Status</Link>
               <Link to="/help" style={{ color: "#aaa", textDecoration: "none", fontSize: "13px" }}>Contact Atelier</Link>
             </div>
          </div>
        </div>
        <div style={{ marginTop: "50px", paddingTop: "25px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", color: "#666", fontSize: "10px", fontWeight: "800", letterSpacing: "2px" }}>
          © 2026 BATHEJA GARMENTS | PRIVACY • TERMS • SECURITY
        </div>
      </footer>
    </>
  );
};

function App() {
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [user, setUser] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Optimized Throttled Scroll Listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBackToTop(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProductsList(data);
          return;
        }
      }
    } catch (err) {
      console.error("Central Discovery Failed, using static catalog:", err);
    }
    setProductsList(fallbackProducts);
  }, []);

  useEffect(() => {
    // Centralized Data Acquisition
    setIsLoading(true);
    fetchProducts().finally(() => setIsLoading(false));

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setUser(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((product) => {
    const pid = product._id || product.id;
    setFavorites(prev => {
      const exists = prev.find(item => (item._id || item.id) === pid);
      if (exists) return prev.filter(item => (item._id || item.id) !== pid);
      return [...prev, product];
    });
  }, []);

  const addToCart = useCallback((product) => {
    const pid = product._id || product.id;
    const cartItemId = `${pid}-${product.selectedSize || 'N/A'}-${product.selectedColor || 'N/A'}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, cartItemId, qty: 1 }];
    });
  }, []);

  const increaseQty = useCallback((cartItemId) => {
    setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item));
  }, []);

  const decreaseQty = useCallback((cartItemId) => {
    setCart(prev => prev.map(item => item.cartItemId === cartItemId && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(item => item.cartItemId !== id && item.id !== id));
  }, []);
  
  const saveForLater = useCallback((id) => {
    setCart(prev => {
      const item = prev.find(i => i.cartItemId === id);
      if (item) setSavedForLater(s => [...s, item]);
      return prev.filter(i => i.cartItemId !== id);
    });
  }, []);

  const moveToCart = useCallback((id) => {
    setSavedForLater(prev => {
      const item = prev.find(i => i.cartItemId === id);
      if (item) setCart(c => [...c, item]);
      return prev.filter(i => i.cartItemId !== id);
    });
  }, []);

  const removeFromSaved = useCallback((id) => {
    setSavedForLater(prev => prev.filter(item => item.cartItemId !== id));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AppLayout 
        productsList={productsList}
        isLoading={isLoading}
        user={user}
        setUser={setUser}
        cart={cart}
        addToCart={addToCart}
        increaseQty={increaseQty}
        decreaseQty={decreaseQty}
        removeFromCart={removeFromCart}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        savedForLater={savedForLater}
        saveForLater={saveForLater}
        moveToCart={moveToCart}
        removeFromSaved={removeFromSaved}
        clearCart={clearCart}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        showBackToTop={showBackToTop}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
      />
    </Router>
  );
}

export default App;