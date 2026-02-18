import React, { useState, useEffect } from 'react';
import { Minimize2 } from 'lucide-react';

const FullscreenExitButton: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Initial check
    handleChange();

    document.addEventListener('fullscreenchange', handleChange);
    // Vendor prefixes support just in case
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);
    document.addEventListener('msfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
      document.removeEventListener('msfullscreenchange', handleChange);
    };
  }, []);

  const handleExit = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen exit failed:", err);
    }
  };

  if (!isFullscreen) return null;

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-[999999] flex items-center gap-2 bg-[#000000] border border-[#C9A227] text-[#C9A227] px-3 py-2 rounded-sm active:scale-95 transition-all hover:bg-[#C9A227] hover:text-black"
      style={{ boxShadow: 'none' }}
      aria-label="Sair da tela cheia"
    >
      <Minimize2 size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
    </button>
  );
};

export default FullscreenExitButton;