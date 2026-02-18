import React, { useState, useEffect, useCallback } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface FocusUltraProps {
  onExit: () => void;
}

const FocusUltra: React.FC<FocusUltraProps> = ({ onExit }) => {
  const [time, setTime] = useState(new Date());
  const [showQuote, setShowQuote] = useState(() => {
    return localStorage.getItem('onyxFocusUltraPhraseVisible') !== 'false';
  });
  const [showHud, setShowHud] = useState(false);
  const [hudTimeout, setHudTimeout] = useState<any>(null);
  
  const { dailyQuote } = useQuotes();

  // Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // SHIFT + ESC to Exit
      if (e.shiftKey && e.key === 'Escape') {
        exitFocusMode();
      }
      
      // F for Fullscreen toggle
      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }

      // H to toggle Quote
      if (e.key.toLowerCase() === 'h') {
        toggleQuote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuote]);

  // Mouse HUD Logic
  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.clientY < 100) {
      setShowHud(true);
      if (hudTimeout) clearTimeout(hudTimeout);
      const timeout = setTimeout(() => setShowHud(false), 3000);
      setHudTimeout(timeout);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(err => console.log(err));
      localStorage.setItem('onyxFocusUltraFullscreenPreferred', 'true');
    } else {
      await document.exitFullscreen().catch(err => console.log(err));
      localStorage.setItem('onyxFocusUltraFullscreenPreferred', 'false');
    }
  };

  const exitFocusMode = () => {
    onExit();
  };

  const toggleQuote = () => {
    const newState = !showQuote;
    setShowQuote(newState);
    localStorage.setItem('onyxFocusUltraPhraseVisible', String(newState));
  };

  // Format Time
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const isEvenSecond = time.getSeconds() % 2 === 0;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center cursor-default select-none"
      onMouseMove={handleMouseMove}
    >
      {/* HUD (Top Hover) */}
      <div 
        className={`fixed top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-center transition-opacity duration-500 ${showHud ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 bg-[#121214] px-4 py-2 rounded-full border border-zinc-800">
           <span className="hidden md:flex items-center gap-2"><Maximize2 size={10} /> F: Tela Cheia</span>
           <span className="hidden md:flex items-center gap-2"><X size={10} /> Shift+ESC: Sair</span>
           <span className="text-[#D4AF37]">Modo Foco Ultra</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12">
        {/* Giant Clock */}
        <div className="font-mono text-6xl md:text-9xl lg:text-[10rem] font-bold text-[#f5f5f5] tracking-widest flex items-center gap-2 md:gap-4 leading-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
           <span>{hours}</span>
           <span className="text-[#D4AF37] transition-opacity duration-300" style={{ opacity: isEvenSecond ? 1 : 0.35 }}>:</span>
           <span>{minutes}</span>
           <span className="text-[#D4AF37] transition-opacity duration-300" style={{ opacity: isEvenSecond ? 1 : 0.35 }}>:</span>
           <span>{seconds}</span>
        </div>

        {/* Quote */}
        {showQuote && dailyQuote && (
           <div className="max-w-2xl px-6 text-center animate-in fade-in duration-1000 slide-in-from-bottom-4">
              <p className="text-sm md:text-lg font-medium text-[#8a8a8a] leading-relaxed font-serif italic opacity-80">
                "{dailyQuote.text.length > 140 ? dailyQuote.text.substring(0, 140) + '...' : dailyQuote.text}"
              </p>
              {dailyQuote.author && (
                 <p className="text-[9px] text-[#4a4a4a] font-black uppercase tracking-[0.3em] mt-3">
                   {dailyQuote.author}
                 </p>
              )}
           </div>
        )}
      </div>

      {/* Subtle Bottom Status - Fallback Exit Trigger */}
      <button 
        onClick={exitFocusMode}
        className="fixed bottom-8 text-[8px] font-black text-[#1a1a1a] uppercase tracking-[0.5em] hover:text-[#C9A227] transition-colors cursor-pointer active:scale-95 bg-transparent border-none outline-none"
      >
         Onyx System Active
      </button>
    </div>
  );
};

export default FocusUltra;