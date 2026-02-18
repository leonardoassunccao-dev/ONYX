import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { useBooks } from '../hooks/useBooks';
import { useHabits } from '../hooks/useHabits';
import { useQuotes } from '../hooks/useQuotes';
import { Profile, Settings, Quote, Section } from '../types';
import OnyxLogo from '../components/OnyxLogo';
import { 
  CheckCircle2, 
  Circle, 
  Zap, 
  Activity, 
  BookOpen, 
  TrendingUp, 
  Monitor,
  Maximize2,
  Minimize2,
  X,
  Clock,
  Eye,
  MoreHorizontal,
  Maximize,
  Minimize,
  CreditCard,
  Brain,
  Dumbbell,
  Landmark
} from 'lucide-react';

interface TodayProps {
  profile: Profile;
  settings: Settings;
  onRefresh: () => void;
  onEnterFocus?: () => void;
  onNavigate?: (section: Section) => void;
}

const TodayPage: React.FC<TodayProps> = ({ profile, settings, onRefresh, onEnterFocus, onNavigate }) => {
  // Hooks
  const { currentBook, getBookStats } = useBooks();
  const { getTodayHabits, getProgress: getHabitProgress, toggleBooleanHabit } = useHabits();
  const { quotes } = useQuotes(); 
  
  // State
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  
  // Quote State for Session Logic
  const [displayQuote, setDisplayQuote] = useState<Quote | null>(null);
  
  // Boot Sequence State (0: init, 1: greeting, 2: quote, 3: hud, 4: routine)
  const [bootStage, setBootStage] = useState(0);
  
  // Mobile Menu State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Financial State
  const [finMetrics, setFinMetrics] = useState({ salaryUsed: 0, patrimonyPercent: 0 });

  // Animation State (Initializing to 0)
  const [anim, setAnim] = useState({
    salary: 0,
    physical: 0,
    mind: 0,
    patrimony: 0
  });

  // Meeting Mode Specific State
  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Data & Greeting
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setGreeting('Bom dia');
    else if (hours >= 12 && hours < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    fetchData();

    // Check Fullscreen preference on load
    const prefFS = localStorage.getItem('onyxMeetingFullscreenPreferred') === 'true';
    if (prefFS && settings.meetingMode) {
       // Browser blocks auto-fullscreen without interaction, logic handled in triggers
    }
  }, []);

  // Click Outside Handler for Mobile Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- SESSION QUOTE LOGIC ---
  useEffect(() => {
    if (quotes.length === 0) return;
    if (displayQuote) return;

    let isReload = false;
    
    try {
       const navEntries = performance.getEntriesByType("navigation");
       if (navEntries.length > 0) {
          const nav = navEntries[0] as PerformanceNavigationTiming;
          if (nav.type === 'reload') isReload = true;
       } else if ((window.performance?.navigation as any)?.type === 1) {
          isReload = true;
       }
    } catch (e) {
       console.warn("Navigation timing check failed", e);
    }

    const storedId = sessionStorage.getItem('onyx_session_quote_id');

    // SCENARIO 1: Page Reload (F5)
    if (isReload && storedId) {
       const restored = quotes.find(q => q.id === Number(storedId));
       if (restored) {
          setDisplayQuote(restored);
          return;
       }
    }

    // SCENARIO 2: Navigation Entry
    let candidates = quotes;
    if (storedId && quotes.length > 1) {
        candidates = quotes.filter(q => q.id !== Number(storedId));
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selected = candidates[randomIndex];
    
    setDisplayQuote(selected);
    
    if (selected && selected.id) {
        sessionStorage.setItem('onyx_session_quote_id', String(selected.id));
    }

  }, [quotes]);

  // Boot Sequence Logic
  useEffect(() => {
    if (!loading) {
      const t1 = setTimeout(() => setBootStage(1), 100); 
      const t2 = setTimeout(() => setBootStage(2), 300); 
      const t3 = setTimeout(() => setBootStage(3), 500); 
      const t4 = setTimeout(() => setBootStage(4), 700); 

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [loading]);

  // Clock for Meeting HUD
  useEffect(() => {
    if (settings.meetingMode) {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      };
      updateTime();
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [settings.meetingMode]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!settings.meetingMode) return;
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 'r') toggleMeetingMode();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.meetingMode, isFullscreen]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      const salaryState = await db.app_state.get('monthly_salary');
      const salary = salaryState?.value || 0;
      
      const fixed = await db.fixed_expenses.toArray();
      const fixedTotal = fixed.reduce((acc, f) => acc + f.amount, 0);

      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const variable = await db.finance_transactions
        .where('date').startsWith(currentMonthStr)
        .and(t => t.type === 'expense')
        .toArray();
      const variableTotal = variable.reduce((acc, v) => acc + v.amount, 0);

      const totalSpent = fixedTotal + variableTotal;
      const salaryUsed = salary > 0 ? (totalSpent / salary) * 100 : 0;

      const patCurState = await db.app_state.get('patrimony_current');
      const patGoalState = await db.app_state.get('patrimony_goal');
      const patCur = patCurState?.value || 0;
      const patGoal = patGoalState?.value || 0;
      const patrimonyPercent = patGoal > 0 ? (patCur / patGoal) * 100 : 0;

      setFinMetrics({ salaryUsed, patrimonyPercent });
    } catch (e) {
      console.error("Fin Calc Error", e);
    }
    
    setLoading(false);
  };

  const toggleMeetingMode = async () => {
    const newMode = !settings.meetingMode;
    await db.settings.update(settings.id!, { meetingMode: newMode });
    setShowMobileMenu(false);
    
    if (!newMode && document.fullscreenElement) {
       await document.exitFullscreen().catch(err => console.log(err));
       setIsFullscreen(false);
    }
    
    onRefresh();
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        localStorage.setItem('onyxMeetingFullscreenPreferred', 'true');
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        localStorage.setItem('onyxMeetingFullscreenPreferred', 'false');
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen blocked:", err);
      // Optional: Toast message here
    }
    setShowMobileMenu(false);
  };

  // --- METRICS CALCULATION ---
  const todayHabits = getTodayHabits();
  const completedHabits = todayHabits.filter(h => getHabitProgress(h).isMet).length;
  const habitPercentage = todayHabits.length > 0 ? (completedHabits / todayHabits.length) * 100 : 0;
  
  const bookStats = currentBook ? getBookStats(currentBook) : null;
  const readingPercentage = bookStats && currentBook?.dailyPagesGoal 
    ? Math.min((bookStats.pagesToday / currentBook.dailyPagesGoal) * 100, 100) 
    : 0;

  // Evolution Index Logic
  const evolutionIndex = (() => {
    const scoreFinance = Math.max(0, 100 - finMetrics.salaryUsed);
    const scorePhysical = habitPercentage;
    const scoreMind = readingPercentage;
    const scorePatrimony = Math.min(finMetrics.patrimonyPercent, 100);

    const total = scoreFinance + scorePhysical + scoreMind + scorePatrimony;
    return Math.round(total / 4);
  })();

  // --- ANIMATION EFFECT (Status Operational) ---
  useEffect(() => {
    if (loading || bootStage < 3) return; 

    setAnim({ salary: 0, physical: 0, mind: 0, patrimony: 0 });

    const targets = { 
      salary: finMetrics.salaryUsed, 
      physical: habitPercentage, 
      mind: readingPercentage, 
      patrimony: finMetrics.patrimonyPercent 
    };

    let frameId: number;
    let startTimestamp: number | null = null;
    const duration = 1200; 

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); 

      setAnim({
        salary: targets.salary * ease,
        physical: targets.physical * ease,
        mind: targets.mind * ease,
        patrimony: targets.patrimony * ease
      });

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [loading, bootStage, finMetrics, habitPercentage, readingPercentage]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#000000]">
       <OnyxLogo size={64} animated />
       <p className="mt-6 text-xs font-mono-hud text-[var(--accent-color)] animate-pulse tracking-[0.3em]">INITIALIZING CORE SYSTEMS...</p>
    </div>
  );

  /* ------------------------------------------------ */
  /*               MEETING MODE LAYOUT                */
  /* ------------------------------------------------ */
  if (settings.meetingMode) {
    return (
      <div className="h-screen w-full bg-[#000000] text-white flex flex-col relative overflow-hidden">
        {/* HUD HEADER */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-4">
             <OnyxLogo size={32} />
             <div className="h-4 w-[1px] bg-zinc-800"></div>
             <span className="text-xs font-black tracking-[0.3em] text-[var(--accent-color)] uppercase">Modo Reunião</span>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-zinc-500 bg-[#0B0B0B] px-3 py-1 rounded border border-[#1a1a1a]">
                <Clock size={14} />
                <span className="font-mono-hud text-sm font-bold tracking-widest">{currentTime}</span>
             </div>
             
             <div className="flex items-center gap-2">
                <button 
                  onClick={onEnterFocus}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30 text-[var(--accent-color)] rounded transition-all text-[10px] font-black uppercase tracking-widest mr-2"
                >
                  <Eye size={14} />
                  Foco Ultra
                </button>
                <button 
                  onClick={toggleFullscreen} 
                  className="flex items-center gap-2 px-4 py-2 bg-[#0B0B0B] hover:bg-zinc-800 border border-[#1a1a1a] text-zinc-400 hover:text-white rounded transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
                </button>
                <button 
                  onClick={toggleMeetingMode} 
                  className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  title="Sair do Modo Reunião (R)"
                >
                   <X size={20} />
                </button>
             </div>
          </div>
        </header>

        {/* MAIN PROJECTION AREA */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-8">
               <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">
                 {greeting}, <span className="text-[var(--accent-color)]">{profile.name}.</span>
               </h1>
               {displayQuote && (
                  <div className="relative max-w-4xl mx-auto py-6">
                    <div className="w-24 h-[1px] bg-[var(--accent-color)] mx-auto mb-6 opacity-60"></div>
                    <p className="text-xl md:text-2xl font-serif italic text-zinc-300 leading-relaxed tracking-wide">
                      "{displayQuote.text}"
                    </p>
                    <p className="text-xs text-[var(--accent-color)] font-bold uppercase tracking-[0.3em] mt-4 opacity-80">
                      — {displayQuote.author}
                    </p>
                    <div className="w-24 h-[1px] bg-[var(--accent-color)] mx-auto mt-6 opacity-60"></div>
                  </div>
               )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-4 hover:border-[var(--accent-color)]/50 transition-all">
                  <TrendingUp size={32} className="text-zinc-600 mb-2" />
                  <div className="text-center">
                    <span className="text-4xl font-mono-hud font-bold text-white block">{finMetrics.salaryUsed.toFixed(0)}%</span>
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Salário Utilizado</span>
                  </div>
               </div>
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--accent-color)]/50 transition-all">
                  <Activity size={32} className="text-[var(--accent-color)] mb-2" />
                  <span className="text-5xl font-mono-hud font-bold text-white">{habitPercentage.toFixed(0)}%</span>
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Condicionamento Físico</span>
               </div>
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--accent-color)]/50 transition-all">
                  <BookOpen size={32} className="text-zinc-600 mb-2" />
                  <span className="text-5xl font-mono-hud font-bold text-white">{readingPercentage.toFixed(0)}%</span>
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Progresso Intelectual</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------ */
  /*               STANDARD LAYOUT (BOOT SEQ)         */
  /* ------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#000000] text-white space-y-10 relative hud-scanline">

      {/* 1. TOP HEADER: GREETING & QUOTE */}
      <header className="border-b border-[#1a1a1a] pb-8 text-center relative">
         
         {/* MODE TOGGLES & MOBILE MENU */}
         <div className="absolute top-0 right-0 z-50 flex flex-col items-end" ref={mobileMenuRef}>
           
           {/* DESKTOP BUTTONS (Visible on large screens) */}
           <div className="hidden lg:flex items-center gap-3 mt-2 mr-4">
             <button 
               onClick={onEnterFocus}
               className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--accent-color)] hover:text-white border border-[var(--accent-color)]/50 hover:border-[var(--accent-color)] bg-[var(--accent-color)]/5 px-3 py-1.5 rounded transition-all"
               title="Ativar Foco Ultra Minimal"
             >
               <Eye size={12} />
             </button>
             <button 
               onClick={toggleMeetingMode}
               className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-[var(--accent-color)] border border-[#1a1a1a] hover:border-[var(--accent-color)] px-3 py-1.5 rounded transition-all"
             >
               <Monitor size={12} />
               Modo Reunião
             </button>
           </div>

           {/* MOBILE TRIGGER ICON (Visible on small screens) */}
           <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-zinc-600 hover:text-[var(--accent-color)] p-4 transition-colors active:scale-95"
           >
              <MoreHorizontal size={24} />
           </button>

           {/* MOBILE DROPDOWN MENU */}
           {showMobileMenu && (
              <div className="lg:hidden absolute top-12 right-2 w-56 bg-[#0b0b0d] border border-[#2a2a2a] shadow-2xl rounded-lg overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0f0f0f]">
                     <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Menu Tático</span>
                  </div>
                  
                  <button 
                    onClick={toggleMeetingMode}
                    className="w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-all"
                  >
                    <Monitor size={14} className="text-[var(--accent-color)]" />
                    {settings.meetingMode ? 'Sair Modo Reunião' : 'Ativar Modo Reunião'}
                  </button>

                  <button 
                    onClick={toggleFullscreen}
                    className="w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-all"
                  >
                    {isFullscreen ? <Minimize size={14} className="text-[var(--accent-color)]" /> : <Maximize size={14} className="text-[var(--accent-color)]" />}
                    {isFullscreen ? 'Sair Tela Cheia' : 'Tela Cheia'}
                  </button>

                  <button 
                    onClick={() => { setShowMobileMenu(false); onEnterFocus?.(); }}
                    className="w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-all border-t border-[#1a1a1a]"
                  >
                    <Eye size={14} className="text-[var(--accent-color)]" />
                    Modo Foco Ultra
                  </button>
              </div>
           )}
         </div>

         {/* STEP 1: GREETING */}
         <h1 
           className={`text-3xl md:text-4xl font-black text-[#f5f5f5] uppercase tracking-tight mb-8 mt-12 md:mt-0 transition-all duration-700 transform ${bootStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
         >
           {greeting}, <span className="text-[var(--accent-color)]">{profile.name}.</span>
         </h1>
         
         {/* STEP 2: QUOTE */}
         <div 
           className={`max-w-2xl mx-auto relative py-6 transition-all duration-700 transform ${bootStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
         >
            {/* Subtle Accent Lines */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-[var(--accent-color)]/30"></div>
            
            {displayQuote ? (
              <div className="space-y-3 px-4">
                <p className="text-sm md:text-lg font-medium text-zinc-400 tracking-wide leading-relaxed font-serif italic opacity-90">
                  {displayQuote.text}
                </p>
                {displayQuote.author && (
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] pt-2">
                    {displayQuote.author}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-600 uppercase tracking-widest">Carregando diretriz diária...</p>
            )}

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-[var(--accent-color)]/30"></div>
         </div>
      </header>

      {/* STEP 3: STATUS OPERACIONAL */}
      <section 
        className={`max-w-4xl mx-auto w-full pt-4 pb-8 px-4 md:px-0 transition-all duration-700 transform ${bootStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a] pb-4">
           <h3 className="text-xs font-black text-[#a0a0a0] uppercase tracking-[0.3em] flex items-center gap-2">
             <Activity size={14} className="text-[var(--accent-color)]" /> Status Operacional
           </h3>
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-[#7a7a7a] uppercase tracking-widest">ÍNDICE DE EVOLUÇÃO</span>
             <span className="text-lg font-mono font-bold text-[var(--accent-color)]">{evolutionIndex}%</span>
           </div>
        </div>
        
        <div className="space-y-6">
          {/* Item: SALÁRIO */}
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                   <CreditCard size={16} className="text-[#7a7a7a]" />
                   <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Salário (Gasto)</span>
                </div>
                <span className={`text-sm font-mono font-bold ${anim.salary > 100 ? 'text-red-600' : 'text-[#f5f5f5]'}`}>
                  {Math.round(anim.salary)}%
                </span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${anim.salary > 70 && anim.salary <= 100 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''} ${anim.salary > 100 ? 'bg-red-800' : 'bg-[var(--accent-color)]'}`} 
                  style={{ width: `${Math.min(anim.salary, 100)}%` }} 
                />
             </div>
          </div>

          {/* Item: FÍSICO */}
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                   <Dumbbell size={16} className="text-[#7a7a7a]" />
                   <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Físico</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">
                  {Math.round(anim.physical)}%
                </span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div 
                  className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.physical > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} 
                  style={{ width: `${anim.physical}%` }} 
                />
             </div>
          </div>

          {/* Item: INTELECTO */}
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                   <Brain size={16} className="text-[#7a7a7a]" />
                   <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Mente</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">
                  {Math.round(anim.mind)}%
                </span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div 
                  className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.mind > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} 
                  style={{ width: `${anim.mind}%` }} 
                />
             </div>
          </div>

          {/* Item: PATRIMÔNIO */}
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                   <Landmark size={16} className="text-[#7a7a7a]" />
                   <span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Patrimônio</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">
                  {anim.patrimony.toFixed(1)}%
                </span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden">
                <div 
                  className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.patrimony > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} 
                  style={{ width: `${Math.min(anim.patrimony, 100)}%` }} 
                />
             </div>
          </div>
        </div>
      </section>

      {/* 4. ROTINA DIÁRIA */}
      <section 
        className={`space-y-4 px-4 md:px-0 transition-all duration-700 transform ${bootStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
         <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
          <h3 className="text-xs font-black text-[#a0a0a0] uppercase tracking-[0.3em] flex items-center gap-2">
            <Zap size={14} className="text-[var(--accent-color)]" /> Rotina Diária
          </h3>
          {todayHabits.length > 0 && (
            <span className="text-[9px] font-mono text-[#7a7a7a] bg-[#0B0B0B] px-2 rounded">
               {todayHabits.filter(h => getHabitProgress(h).isMet).length}/{todayHabits.length}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayHabits.map(habit => {
            const stats = getHabitProgress(habit);
            return (
              <div key={habit.id} className={`bg-[#0B0B0B] border ${stats.isMet ? 'border-[var(--accent-color)]/40 shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)]' : 'border-[#1a1a1a]'} p-4 transition-all group hover:border-[var(--accent-color)]/30`}>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${stats.isMet ? 'text-white' : 'text-zinc-400'}`}>{habit.title}</h4>
                    {habit.type === 'boolean' ? (
                      <button onClick={() => toggleBooleanHabit(habit.id!)} className={`transition-all ${stats.isMet ? 'text-[var(--accent-color)]' : 'text-zinc-700 hover:text-white'}`}>
                         {stats.isMet ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-zinc-600">{stats.current}/{habit.targetValue}</span>
                    )}
                 </div>
                 
                 {habit.type !== 'boolean' && (
                   <div className="h-1 bg-zinc-900 w-full overflow-hidden">
                      <div className={`h-full transition-all ${stats.isMet ? 'bg-[var(--accent-color)] shadow-[0_0_5px_rgba(var(--accent-rgb),1)]' : 'bg-zinc-700'}`} style={{ width: `${stats.percent}%` }} />
                   </div>
                 )}
              </div>
            );
          })}
          
          {todayHabits.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-8 border border-dashed border-zinc-800 rounded-lg bg-[#0B0B0B]/40">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Nenhum protocolo ativo.</p>
                <button 
                  onClick={() => onNavigate && onNavigate('routine')}
                  className="bg-zinc-900 hover:bg-[var(--accent-color)] text-[var(--accent-color)] hover:text-black border border-[var(--accent-color)]/30 px-4 py-2 rounded text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  + Ativar Protocolo Agora
                </button>
             </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default TodayPage;