import React from 'react';

interface OnyxLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

const OnyxLogo: React.FC<OnyxLogoProps> = ({ size = 32, animated = false, className = '' }) => {
  // Animation for the new minimalist design
  // The ring spins slowly or scales in, the cut acts as a scanner
  const animationStyles = animated ? `
    @keyframes ringReveal {
      0% { opacity: 0; transform: scale(0.8) rotate(-90deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    .onyx-ring {
      transform-origin: center;
      animation: ringReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  ` : '';

  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <style>{animationStyles}</style>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/* Mask for the Ultra-thin vertical cut */}
          <mask id="vertical-cut">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            {/* Cut width ~3% of viewbox for ultra-thin look, extending beyond circle */}
            <rect x="48.5" y="-10" width="3" height="120" fill="black" />
          </mask>
        </defs>

        {/* 
          Perfect Geometric Circular Ring 
          Color: Metallic Gold (#C9A227)
          Stroke: Uniform thickness
        */}
        <circle 
          className={animated ? 'onyx-ring' : ''}
          cx="50" 
          cy="50" 
          r="36" 
          stroke="#C9A227" 
          strokeWidth="6" 
          fill="none" 
          mask="url(#vertical-cut)"
        />
      </svg>
    </div>
  );
};

export default OnyxLogo;