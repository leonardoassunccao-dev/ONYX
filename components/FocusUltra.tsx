import React, { useState, useEffect, useCallback } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { Maximize2, Minimize2, X, Timer, Clock } from 'lucide-react';

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
  
  // Pomodoro State
  const [mode, setMode] = useState<'clock' | 'pomodoro'>('clock');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [pomodoroSession, setPomodoroSession] = useState<'work' | 'break'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const { dailyQuote } = useQuotes();

  // Clock Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pomodoro Tick
  useEffect(() => {
    let timer: any;
    if (isPomodoroRunning && pomodoroTime > 0) {
      timer = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (isPomodoroRunning && pomodoroTime === 0) {
      // Session ended
      if (pomodoroSession === 'work') {
        setCompletedSessions(prev => prev + 1);
        setPomodoroSession('break');
        setPomodoroTime(5 * 60); // 5 minutes break
      } else {
        setPomodoroSession('work');
        setPomodoroTime(25 * 60); // 25 minutes work
      }
      setIsPomodoroRunning(false);
    }
    return () => clearInterval(timer);
  }, [isPomodoroRunning, pomodoroTime, pomodoroSession]);

  // Keyboard Shortcuts & Double Tap
  useEffect(() => {
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        exitFocusMode();
      }
      lastTap = now;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to Exit
      if (e.key === 'Escape') {
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

      // P to toggle Pomodoro Mode
      if (e.key.toLowerCase() === 'p') {
        setMode(prev => prev === 'clock' ? 'pomodoro' : 'clock');
      }

      // Space to play/pause Pomodoro
      if (e.code === 'Space' && mode === 'pomodoro') {
        setIsPomodoroRunning(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleDoubleTap);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleDoubleTap);
    };
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

  // Format Pomodoro Time
  const pomodoroMins = Math.floor(pomodoroTime / 60).toString().padStart(2, '0');
  const pomodoroSecs = (pomodoroTime % 60).toString().padStart(2, '0');

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
           <span className="hidden md:flex items-center gap-2"><Timer size={10} /> P: Modo Pomodoro</span>
           {mode === 'pomodoro' && <span className="hidden md:flex items-center gap-2">ESPAÇO: Play/Pause</span>}
           <span className="text-[var(--accent-color)]">{mode === 'clock' ? 'Modo Foco Ultra' : 'Modo Pomodoro'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12">
        {mode === 'clock' ? (
          <div className="font-mono text-6xl md:text-9xl lg:text-[10rem] font-bold text-[#f5f5f5] tracking-widest flex items-center gap-2 md:gap-4 leading-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
             <span>{hours}</span>
             <span className="text-[var(--accent-color)] transition-opacity duration-300" style={{ opacity: isEvenSecond ? 1 : 0.35 }}>:</span>
             <span>{minutes}</span>
             <span className="text-[var(--accent-color)] transition-opacity duration-300" style={{ opacity: isEvenSecond ? 1 : 0.35 }}>:</span>
             <span>{seconds}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-8 text-[10px] font-black uppercase tracking-[0.3em]">
              <span className={pomodoroSession === 'work' ? 'text-[var(--accent-color)]' : 'text-zinc-600'}>Foco</span>
              <span className="text-zinc-800">|</span>
              <span className={pomodoroSession === 'break' ? 'text-blue-400' : 'text-zinc-600'}>Pausa</span>
            </div>
            <div className={`font-mono text-8xl md:text-[12rem] font-bold tracking-widest flex items-center gap-4 leading-none filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] ${isPomodoroRunning ? 'text-white' : 'text-zinc-500'}`}>
               <span>{pomodoroMins}</span>
               <span className={pomodoroSession === 'work' ? 'text-[var(--accent-color)]' : 'text-blue-400'}>:</span>
               <span>{pomodoroSecs}</span>
            </div>
            <div className="mt-12 flex items-center gap-8">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sessões Concluídas</span>
                <span className="text-2xl font-mono font-bold text-[var(--accent-color)]">{completedSessions}</span>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default FocusUltra;