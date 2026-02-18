import React, { useEffect, useState } from 'react';

interface OnyxBootProps {
  onFinish: () => void;
  durationMs?: number;
}

const OnyxBoot: React.FC<OnyxBootProps> = ({ onFinish, durationMs = 1400 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, durationMs - 150);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, durationMs]);

  return (
    <div className={`onyx-boot-container ${isExiting ? 'onyx-boot-fade-out' : ''}`}>
      {/* HUD Background Elements */}
      <div className="onyx-hud-line onyx-hud-line-1"></div>
      <div className="onyx-hud-line onyx-hud-line-2"></div>
      <div className="onyx-hud-line onyx-hud-line-3"></div>

      {/* Logo Container */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: 120, height: 120 }}
          >
            {/* Corporate Sleek Wings */}
            <g className="onyx-boot-wings">
              {/* Left Wing */}
              <path
                d="M49 42 L12 42 L8 46 L24 58 L36 52 L49 65 Z"
                fill="#C0C0C0"
              />
              <path
                d="M49 46 L28 46 L49 56 Z"
                fill="#0B0B0D"
                opacity="0.3"
              />
              {/* Right Wing */}
              <path
                d="M51 42 L88 42 L92 46 L76 58 L64 52 L51 65 Z"
                fill="#C0C0C0"
              />
              <path
                d="M51 46 L72 46 L51 56 Z"
                fill="#0B0B0D"
                opacity="0.3"
              />
            </g>
          </svg>
        </div>

        <h1 className="onyx-boot-text">ONYX</h1>
      </div>
    </div>
  );
};

export default OnyxBoot;