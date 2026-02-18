import React, { useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[9999]">
      <div className="text-center">
        <h1 className="text-2xl font-black tracking-widest uppercase mb-2">ONYX</h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Initializing...</p>
      </div>
    </div>
  );
};

export default SplashScreen;