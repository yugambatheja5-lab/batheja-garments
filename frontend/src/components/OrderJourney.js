import { useState } from "react";

function OrderJourney({ bespokeStatus }) {
  const steps = [
    { id: 'Consultation', label: 'Consultation', icon: '📞' },
    { id: 'Pattern Cutting', label: 'Pattern Cutting', icon: '✂️' },
    { id: 'Precision Tailoring', label: 'Tailoring', icon: '🧶' },
    { id: 'Final Inspection', label: 'Final Inspection', icon: '🔍' },
    { id: 'Luxury Packaging', label: 'Packaging', icon: '🎁' },
    { id: 'In Transit', label: 'In Transit', icon: '🚚' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === bespokeStatus);

  return (
    <div style={{ width: "100%", padding: "40px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginTop: "30px" }}>
      <h3 style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", color: "#d4af37", marginBottom: "40px", textAlign: "center" }}>
        Your Bespoke Journey
      </h3>
      
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", maxWidth: "800px", margin: "0 auto" }}>
        {/* Progress Line */}
        <div style={{ position: "absolute", top: "25px", left: "5%", right: "5%", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: "25px", left: "5%", width: `${(currentStepIndex / (steps.length - 1)) * 90}%`, height: "2px", background: "#d4af37", zIndex: 2, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />

        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", width: "100px" }}>
              <div style={{ 
                width: "50px", 
                height: "50px", 
                borderRadius: "50%", 
                background: isActive ? "#d4af37" : "#1a1a1a", 
                border: "2px solid",
                borderColor: isActive ? "#d4af37" : "rgba(255,255,255,0.1)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: "20px",
                transition: "all 0.5s ease",
                boxShadow: isCurrent ? "0 0 20px rgba(212, 175, 55, 0.4)" : "none",
                transform: isCurrent ? "scale(1.1)" : "scale(1)"
              }}>
                {step.icon}
              </div>
              <p style={{ 
                fontSize: "10px", 
                fontWeight: "900", 
                textTransform: "uppercase", 
                color: isActive ? "#fff" : "#444", 
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

      <div style={{ marginTop: "40px", textAlign: "center" }}>
         <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>
           {currentStepIndex === 0 && "Our artisans are reviewing your measurements and silhouette preferences."}
           {currentStepIndex === 1 && "Precision patterns represent the blueprint of your unique garment."}
           {currentStepIndex === 2 && "Our master tailors are hand-assembling your garment with reinforced stitchwork."}
           {currentStepIndex === 3 && "Under the atelier loupe: Every seam is inspected for 100% structural integrity."}
           {currentStepIndex === 4 && "Preparing your acquisition with archival-grade paper and bespoke signature seal."}
           {currentStepIndex === 5 && "Your garment has left the atelier and is currently in transit to your residence."}
         </p>
      </div>
    </div>
  );
}

export default OrderJourney;
