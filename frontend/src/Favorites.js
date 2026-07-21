import { useNavigate } from "react-router-dom";
import { triggerCartAnimation } from "./utils/animations";

function Favorites({ favorites, toggleFavorite, addToCart, clearCart }) {
  const navigate = useNavigate();

  const emptyFavoritesUI = (
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "20px" }}>Your Favorites List is Empty</h2>
      <p style={{ color: "#777", marginBottom: "40px", fontSize: "18px" }}>You haven't added any products to your specific favorites yet.</p>
      <button 
        onClick={() => navigate("/shop")}
        style={{
          padding: "16px 40px",
          backgroundColor: "#000",
          color: "#fff",
          border: "none",
          borderRadius: "30px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}
      >
        Discover Products
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa", paddingBottom: "100px" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#000", color: "#fff", padding: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}>Your Favorites ❤️</h1>
      </div>

      <div style={{ padding: "40px", maxWidth: "1300px", margin: "0 auto" }}>
        {favorites.length === 0 ? emptyFavoritesUI : (
          <div>
            <div style={{ paddingBottom: "20px", borderBottom: "1px solid #ddd", marginBottom: "30px", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>Saved Items ({favorites.length})</h3>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "35px"
            }}>
              {favorites.map(p => {
                const pid = p._id || p.id;
                return (
                  <div
                    key={pid}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.06)";
                  }}
                  onClick={() => navigate(`/product/${pid}`)}
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(p);
                    }}
                    style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "35px",
                      height: "35px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      color: "#ff4d4d"
                    }}
                  >
                    ❤️
                  </button>

                  <div style={{ height: "320px", width: "100%", overflow: "hidden" }}>
                    <img src={p.image} alt={p.name}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover", 
                        transition: "transform 0.5s ease" 
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    />
                  </div>

                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <p style={{ color: "#777", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", fontWeight: "600" }}>{p.category}</p>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "15px", color: "#111" }}>{p.name}</h3>
                    
                    <p style={{ fontSize: "18px", fontWeight: "700", color: "#000", marginBottom: "16px" }}>₹{p.price.toLocaleString('en-IN')}</p>

                    <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                          triggerCartAnimation(e, p.image);
                        }}
                        style={{
                          flex: 1,
                          padding: "14px 0",
                          background: "none",
                          border: "1px solid rgba(0,0,0,0.15)",
                          fontSize: "11px",
                          fontWeight: "900",
                          letterSpacing: "2px",
                          cursor: "pointer",
                          transition: "all 0.4s",
                          textTransform: "uppercase",
                          color: "var(--text-main)"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-main)"; }}
                      >
                        + Bag
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearCart();
                          addToCart(p);
                          navigate("/checkout");
                        }}
                        style={{
                          flex: 1,
                          padding: "14px 0",
                          background: "#000",
                          color: "#fff",
                          border: "none",
                          fontSize: "11px",
                          fontWeight: "900",
                          letterSpacing: "2px",
                          cursor: "pointer",
                          transition: "all 0.4s",
                          textTransform: "uppercase"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--champagne)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#000"; }}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;
