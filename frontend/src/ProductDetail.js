import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { triggerCartAnimation } from "./utils/animations";
import Magnifier from "./components/Magnifier";

function ProductDetail({ allProducts = [], addToCart, clearCart, favorites, toggleFavorite }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("S");
  const [selectedColor, setSelectedColor] = useState("Standard");
  const [mainImage, setMainImage] = useState("");

  const relatedProducts = useMemo(() => {
    if (!product || !allProducts.length) return [];
    const pid = product._id || product.id;
    return allProducts.filter(p => 
      (p._id || p.id) !== pid && 
      (p.department === product.department || p.category === product.category)
    ).slice(0, 4);
  }, [product, allProducts]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setMainImage(data.image);
        if (data.variants?.sizes?.length > 0) setSelectedSize(data.variants.sizes[0]);
        if (data.variants?.colors?.length > 0) setSelectedColor(data.variants.colors[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "150px 20px", textAlign: "center", minHeight: "80vh", backgroundColor: "#050505", color: "#fff" }}>
        <p style={{ fontSize: "14px", letterSpacing: "5px", textTransform: "uppercase", color: "var(--champagne)" }}>Authenticating Craftsmanship...</p>
        <div style={{ marginTop: "20px", fontSize: "12px", opacity: 0.5 }}>BATHEJA ATELIER</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "150px 20px", textAlign: "center", minHeight: "80vh", backgroundColor: "#050505", color: "#fff" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "2px" }}>Showroom Item Not Found ❌</h2>
        <button 
          onClick={() => navigate("/shop")}
          style={{ padding: "16px 40px", background: "var(--champagne)", color: "#000", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px" }}
        >
          Return to Atelier
        </button>
      </div>
    );
  }

  const availableSizes = product.variants?.sizes || ["S", "M", "L", "XL"];
  const availableColors = product.variants?.colors || ["Standard"];
  const pid = product._id || product.id;
  const isFav = favorites && favorites.some(item => (item._id || item.id) === pid);
  const outOfStock = product.stock === 0;

  return (
    <div style={{ minHeight: "80vh", padding: "120px 5% 60px", backgroundColor: "#050505", color: "#fff" }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", fontSize: "12px", cursor: "pointer", marginBottom: "50px", fontWeight: "700", color: "var(--champagne)", textTransform: "uppercase", letterSpacing: "2px" }}
      >
        ← Return
      </button>

      <div className="responsive-detail-layout">
        {/* IMAGE GALLERY */}
        <div className="responsive-gallery-box">
          {product.images && product.images.length > 0 && (
             <div className="responsive-gallery-thumbs" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {[product.image, ...product.images].map((img, i) => (
                   <img 
                    key={i} 
                    src={img} 
                    alt="thumbnail" 
                    onClick={() => setMainImage(img)}
                    style={{ 
                      width: "70px", 
                      height: "95px", 
                      objectFit: "cover", 
                      cursor: "pointer",
                      border: mainImage === img ? "1px solid var(--champagne)" : "1px solid rgba(255,255,255,0.1)",
                      opacity: mainImage === img ? 1 : 0.6,
                      transition: "all 0.3s ease"
                    }} 
                   />
                ))}
             </div>
          )}
          
          <div className="responsive-detail-main-img">
            <button 
              onClick={() => toggleFavorite(product)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                backgroundColor: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: "45px",
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                cursor: "pointer",
                zIndex: 10,
                color: isFav ? "#ff4d4d" : "#fff",
                transition: "all 0.3s ease"
              }}
            >
              {isFav ? "❤️" : "🤍"}
            </button>
            <Magnifier src={mainImage} alt={product.name} />
          </div>
        </div>

        {/* PRODUCT DETAILS */}
        <div className="responsive-detail-info">
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "30px", marginBottom: "40px" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "4px", fontSize: "12px", color: "var(--champagne)", fontWeight: "700", display: "block", marginBottom: "15px" }}>
               {product.department} &nbsp; // &nbsp; {product.category}
            </span>
            <h1 className="serif" style={{ fontSize: "56px", fontWeight: "400", marginBottom: "25px", color: "#fff", lineHeight: 1.1 }}>
              {product.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
               <h2 style={{ fontSize: "32px", fontWeight: "300", color: "var(--champagne)" }}>
                 ₹{product.price.toLocaleString('en-IN')}
               </h2>
               {product.stock < 10 && product.stock > 0 && (
                 <span style={{ fontSize: "11px", backgroundColor: "rgba(193, 161, 115, 0.1)", color: "var(--champagne)", padding: "10px 20px", border: "1px solid var(--champagne)", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" }}>
                    LIMITED ATELIER STOCK
                 </span>
               )}
            </div>
          </div>

          <p style={{ fontSize: "18px", lineHeight: "1.8", color: "#aaa", marginBottom: "50px", fontWeight: "300" }}>
            {product.description}
          </p>

          {/* COLOR SELECTOR */}
          <div style={{ marginBottom: "40px" }}>
            <p style={{ fontWeight: "800", marginBottom: "20px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--champagne)" }}>
              Shade Selection: <span style={{ fontWeight: "400", color: "#fff", paddingLeft: "10px" }}>{selectedColor}</span>
            </p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {availableColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    padding: "12px 30px",
                    border: selectedColor === color ? "1px solid var(--champagne)" : "1px solid rgba(255,255,255,0.1)",
                    background: selectedColor === color ? "var(--champagne)" : "transparent",
                    color: selectedColor === color ? "#000" : "#fff",
                    fontWeight: "800",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* SIZE SELECTOR */}
          <div style={{ marginBottom: "60px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <p style={{ fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--champagne)" }}>Size Configuration</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: selectedSize === size ? "1px solid var(--champagne)" : "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: selectedSize === size ? "var(--champagne)" : "transparent",
                    color: selectedSize === size ? "#000" : "#fff",
                    fontWeight: "800",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.3s ease"
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "15px" }}>
            <button
               disabled={outOfStock}
               onClick={(e) => {
                 addToCart({ ...product, selectedSize, selectedColor });
                 triggerCartAnimation(e, product.image);
               }}
               style={{
                 flex: "1",
                 padding: "20px 0",
                 border: "1px solid rgba(255,255,255,0.2)",
                 background: "transparent",
                 color: "#fff",
                 fontWeight: "800",
                 cursor: outOfStock ? "not-allowed" : "pointer",
                 fontSize: "12px",
                 textTransform: "uppercase",
                 letterSpacing: "3px",
                 transition: "all 0.4s ease",
                 opacity: outOfStock ? 0.3 : 1
               }}
               onMouseEnter={(e) => {
                 if(!outOfStock) {
                   e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                 }
               }}
               onMouseLeave={(e) => {
                 if(!outOfStock) {
                   e.currentTarget.style.backgroundColor = "transparent";
                 }
               }}
             >
               {outOfStock ? "Sold Out" : "Add to Bag"}
             </button>

             <button
               disabled={outOfStock}
               onClick={() => {
                 clearCart(); 
                 addToCart({ ...product, selectedSize, selectedColor });
                 navigate('/checkout');
               }}
               style={{
                 flex: "1",
                 padding: "20px 0",
                 border: "none",
                 background: outOfStock ? "#222" : "var(--champagne)",
                 color: "#000",
                 fontWeight: "900",
                 cursor: outOfStock ? "not-allowed" : "pointer",
                 fontSize: "12px",
                 textTransform: "uppercase",
                 letterSpacing: "3px",
                 transition: "all 0.4s ease",
                 opacity: outOfStock ? 0.3 : 1,
                 boxShadow: outOfStock ? "none" : "0 10px 25px rgba(193, 161, 115, 0.2)"
               }}
               onMouseEnter={(e) => {
                 if(!outOfStock) { e.currentTarget.style.backgroundColor = "#fff"; }
               }}
               onMouseLeave={(e) => {
                 if(!outOfStock) { e.currentTarget.style.backgroundColor = "var(--champagne)"; }
               }}
             >
               {outOfStock ? "Closed" : "Buy Now"}
             </button>
          </div>
          
          <div style={{ marginTop: "80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "50px" }}>
            <div>
              <p style={{ fontWeight: "800", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "15px", color: "var(--champagne)" }}>Authenticity</p>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>Every masterpiece includes an Atelier-certified hologram and blockchain traceability.</p>
            </div>
            <div>
              <p style={{ fontWeight: "800", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "15px", color: "var(--champagne)" }}>Delivery</p>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>Complimentary white-glove logistics for all boutique acquisitions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* THE ATELIER SUGGESTS */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: "120px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "80px" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span style={{ color: "var(--champagne)", fontSize: "12px", fontWeight: "700", letterSpacing: "5px", textTransform: "uppercase" }}>Curated Pairings</span>
            <h2 className="serif" style={{ fontSize: "42px", marginTop: "15px" }}>The Atelier Suggests</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "30px" }}>
            {relatedProducts.map(p => (
              <div key={p._id || p.id} className="shop-product-card" onClick={() => { navigate(`/product/${p._id || p.id}`); window.scrollTo(0, 0); }} style={{ cursor: "pointer", borderRadius: "12px", padding: "12px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ height: "350px", overflow: "hidden", background: "#0a0a0a", marginBottom: "20px", borderRadius: "8px" }}>
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>{p.name}</h4>
                <p style={{ color: "var(--champagne)", fontSize: "13px", margin: 0 }}>₹{p.price.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;