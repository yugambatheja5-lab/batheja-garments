import React, { useState } from 'react';

const Magnifier = ({ src, alt, width = "100%", height = "600px" }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.pageXOffset) / width) * 100;
    const y = ((e.pageY - top - window.pageYOffset) / height) * 100;
    setCursorPosition({ x: e.pageX - left, y: e.pageY - top });
    setPosition({ x, y });
  };

  return (
    <div
      style={{ position: "relative", width, height, overflow: "hidden", cursor: "crosshair", backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.05)" }}
      onMouseEnter={() => setShowMagnifier(true)}
      onMouseLeave={() => setShowMagnifier(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: showMagnifier ? 0.3 : 1, transition: "opacity 0.3s ease" }}
      />
      
      {showMagnifier && (
        <div style={{
          position: "absolute",
          left: `${cursorPosition.x - 100}px`,
          top: `${cursorPosition.y - 100}px`,
          pointerEvents: "none",
          width: "200px",
          height: "200px",
          border: "2px solid var(--champagne)",
          borderRadius: "50%",
          backgroundColor: "#000",
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${600}%`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          boxShadow: "0 0 50px rgba(0,0,0,0.8)",
          zIndex: 100
        }} />
      )}
    </div>
  );
};

export default Magnifier;
