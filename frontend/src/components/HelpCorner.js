import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCorner = () => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    const buttonStyle = {
        position: 'fixed',
        bottom: isMobile ? '20px' : '40px',
        left: isMobile ? '16px' : '40px', // Moved to Bottom Left to avoid collision with Stylist
        zIndex: 1002,
        height: '44px',
        width: isHovered ? '190px' : '100px', // Persistent pill shape for quick discovery
        background: 'rgba(5, 5, 5, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--champagne)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'flex-start',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 15px 40px rgba(0,0,0,0.4), 0 0 15px rgba(193,161,115,0.2)' : '0 10px 30px rgba(0,0,0,0.3)',
        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        overflow: 'hidden',
        color: '#fff',
        willChange: 'transform, width, box-shadow' // GPU acceleration
    };

    const iconStyle = {
        fontSize: '16px',
        fontWeight: '300',
        transition: 'transform 0.6s ease',
        transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)',
        marginRight: '12px'
    };

    const textStyle = {
        whiteSpace: 'nowrap',
        fontSize: '10px',
        fontWeight: '900',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        opacity: 1, // Constant visibility for 'HELP'
        transition: 'all 0.3s ease'
    };

    return (
        <div 
            style={buttonStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate('/help')}
        >
            <span style={iconStyle}>?</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={textStyle}>HELP</span>
                <span style={{ 
                    ...textStyle, 
                    marginLeft: '8px', 
                    opacity: isHovered ? 1 : 0, 
                    transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
                    transition: 'all 0.4s ease'
                }}>CENTRE</span>
            </div>
            
            <style>
                {`
                @keyframes luxuryPulse {
                    0% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.3); opacity: 0; }
                    100% { transform: scale(1); opacity: 0; }
                }
                `}
            </style>
        </div>
    );
};

export default HelpCorner;
