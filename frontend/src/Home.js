import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import heroImg from './assets/hero.png';
import { triggerCartAnimation, triggerFavoriteAnimation } from "./utils/animations";

// Luxury Boutique Section Component
const ProductCard = ({ product, favorites, toggleFavorite, addToCart, clearCart, navigate, style = {} }) => {
  const [isHovered, setIsHovered] = useState(false);
  const pid = product._id || product.id;
  const isFav = favorites && favorites.some(item => (item._id || item.id) === pid);

  return (
    <div 
      className="shop-product-card"
      style={{ display: "flex", flexDirection: "column", position: "relative", cursor: "pointer", borderRadius: "12px", overflow: "hidden", ...style }}
      onClick={() => navigate(`/product/${pid}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="product-card-container"
        style={{ 
          height: style.height || "480px", 
          width: "100%", 
          overflow: "hidden", 
          backgroundColor: "#0a0a0a", 
          position: "relative", 
          border: "1px solid rgba(255,255,255,0.05)" 
        }}
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
          {/* Heart Toggle */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              toggleFavorite(product); 
              if(!isFav) triggerFavoriteAnimation(e);
            }}
            style={{
              position: "absolute", top: "25px", right: "25px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 12, transition: "all 0.3s ease", color: isFav ? "#ff4d4d" : "#fff", fontSize: "20px"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          >
            {isFav ? '❤️' : '🤍'}
          </button>

          <img className="luxury-img" src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          
          <div className="cart-btn-grid" style={{ 
            position: "absolute", 
            bottom: "20px", 
            left: "50%", 
            transform: `translate(-50%, ${isHovered ? '0' : '15px'})`, 
            width: "92%", 
            opacity: isHovered ? 1 : 0, 
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", 
            zIndex: 10, 
            display: "flex", 
            flexDirection: "row", 
            gap: "8px" 
          }}>
            <button onClick={(e) => { e.stopPropagation(); addToCart(product); triggerCartAnimation(e, product.image); }} style={{ flex: 1, padding: "14px 0", backgroundColor: "rgba(255,255,255,0.9)", color: "#000", border: "none", fontWeight: "900", textTransform: "uppercase", fontSize: "10px", cursor: "pointer", letterSpacing: "2px", backdropFilter: "blur(5px)" }}>
              + Bag
            </button>
            <button onClick={(e) => { e.stopPropagation(); clearCart(); addToCart(product); navigate("/checkout"); }} style={{ flex: 1, padding: "14px 0", backgroundColor: "#000", color: "#fff", border: "none", fontWeight: "900", textTransform: "uppercase", fontSize: "10px", cursor: "pointer", letterSpacing: "2px" }}>
              Buy Now
            </button>
          </div>
      </div>

      <div style={{ paddingTop: "25px", textAlign: "center" }}>
        <p style={{ fontSize: "11px", color: "var(--text-accent)", fontWeight: "800", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>{product.category}</p>
        <h3 className="serif" style={{ fontSize: style.fontSize || "22px", fontWeight: "600", marginBottom: "8px", color: "var(--text-main-inv)" }}>{product.name}</h3>
        <span style={{ fontSize: "18px", fontWeight: "400", color: "var(--text-muted-inv)" }}>₹{product.price.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
};

const AtelierSection = ({ title, items, subtitle, addToRevealRefs, ...props }) => (
    <div ref={addToRevealRefs} className="reveal section-dark" style={{ padding: "120px 5%", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "80px" }}>
        <span style={{ color: "var(--text-accent)", fontSize: "14px", fontWeight: "700", letterSpacing: "6px", textTransform: "uppercase", marginBottom: "15px" }}>{subtitle}</span>
        <h2 style={{ fontSize: "clamp(32px, 5vw, 42px)", fontWeight: "900", textTransform: "uppercase", letterSpacing: "4px", margin: 0, color: "var(--text-main-inv)" }}>{title}</h2>
      </div>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "50px"
      }}>
        {items.map((product) => (
          <ProductCard key={product._id || product.id} product={product} {...props} />
        ))}
      </div>
    </div>
);

function Home({ products = [], addToCart, clearCart, favorites, toggleFavorite, user, openSearch }) {
  const navigate = useNavigate();
  // Scroll Reveal Logic
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });

    revealRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [products]);

  const addToRevealRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  // PERSONALIZATION LOGIC
  const featuredItems = products.filter(p => p.isFeatured).slice(0, 8);
  const gridItems = featuredItems.slice(0, 2); 
  const carouselItems = featuredItems.slice(2); 

  // Department segments
  const mensStocks = products.filter(p => p.department === 'Men').slice(0, 12);
  const womensStocks = products.filter(p => p.department === 'Women').slice(0, 12);
  const kidsStocks = products.filter(p => p.department === 'Kids').slice(0, 12);

  // Dynamic Section Ordering
  let departments = [
    { id: 'men', title: "The Modern Gentleman", subtitle: "Menswear", items: mensStocks },
    { id: 'women', title: "The Ethereal Muse", subtitle: "Womenswear", items: womensStocks },
    { id: 'kids', title: "The Future Icons", subtitle: "Children", items: kidsStocks }
  ];

  if (user) {
    if (user.gender === 'Men') departments = [departments[0], departments[1], departments[2]];
    else if (user.gender === 'Women') departments = [departments[1], departments[0], departments[2]];
    if (user.age < 15) departments = [departments[2], ...departments.filter(d => d.id !== 'kids')];
  }

  // Vault items
  const vaultItems = products.filter(p => p.isVaultItem).slice(0, 4);

  // Countdown logic for Vault
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const dropDate = new Date("2026-04-15T00:00:00");
      const diff = dropDate - new Date();
      if (diff <= 0) {
        setCountdown("THE VAULT HAS OPENED");
        clearInterval(timer);
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setCountdown(`${d}D : ${h}H : ${m}M : ${s}S`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [homeSearch, setHomeSearch] = useState("");
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (homeSearch.trim()) navigate('/shop', { state: { searchKey: homeSearch.trim() } });
  };

  const commonProps = { favorites, toggleFavorite, addToCart, clearCart, navigate };

  return (
    <div style={{ backgroundColor: "var(--ivory)", minHeight: "100vh" }}>
      {/* SEARCH-FIRST LANDING */}
      <div style={{
        position: "relative", 
        height: "calc(100vh - 100px)", 
        maxHeight: "850px",
        minHeight: "520px",
        width: "100%", 
        overflow: "hidden", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#1a2332"
      }}>
        {/* Full-bleed hero photo — centered on model's face/upper body */}
        <img
          src={heroImg}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "50% 20%",
            filter: "contrast(1.06) saturate(1.08)",
          }}
        />
        {/* Light tint so white/gold headline stays readable without washing out the photo */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(19, 25, 33, 0.4) 0%, rgba(15, 23, 34, 0.55) 50%, rgba(19, 25, 33, 0.75) 100%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "850px", padding: "0 24px" }}>
            <span style={{ color: "#f6c26b", fontSize: "12px", fontWeight: "700", letterSpacing: "8px", textTransform: "uppercase", display: "block", marginBottom: "18px", animation: "luxuryFade 2s ease" }}>Batheja Garments</span>
            <h1 className="serif" style={{ fontSize: "clamp(28px, 4.5vw, 54px)", fontWeight: "400", color: "var(--text-main-inv)", marginBottom: "30px", letterSpacing: "1.5px", lineHeight: "1.25" }}>
              {user ? `Greetings, ${user.name.split(' ')[0]}.` : 'Discover Your'} 
              <i style={{ color: "var(--text-accent)", marginLeft: user ? "12px" : "0" }}> {user ? 'Your Atelier is Open.' : 'Atelier Identity'}</i>
            </h1>
            
            <form 
              onSubmit={handleSearchSubmit}
              style={{ width: "100%", maxWidth: "680px", margin: "0 auto", position: "relative", display: "flex", alignItems: "center" }}
            >
              <input 
                type="text"
                placeholder="Search for shirts, sarees, kidswear and more"
                value={homeSearch}
                readOnly
                onClick={openSearch}
                onFocus={openSearch}
                style={{
                  width: "100%", padding: "18px 20px", paddingRight: "150px", backgroundColor: "#ffffff", border: "1px solid #d6dce5", borderRadius: "8px", color: "#1f2937", fontSize: "16px", fontWeight: "500", letterSpacing: "0.3px", outline: "none", transition: "all 0.3s ease", boxShadow: "0 12px 30px rgba(0,0,0,0.25)", cursor: "text"
                }}
              />
              <button 
                type="button"
                onClick={openSearch}
                style={{
                  position: "absolute", right: "6px", padding: "12px 24px", backgroundColor: "#f3b458", color: "#111827", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.3s ease"
                }}
              >
                Search
              </button>
            </form>
        </div>
      </div>

      {/* DYNAMIC MARQUEE */}
      <div style={{
        marginTop: "-20px", padding: "18px 0", overflow: "hidden", whiteSpace: "nowrap", position: "relative", zIndex: 20, backgroundColor: "#232f3e", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "inline-block", animation: "marquee 25s linear infinite", fontWeight: "700", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase", color: "#ffe8c2" }}>
          ⚡ ATELIER ACCESS GRANTED: FREE EXPRESS SHIPPING &nbsp; | &nbsp; THE SPRING COLLECTION IS LIVE &nbsp; | &nbsp; BATHEJA LUXURY SINCE 1994 &nbsp; | &nbsp; ⚡ ATELIER ACCESS GRANTED: FREE EXPRESS SHIPPING
        </div>
      </div>

      {/* NEW COLLECTION MASTERY */}
      {featuredItems.length > 0 && (
         <div ref={addToRevealRefs} className="reveal section-dark" style={{ padding: "150px 5%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "100px", flexWrap: "wrap", gap: "50px" }}>
               <div style={{ maxWidth: "700px" }}>
                  <span style={{ color: "var(--text-accent)", fontSize: "14px", fontWeight: "700", letterSpacing: "8px", textTransform: "uppercase" }}>High-End Specimens</span>
                  <h2 className="serif" style={{ fontSize: "62px", fontWeight: "400", marginTop: "20px", color: "var(--text-main-inv)" }}>The Masterpieces</h2>
               </div>
               <button onClick={()=>navigate('/shop')} style={{ border: "none", background: "none", borderBottom: "2px solid var(--text-accent)", color: "var(--text-main-inv)", paddingBottom: "12px", cursor: "pointer", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "4px" }}>View Gallery</button>
            </div>

            <div className="responsive-masterpiece-grid">
               {gridItems.map(item => (
                  <ProductCard 
                    key={item._id} 
                    product={item} 
                    {...commonProps} 
                    style={{ height: "clamp(420px, 70vh, 750px)", fontSize: "clamp(22px, 3vw, 36px)" }} 
                  />
               ))}
            </div>

            <div style={{ 
               display: "flex", gap: "50px", overflowX: "auto", paddingBottom: "60px", className: "no-scrollbar"
            }}>
               {carouselItems.map(item => (
                  <ProductCard 
                    key={item._id} 
                    product={item} 
                    {...commonProps} 
                    style={{ minWidth: "380px", height: "550px", fontSize: "18px" }} 
                  />
               ))}
            </div>
         </div>
      )}

      {/* THE VAULT SCARCITY */}
      {vaultItems.length > 0 && (
        <div ref={addToRevealRefs} className="reveal section-dark" style={{ padding: "150px 5%", background: "linear-gradient(180deg, #050505 0%, #000 100%)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "25vw", fontWeight: "900", color: "rgba(255,255,255,0.015)", pointerEvents: "none", whiteSpace: "nowrap", letterSpacing: "100px" }}>VAULT</div>
          
          <div style={{ textAlign: "center", marginBottom: "100px", position: "relative", zIndex: 10 }}>
            <span style={{ color: "var(--text-accent)", fontSize: "14px", fontWeight: "700", letterSpacing: "12px", textTransform: "uppercase" }}>Member Exclusives</span>
            <h2 className="serif" style={{ fontSize: "62px", fontWeight: "400", marginTop: "25px", color: "var(--text-main-inv)" }}>Secret Acquisitions</h2>
            <div style={{ marginTop: "40px", fontSize: "32px", fontWeight: "900", letterSpacing: "10px", color: "var(--text-accent)", animation: "luxuryFade 2s infinite" }}>
               {countdown}
            </div>
            <p style={{ color: "var(--text-muted-inv)", fontSize: "12px", marginTop: "20px", letterSpacing: "3px", textTransform: "uppercase" }}>Remaining until high-fidelity unlock</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
             {vaultItems.map(item => (
                <div key={item._id} className="shop-product-card" style={{ position: "relative", cursor: !user ? "not-allowed" : "pointer", borderRadius: "12px", overflow: "hidden" }} onClick={() => user && navigate(`/product/${item._id}`)}>
                   <div style={{ height: "450px", overflow: "hidden", background: "#0a0a0a", borderRadius: "1px", position: "relative", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: !user ? "blur(40px) grayscale(100%)" : "none", opacity: !user ? 0.25 : 1, transition: "all 1.5s ease" }} />
                      {!user && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
                           <span style={{ fontSize: "32px", marginBottom: "20px" }}>🔒</span>
                           <p style={{ color: "#fff", fontSize: "11px", fontWeight: "900", letterSpacing: "4px", textTransform: "uppercase", margin: 0 }}>Classified Specimen</p>
                           <p style={{ color: "var(--text-accent)", fontSize: "10px", marginTop: "15px", letterSpacing: "2px", fontWeight: "800" }}>MEMBERS ONLY</p>
                        </div>
                      )}
                   </div>
                </div>
             ))}
          </div>
          
          {!user && (
            <div style={{ textAlign: "center", marginTop: "100px" }}>
               <button onClick={()=>navigate('/signup')} style={{ backgroundColor: "transparent", border: "1px solid var(--text-accent)", color: "var(--text-accent)", padding: "22px 60px", fontSize: "13px", fontWeight: "900", letterSpacing: "5px", textTransform: "uppercase", cursor: "pointer", transition: "all 0.4s" }} onMouseEnter={e=>{e.currentTarget.style.background="var(--text-accent)"; e.currentTarget.style.color="#000"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text-accent)"}}>
                  Unlock The Vault
               </button>
            </div>
          )}
        </div>
      )}

      {/* PERSONALIZED SEGMENTS */}
      {departments.map(dept => (
        <AtelierSection 
          key={dept.id}
          title={dept.title} 
          subtitle={dept.subtitle} 
          items={dept.items} 
          addToRevealRefs={addToRevealRefs}
          {...commonProps}
        />
      ))}
    </div>
  );
}

export default Home;
