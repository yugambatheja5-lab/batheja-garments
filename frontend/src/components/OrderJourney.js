import { useState, useEffect } from "react";

function OrderJourney({ bespokeStatus }) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const steps = [
    { id: 'Consultation', label: 'Consultation', icon: '📞' },
    { id: 'Pattern Cutting', label: 'Pattern Cutting', icon: '✂️' },
    { id: 'Precision Tailoring', label: 'Tailoring', icon: '🧶' },
    { id: 'Final Inspection', label: 'Inspection', icon: '🔍' },
    { id: 'Luxury Packaging', label: 'Packaging', icon: '🎁' },
    { id: 'In Transit', label: 'In Transit', icon: '🚚' }
  ];

  const currentStepIndex = Math.max(0, steps.findIndex(s => s.id === bespokeStatus));
  const currentStep = steps[currentStepIndex] || steps[0];
  const progressPercent = Math.min(100, Math.max(10, ((currentStepIndex + 1) / steps.length) * 100));

  const statusMessages = {
    0: "Our artisans are reviewing your measurements and silhouette preferences.",
    1: "Precision patterns represent the blueprint of your unique garment.",
    2: "Our master tailors are hand-assembling your garment with reinforced stitchwork.",
    3: "Under the atelier loupe: Every seam is inspected for structural integrity.",
    4: "Preparing your acquisition with archival-grade paper and bespoke signature seal.",
    5: "Your garment has left the atelier and is currently in transit to your residence."
  };

  return (
    <div style={{
      width: "100%",
      padding: isMobile ? "16px 14px" : "25px 20px",
      background: "rgba(255,255,255,0.03)",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.08)",
      marginTop: "16px",
      boxSizing: "border-box"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ fontSize: "11px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", color: "var(--champagne)", margin: 0 }}>
          Bespoke Journey
        </h3>
        <span style={{ fontSize: "10px", fontWeight: "800", background: "rgba(212, 166, 86, 0.15)", color: "var(--champagne)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--champagne)", textTransform: "uppercase", letterSpacing: "1px" }}>
          Step {currentStepIndex + 1} of {steps.length}: {currentStep.label}
        </span>
      </div>

      {/* MOBILE SLEEK COMPACT PROGRESS BAR */}
      {isMobile ? (
        <div>
          {/* Progress Bar Container */}
          <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", position: "relative", marginBottom: "12px" }}>
            <div style={{
              width: `${progressPercent}%`,
              height: "100%",
              backgroundColor: "var(--champagne)",
              borderRadius: "4px",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 0 10px rgba(212, 166, 86, 0.5)"
            }} />
          </div>

          {/* Mini Step Indicators */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 2px" }}>
            {steps.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div 
                  key={step.id} 
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <div style={{
                    width: isCurrent ? "12px" : "8px",
                    height: isCurrent ? "12px" : "8px",
                    borderRadius: "50%",
                    backgroundColor: isActive ? "var(--champagne)" : "rgba(255,255,255,0.15)",
                    boxShadow: isCurrent ? "0 0 8px var(--champagne)" : "none",
                    transition: "all 0.3s ease"
                  }} />
                </div>
              );
            })}
          </div>

          {/* Current Status Highlight Card */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "22px", background: "var(--champagne)", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#000" }}>
              {currentStep.icon}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "1px" }}>{currentStep.label}</p>
              <p style={{ margin: "3px 0 0", fontSize: "11px", color: "#aaa", lineHeight: "1.4" }}>
                {statusMessages[currentStepIndex]}
              </p>
            </div>
          </div>

          {/* Expandable Step History Toggle */}
          <button
            onClick={() => setShowFullHistory(!showFullHistory)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#888",
              fontSize: "10px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              padding: "10px 0 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <span>{showFullHistory ? "Hide Step History ▲" : "View All 6 Steps ▼"}</span>
          </button>

          {/* Vertical Detailed Steps (When Expanded) */}
          {showFullHistory && (
            <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
              {steps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "12px", opacity: isActive ? 1 : 0.4 }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "var(--champagne)" : "rgba(255,255,255,0.1)",
                      color: isActive ? "#000" : "#fff",
                      fontSize: "10px",
                      fontWeight: "900",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {isActive ? "✓" : idx + 1}
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: isCurrent ? "900" : "600", color: isCurrent ? "var(--champagne)" : "#fff" }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DESKTOP TIMELINE */
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", maxWidth: "800px", margin: "20px auto 0", padding: "0 10px" }}>
            <div style={{ position: "absolute", top: "25px", left: "5%", right: "5%", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 1 }} />
            <div style={{ position: "absolute", top: "25px", left: "5%", width: `${(currentStepIndex / (steps.length - 1)) * 90}%`, height: "2px", background: "var(--champagne)", zIndex: 2, transition: "width 0.8s ease" }} />

            {steps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.id} style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "90px" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "50%", 
                    background: isActive ? "var(--champagne)" : "#1a1a1a", 
                    border: "2px solid",
                    borderColor: isActive ? "var(--champagne)" : "rgba(255,255,255,0.1)",
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "18px",
                    transition: "all 0.5s ease",
                    boxShadow: isCurrent ? "0 0 20px rgba(212, 175, 55, 0.4)" : "none",
                    transform: isCurrent ? "scale(1.08)" : "scale(1)",
                    color: isActive ? "#000" : "#fff"
                  }}>
                    {step.icon}
                  </div>
                  <p style={{ 
                    fontSize: "10px", 
                    fontWeight: "900", 
                    textTransform: "uppercase", 
                    color: isActive ? "#fff" : "#555", 
                    textAlign: "center",
                    letterSpacing: "0.5px",
                    margin: 0
                  }}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "30px", textAlign: "center" }}>
             <p style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic", margin: 0 }}>
               {statusMessages[currentStepIndex]}
             </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderJourney;
