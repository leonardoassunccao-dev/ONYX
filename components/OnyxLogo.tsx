import React from 'react';

interface OnyxLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

const OnyxLogo: React.FC<OnyxLogoProps> = ({ size = 32, animated = false, className = '' }) => {
  const animationStyles = animated ? `
    @keyframes emblemReveal {
      0% { opacity: 0; transform: scale(0.8) translateY(5px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .onyx-emblem-path {
      opacity: 0;
      transform-origin: center;
      animation: emblemReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
    .onyx-emblem-core {
      opacity: 0;
      transform-origin: center;
      animation: emblemReveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      animation-delay: 0.1s;
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
          <linearGradient id="onyxGoldGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--accent-color)" />
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 
          Elite Geometric Emblem 
          Structure: Faceted Diamond/Shield Hybrid
          Style: Abstract, Tactical, Symmetrical
        */}
        <g>
          {/* Outer Facet (Main Body) */}
          <path
            className={animated ? 'onyx-emblem-path' : ''}
            d="M50 10 L88 32 L70 60 L50 92 L30 60 L12 32 Z"
            fill="url(#onyxGoldGradient)"
          />
          
          {/* Inner Negative Space (The 'Core') - Creates the abstract detail */}
          <path
            className={animated ? 'onyx-emblem-core' : ''}
            d="M50 28 L62 48 L50 72 L38 48 Z"
            fill="#0B0B0D"
          />
          
          {/* Subtle Horizontal Cut (Tactical Detail) */}
          <rect 
             x="49" y="10" width="2" height="18" fill="#0B0B0D" 
             className={animated ? 'onyx-emblem-core' : ''}
             opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
};

export default OnyxLogo;