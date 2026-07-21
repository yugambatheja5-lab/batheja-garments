import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SearchOverlay = ({ isOpen, onClose, products }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Load Recent Searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("batheja_recent_searches") || "[]");
    setRecentSearches(saved);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Fuzzy Search Utility
  const getFuzzyMatches = (searchStr, list) => {
    if (!searchStr) return [];
    
    const s = searchStr.toLowerCase().trim();
    
    return list.map(item => {
      let score = 0;
      const name = item.name.toLowerCase();
      const cat = item.category.toLowerCase();
      const dept = item.department.toLowerCase();

      // Exact phrase match (Highest)
      if (name.includes(s)) score += 100;
      if (cat.includes(s)) score += 80;
      if (dept.includes(s)) score += 60;

      // Partial word/Typo handling (Levenshtein-ish)
      const words = name.split(" ");
      words.forEach(word => {
        if (word.startsWith(s)) score += 40;
        // Simple typo match: check if s is a substring with 1 mutation
        if (s.length > 3) {
           // Basic fuzzy check
           let diffCount = 0;
           for(let i=0; i<Math.min(s.length, word.length); i++) {
              if(s[i] !== word[i]) diffCount++;
           }
           if(diffCount <= 1) score += 20;
        }
      });

      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  };

  // Live Search Logic
  useEffect(() => {
    const matches = getFuzzyMatches(query, products);
    setResults(matches);

    // suggestions if no results
    if (query.length > 2 && matches.length === 0) {
      const cats = [...new Set(products.map(p => p.category))];
      const suggestedCats = cats.filter(c => c.toLowerCase().includes(query[0].toLowerCase())).slice(0, 3);
      setSuggestions(suggestedCats);
    } else {
      setSuggestions([]);
    }
  }, [query, products]);

  const saveSearch = (q) => {
    if (!q) return;
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("batheja_recent_searches", JSON.stringify(updated));
  };

  const handleSelect = (product) => {
    saveSearch(query);
    onClose();
    navigate(`/product/${product._id || product.id}`);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!query) return;
    saveSearch(query);
    onClose();
    navigate("/shop", { state: { searchKey: query } });
  };

  const highlightMatch = (text, match) => {
    if (!match) return text;
    const parts = text.split(new RegExp(`(${match})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === match.toLowerCase() 
        ? <b key={i} style={{ color: "var(--text-accent)" }}>{part}</b> 
        : part
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      backdropFilter: "blur(20px)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      padding: "100px 10%",
      animation: "luxuryFade 0.4s easeOut"
    }}>
      <button 
        onClick={onClose}
        style={{ position: "absolute", top: "40px", right: "40px", background: "none", border: "none", fontSize: "32px", cursor: "pointer", color: "#000" }}
      >
        ✕
      </button>

      {/* Input Block */}
      <form onSubmit={handleSearchSubmit} style={{ width: "100%", position: "relative" }}>
        <input 
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search specimens, categories, or collections..."
          style={{
            width: "100%",
            background: "none",
            border: "none",
            borderBottom: "2px solid #000",
            fontSize: "42px",
            fontWeight: "900",
            padding: "20px 0",
            outline: "none",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#000"
          }}
        />
        <p style={{ marginTop: "15px", fontSize: "12px", letterSpacing: "3px", fontWeight: "700", opacity: 0.5, textTransform: "uppercase" }}>
          Instant High-Fidelity Search
        </p>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "100px", marginTop: "60px", flex: 1, overflow: "hidden" }}>
        
        {/* Results Block */}
        <div style={{ overflowY: "auto", paddingRight: "20px" }} className="no-scrollbar">
          {query && results.length > 0 ? (
            <div style={{ display: "grid", gap: "40px" }}>
               {results.map(p => (
                 <div 
                   key={p._id || p.id} 
                   onClick={() => handleSelect(p)}
                   style={{ display: "flex", gap: "30px", alignItems: "center", cursor: "pointer", transition: "transform 0.3s" }}
                   onMouseEnter={e => e.currentTarget.style.transform = "translateX(10px)"}
                   onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
                 >
                    <div style={{ width: "100px", height: "130px", background: "#f9f9f9", overflow: "hidden" }}>
                        <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                        <p style={{ margin: "0 0 5px 0", fontSize: "11px", fontWeight: "900", color: "var(--text-accent)", textTransform: "uppercase", letterSpacing: "2px" }}>
                            {highlightMatch(p.category, query)}
                        </p>
                        <h4 style={{ margin: "0 0 10px 0", fontSize: "24px", fontWeight: "900" }}>
                            {highlightMatch(p.name, query)}
                        </h4>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>₹{p.price.toLocaleString('en-IN')}</p>
                    </div>
                 </div>
               ))}
            </div>
          ) : query && results.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "100px" }}>
               <h2 style={{ fontSize: "32px", fontWeight: "300", letterSpacing: "4px" }}>Specimen Not Found.</h2>
               {suggestions.length > 0 && (
                 <p style={{ marginTop: "20px", fontSize: "16px" }}>
                    Did you mean: {suggestions.map((s, i) => (
                      <span 
                        key={s} 
                        onClick={() => { setQuery(s); saveSearch(s); }}
                        style={{ color: "var(--text-accent)", cursor: "pointer", margin: "0 10px", fontWeight: "900" }}
                      >
                         {s}{i < suggestions.length -1 ? "," : ""}
                      </span>
                    ))}
                 </p>
               )}
               
               <div style={{ marginTop: "80px" }}>
                  <p style={{ fontSize: "12px", letterSpacing: "6px", textTransform: "uppercase", marginBottom: "40px", fontWeight: "900" }}>Trending Specimens</p>
                  <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                     {products.filter(p => p.isFeatured).slice(0, 3).map(p => (
                       <div key={p._id || p.id} onClick={() => handleSelect(p)} style={{ width: "150px", cursor: "pointer" }}>
                          <img src={p.image} alt="" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                          <p style={{ fontSize: "10px", fontWeight: "900", marginTop: "10px" }}>{p.name}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div style={{ padding: "40px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: "20px" }}>
                <div>
                   <span style={{ color: "var(--text-accent)", fontSize: "12px", fontWeight: "900", letterSpacing: "4px", textTransform: "uppercase" }}>Inspirations</span>
                   <h2 style={{ fontSize: "32px", fontWeight: "900", margin: "10px 0 0 0", letterSpacing: "1px" }}>TOP MASTERPIECES</h2>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>{products.length} specimens available</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
                {products.filter(p => p.isFeatured).length > 0 ? (
                  products.filter(p => p.isFeatured).slice(0, 8).map(p => (
                    <div 
                      key={p._id || p.id} 
                      className="shop-product-card"
                      onClick={() => handleSelect(p)}
                      style={{ cursor: "pointer", borderRadius: "12px", padding: "12px", background: "#f9f9f9", border: "1px solid #eee" }}
                    >
                      <div style={{ height: "350px", overflow: "hidden", marginBottom: "20px", background: "#f9f9f9" }}>
                        <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)" }} />
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "900", letterSpacing: "2px", color: "var(--text-accent)", textTransform: "uppercase" }}>{p.category}</span>
                        <h4 style={{ margin: "5px 0", fontSize: "18px", fontWeight: "900" }}>{p.name}</h4>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#666" }}>₹{p.price?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: "16px", color: "#888" }}>Collecting masterpieces for your discovery...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent & Trending Sidebar */}
        <div>
           {recentSearches.length > 0 && (
             <div style={{ marginBottom: "60px" }}>
                <p style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "25px" }}>Recent Discoveries</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                   {recentSearches.map(s => (
                     <span 
                       key={s} 
                       onClick={() => { setQuery(s); saveSearch(s); }}
                       style={{ fontSize: "16px", cursor: "pointer", color: "var(--text-muted)", transition: "color 0.3s" }}
                       onMouseEnter={e => e.currentTarget.style.color = "#000"}
                       onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                     >
                       {s}
                     </span>
                   ))}
                </div>
             </div>
           )}

           <div>
              <p style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "25px" }}>Popular Collections</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                 {["Outerwear", "Silk Series", "New Arrivals", "Exclusive Vault"].map(c => (
                   <span 
                     key={c} 
                     onClick={() => { setQuery(c); handleSearchSubmit(); }}
                     style={{ fontSize: "16px", cursor: "pointer", color: "var(--text-muted)", transition: "color 0.3s" }}
                     onMouseEnter={e => e.currentTarget.style.color = "#000"}
                     onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                   >
                     {c}
                   </span>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;
