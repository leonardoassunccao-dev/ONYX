import React from 'react';

interface FullscreenExitButtonProps {
  meetingMode: boolean;
  onExit: () => void;
}

const FullscreenExitButton: React.FC<FullscreenExitButtonProps> = ({ meetingMode, onExit }) => {
  if (!meetingMode && !document.fullscreenElement) return null;

  return (
    <button 
      onClick={onExit}
      className="fixed top-4 right-4 z-[9999] bg-black/50 text-white px-3 py-1 text-[10px] font-bold uppercase border border-white/20 rounded backdrop-blur-sm"
    >
      Exit Fullscreen
    </button>
  );
};

export default FullscreenExitButton;