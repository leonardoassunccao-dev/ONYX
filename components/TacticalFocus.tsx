import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { X, CheckCircle2, Play, Pause, Target } from 'lucide-react';

interface TacticalFocusProps {
  task: Task;
  onClose: () => void;
  onComplete: (task: Task) => void;
}

const TacticalFocus: React.FC<TacticalFocusProps> = ({ task, onClose, onComplete }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !completed) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, completed, seconds]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setCompleted(true);
    setIsActive(false);
    setTimeout(() => {
      onComplete(task);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#ff2d95 1px, transparent 1px), linear-gradient(90deg, #ff2d95 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center text-center">
        {/* Header */}
        <div className="mb-12 flex items-center gap-3 opacity-70">
          <div className="w-2 h-2 rounded-full bg-[#ff2d95] animate-pulse"></div>
          <span className="text-xs font-mono-hud tracking-[0.3em] text-[#ff2d95] uppercase">Modo Foco Tático Ativo</span>
          <div className="w-2 h-2 rounded-full bg-[#ff2d95] animate-pulse"></div>
        </div>

        {/* Mission Title */}
        <div className="mb-16">
           <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Missão Atual</h2>
           <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight">{task.title}</h1>
        </div>

        {/* Timer */}
        <div className="mb-16 relative">
          <div className="text-7xl md:text-9xl font-mono-hud font-bold text-white tracking-widest tabular-nums">
            {formatTime(seconds)}
          </div>
          <div className="absolute -bottom-4 left-0 right-0 h-1 bg-zinc-900 rounded-full overflow-hidden">
             <div className="h-full bg-[#ff2d95] animate-[pulse_2s_infinite]" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Controls */}
        {!completed ? (
          <div className="flex gap-6">
            <button 
              onClick={() => setIsActive(!isActive)}
              className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center hover:border-[#ff2d95] text-zinc-400 hover:text-[#ff2d95] transition-all"
            >
              {isActive ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button 
              onClick={handleComplete}
              className="px-10 h-16 bg-[#ff2d95] hover:bg-[#ff2d95]/90 text-black font-black uppercase tracking-widest text-sm rounded-md transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,45,149,0.4)]"
            >
              <CheckCircle2 size={20} />
              Concluir Missão
            </button>

            <button 
              onClick={onClose}
              className="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center hover:border-red-500 text-zinc-400 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
             <Target size={64} className="text-[#ff2d95] mb-4" />
             <h3 className="text-2xl font-black text-white uppercase tracking-widest neon-text">Missão Cumprida</h3>
             <p className="text-sm text-zinc-400 font-mono-hud mt-2 tracking-wider">+100 PONTOS DE EVOLUÇÃO</p>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
         <p className="text-[10px] text-zinc-600 font-mono-hud uppercase tracking-[0.5em]">System Secure // Neural Link Established</p>
      </div>
    </div>
  );
};

export default TacticalFocus;