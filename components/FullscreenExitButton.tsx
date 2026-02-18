import React, { useEffect, useState } from 'react';
import { Minimize2 } from 'lucide-react';

interface FullscreenExitButtonProps {
  meetingMode: boolean;
  onExit: () => void;
}

const FullscreenExitButton: React.FC<FullscreenExitButtonProps> = ({ meetingMode, onExit }) => {
  const [hasFullscreenElement, setHasFullscreenElement] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setHasFullscreenElement(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleChange);
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
    // 1. Try API Exit
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen exit API failed or not active:", err);
    }
    // 2. Trigger App State Exit (covers CSS fallback)
    onExit();
  };

  // Show if API fullscreen is active OR if we are in CSS Meeting Mode
  const isVisible = hasFullscreenElement || meetingMode;

  if (!isVisible) return null;

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-[999999] flex items-center gap-2 bg-[#000000] border border-[#C9A227] text-[#C9A227] px-4 py-2 rounded-sm active:scale-95 transition-all hover:bg-[#C9A227] hover:text-black"
      style={{ boxShadow: 'none' }}
      aria-label="Sair da tela cheia"
    >
      <Minimize2 size={14} />
      <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
    </button>
  );
};

export default FullscreenExitButton;