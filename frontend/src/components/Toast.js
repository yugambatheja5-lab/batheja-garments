import React from "react";

/**
 * Reusable Floating Toast Notification Component
 */
export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const bgMap = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b"
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠️"
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 10000,
        backgroundColor: "#111827",
        color: "#ffffff",
        padding: "14px 22px",
        borderRadius: "10px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: "600",
        maxWidth: "400px",
        borderLeft: `5px solid ${bgMap[toast.type] || bgMap.info}`,
        animation: "slideInToast 0.3s ease-out forwards"
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: bgMap[toast.type] || bgMap.info,
          color: "#fff",
          fontSize: "12px",
          fontWeight: "900",
          flexShrink: 0
        }}
      >
        {iconMap[toast.type] || "ℹ"}
      </span>
      <span style={{ flex: 1, lineHeight: "1.4" }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "#9ca3af",
          cursor: "pointer",
          fontSize: "16px",
          padding: "0 0 0 10px"
        }}
      >
        ✕
      </button>

      <style>{`
        @keyframes slideInToast {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Toast;
