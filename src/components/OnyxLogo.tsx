import React from 'react';

interface OnyxLogoProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

const OnyxLogo: React.FC<OnyxLogoProps> = ({ size = 32, className = '' }) => {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
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
        <path
          d="M50 10 L88 32 L70 60 L50 92 L30 60 L12 32 Z"
          fill="url(#onyxGoldGradient)"
        />
        <path
          d="M50 28 L62 48 L50 72 L38 48 Z"
          fill="#0B0B0D"
        />
        <rect 
           x="49" y="10" width="2" height="18" fill="#0B0B0D" 
           opacity="0.4"
        />
      </svg>
    </div>
  );
};

export default OnyxLogo;