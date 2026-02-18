import React, { useEffect, useState } from 'react';
import OnyxLogo from './OnyxLogo';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [animationState, setAnimationState] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter (0ms -> 600ms)
    // Logo scales up and fades in. Handled by initial render state + CSS transition.
    
    // Phase 2: Idle (600ms -> 1000ms)
    const idleTimer = setTimeout(() => {
      setAnimationState('idle');
    }, 600);

    // Phase 3: Exit (1000ms -> 1400ms)
    const exitTimer = setTimeout(() => {
      setAnimationState('exit');
    }, 1000);

    // Finish (1400ms)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1400);

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  // Dynamic classes based on state
  const getContainerClasses = () => {
    switch (animationState) {
      case 'exit': return 'opacity-0';
      default: return 'opacity-100';
    }
  };

  const getLogoClasses = () => {
    switch (animationState) {
      case 'enter': return 'opacity-0 scale-[0.98]'; // Initial state (before mount effect takes over, handled by base styles usually, but for React we animate to active)
      case 'idle': return 'opacity-100 scale-100';
      case 'exit': return 'opacity-100 scale-100'; // Keep scale during fade out
      default: return 'opacity-0 scale-[0.98]';
    }
  };
  
  // Use a small layout effect hack or simply conditional styling to trigger the 'enter' animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center transition-opacity duration-[400ms] ease-in ${animationState === 'exit' ? 'opacity-0' : 'opacity-100'}`}
    >
      <div 
        className={`transition-all duration-[600ms] ease-out transform ${mounted && animationState !== 'exit' ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}
      >
        <OnyxLogo size={80} />
      </div>
    </div>
  );
};

export default SplashScreen;