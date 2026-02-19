import React, { useState, useEffect, useRef } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useHabits } from '../hooks/useHabits';
import { useQuotes } from '../hooks/useQuotes';
import { useFinance } from '../hooks/useFinance';
import { Profile, Settings, Section, Quote } from '../types';
import { db as firestore } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import OnyxLogo from '../components/OnyxLogo';
import { 
  CheckCircle2, 
  Circle, 
  Zap, 
  Activity, 
  BookOpen, 
  TrendingUp, 
  Monitor,
  X,
  Clock,
  Eye,
  MoreHorizontal,
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
  onToggleMeetingMode?: () => void;
}

const TodayPage: React.FC<TodayProps> = ({ profile, settings, onEnterFocus, onNavigate, onToggleMeetingMode }) => {
  const { user } = useAuth();
  const { currentBook, getBookStats } = useBooks();
  const { getTodayHabits, getProgress: getHabitProgress, toggleBooleanHabit } = useHabits();
  const { quotes, dailyQuote } = useQuotes(); 
  const { salary, patrimony, fixedExpenses, transactions } = useFinance();
  
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [bootStage, setBootStage] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [finMetrics, setFinMetrics] = useState({ salaryUsed: 0, patrimonyPercent: 0 });
  const [anim, setAnim] = useState({ salary: 0, physical: 0, mind: 0, patrimony: 0 });
  const [currentTime, setCurrentTime] = useState('');
  
  // Session Quote Logic
  const [displayQuote, setDisplayQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) setGreeting('Bom dia');
    else if (hours >= 12 && hours < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
    setLoading(false);
  }, []);

  // --- QUOTE SELECTION LOGIC ---
  useEffect(() => {
    // Immediate fallback if quotes list is empty but loaded (or taking too long)
    if (quotes.length === 0) {
        // Only set fallback if we don't have one yet, to avoid overriding if one comes in later
        if (!displayQuote) {
            setDisplayQuote({ 
                id: "fallback", 
                text: "Disciplina supera motivação.", 
                author: "ONYX", 
                isCustom: false 
            } as any);
        }
        return;
    }
    
    if (displayQuote && displayQuote.id !== "fallback") return;

    // Use dailyQuote as primary source if available
    if (dailyQuote && !displayQuote) {
        setDisplayQuote(dailyQuote);
    }

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
       console.warn("Nav check failed", e);
    }

    const storedId = sessionStorage.getItem('onyx_session_quote_id');

    // SCENARIO 1: Page Reload (F5) - Restore same quote
    if (isReload && storedId) {
       // Compare as string to handle both numeric and string IDs from Firestore
       const restored = quotes.find(q => String(q.id) === String(storedId));
       if (restored) {
          setDisplayQuote(restored);
          return;
       }
    }

    // SCENARIO 2: Navigation Entry - Rotate quote or use daily
    // Ideally we prefer dailyQuote on fresh load, but let's allow rotation if desired
    // For now, let's prioritize dailyQuote if set
    if (dailyQuote) {
        setDisplayQuote(dailyQuote);
        if (dailyQuote.id) sessionStorage.setItem('onyx_session_quote_id', String(dailyQuote.id));
    } else {
        // Random fallback if dailyQuote logic isn't ready yet but quotes are loaded
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const selected = quotes[randomIndex];
        setDisplayQuote(selected);
    }

  }, [quotes, dailyQuote, displayQuote]);

  const finalQuoteText = displayQuote?.text || "Disciplina supera motivação.";
  const finalQuoteAuthor = displayQuote?.author || "Onyx System";

  useEffect(() => {
    const totalFixed = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const variableTotal = transactions
      .filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    const totalSpent = totalFixed + variableTotal;
    const salaryUsed = salary > 0 ? (totalSpent / salary) * 100 : 0;
    const patrimonyPercent = patrimony.goal > 0 ? (patrimony.current / patrimony.goal) * 100 : 0;

    setFinMetrics({ salaryUsed, patrimonyPercent });
  }, [salary, patrimony, fixedExpenses, transactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timers = [
        setTimeout(() => setBootStage(1), 100),
        setTimeout(() => setBootStage(2), 300),
        setTimeout(() => setBootStage(3), 500),
        setTimeout(() => setBootStage(4), 700)
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [loading]);

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

  const handleToggleMeetingMode = () => {
    setShowMobileMenu(false);
    if (onToggleMeetingMode) {
      onToggleMeetingMode();
    } else {
        if (user) {
            setDoc(doc(firestore, 'users', user.uid, 'system', 'settings'), { 
                meetingMode: !settings.meetingMode,
                updatedAt: serverTimestamp() 
            }, { merge: true });
        }
    }
  };

  const todayHabits = getTodayHabits();
  const completedHabits = todayHabits.filter(h => getHabitProgress(h).isMet).length;
  const habitPercentage = todayHabits.length > 0 ? (completedHabits / todayHabits.length) * 100 : 0;
  const bookStats = currentBook ? getBookStats(currentBook) : null;
  const readingPercentage = bookStats && currentBook?.dailyPagesGoal 
    ? Math.min((bookStats.pagesToday / currentBook.dailyPagesGoal) * 100, 100) 
    : 0;

  const evolutionIndex = Math.round((Math.max(0, 100 - finMetrics.salaryUsed) + habitPercentage + readingPercentage + Math.min(finMetrics.patrimonyPercent, 100)) / 4);

  useEffect(() => {
    if (loading || bootStage < 3) return; 
    setAnim({ salary: 0, physical: 0, mind: 0, patrimony: 0 });
    const targets = { salary: finMetrics.salaryUsed, physical: habitPercentage, mind: readingPercentage, patrimony: finMetrics.patrimonyPercent };
    
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

      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [loading, bootStage, finMetrics, habitPercentage, readingPercentage]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#000000]">
       <OnyxLogo size={64} animated />
       <p className="mt-6 text-xs font-mono-hud text-[var(--accent-color)] animate-pulse tracking-[0.3em]">INITIALIZING CORE SYSTEMS...</p>
    </div>
  );

  if (settings.meetingMode) {
    return (
      <div className="h-full w-full bg-[#000000] text-white flex flex-col relative">
        <header className="flex items-center justify-between px-8 py-4 border-b border-[#1a1a1a] bg-[#050505] shrink-0">
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
                <button onClick={onEnterFocus} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30 text-[var(--accent-color)] rounded transition-all text-[10px] font-black uppercase tracking-widest mr-2"><Eye size={14} /> Foco Ultra</button>
                <button onClick={handleToggleMeetingMode} className="p-2 text-zinc-600 hover:text-red-500 transition-colors"><X size={20} /></button>
             </div>
          </div>
        </header>
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-8">
               <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight">{greeting}, <span className="text-[var(--accent-color)]">{profile.name}.</span></h1>
               <div className="relative max-w-4xl mx-auto py-6">
                 <div className="w-24 h-[1px] bg-[var(--accent-color)] mx-auto mb-6 opacity-60"></div>
                 <p className="text-xl md:text-2xl font-serif italic text-zinc-300 leading-relaxed tracking-wide">"{finalQuoteText}"</p>
                 <p className="text-xs text-[var(--accent-color)] font-bold uppercase tracking-[0.3em] mt-4 opacity-80">— {finalQuoteAuthor}</p>
                 <div className="w-24 h-[1px] bg-[var(--accent-color)] mx-auto mt-6 opacity-60"></div>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-4 hover:border-[var(--accent-color)]/50 transition-all">
                  <TrendingUp size={32} className="text-zinc-600 mb-2" />
                  <div className="text-center"><span className="text-4xl font-mono-hud font-bold text-white block">{finMetrics.salaryUsed.toFixed(0)}%</span><span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Salário Utilizado</span></div>
               </div>
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--accent-color)]/50 transition-all">
                  <Activity size={32} className="text-[var(--accent-color)] mb-2" /><span className="text-5xl font-mono-hud font-bold text-white">{habitPercentage.toFixed(0)}%</span><span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Condicionamento Físico</span>
               </div>
               <div className="bg-[#0B0B0B] border border-[#1a1a1a] p-8 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--accent-color)]/50 transition-all">
                  <BookOpen size={32} className="text-zinc-600 mb-2" /><span className="text-5xl font-mono-hud font-bold text-white">{readingPercentage.toFixed(0)}%</span><span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Progresso Intelectual</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white space-y-10 relative hud-scanline">
      <header className="border-b border-[#1a1a1a] pb-8 text-center relative">
         <div className="absolute top-0 right-0 z-50 flex flex-col items-end" ref={mobileMenuRef}>
           <div className="hidden lg:flex items-center gap-3 mt-2 mr-4">
             <button onClick={onEnterFocus} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--accent-color)] hover:text-white border border-[var(--accent-color)]/50 hover:border-[var(--accent-color)] bg-[var(--accent-color)]/5 px-3 py-1.5 rounded transition-all" title="Ativar Foco Ultra Minimal"><Eye size={12} /></button>
             <button onClick={handleToggleMeetingMode} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-[var(--accent-color)] border border-[#1a1a1a] hover:border-[var(--accent-color)] px-3 py-1.5 rounded transition-all"><Monitor size={12} />Modo Reunião</button>
           </div>
           <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden text-zinc-600 hover:text-[var(--accent-color)] p-4 transition-colors active:scale-95"><MoreHorizontal size={24} /></button>
           {showMobileMenu && (
              <div className="lg:hidden absolute top-12 right-2 w-56 bg-[#0b0b0d] border border-[#2a2a2a] shadow-2xl rounded-lg overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2 z-50">
                  <button onClick={handleToggleMeetingMode} className="w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-all"><Monitor size={14} className="text-[var(--accent-color)]" />{settings.meetingMode ? 'Sair Modo Reunião' : 'Ativar Modo Reunião'}</button>
                  <button onClick={() => { setShowMobileMenu(false); onEnterFocus?.(); }} className="w-full text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-3 transition-all border-t border-[#1a1a1a]"><Eye size={14} className="text-[var(--accent-color)]" />Modo Foco Ultra</button>
              </div>
           )}
         </div>
         <h1 className={`text-3xl md:text-4xl font-black text-[#f5f5f5] uppercase tracking-tight mb-8 mt-12 md:mt-0 transition-all duration-700 transform ${bootStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>{greeting}, <span className="text-[var(--accent-color)]">{profile.name}.</span></h1>
         <div className={`max-w-2xl mx-auto relative py-6 transition-all duration-700 transform ${bootStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-[var(--accent-color)]/30"></div>
            <div className="space-y-3 px-4">
              <p className="text-sm md:text-lg font-medium text-zinc-400 tracking-wide leading-relaxed font-serif italic opacity-90">{finalQuoteText}</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] pt-2">{finalQuoteAuthor}</p>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-[var(--accent-color)]/30"></div>
         </div>
      </header>

      <section className={`max-w-4xl mx-auto w-full pt-4 pb-8 px-4 md:px-0 transition-all duration-700 transform ${bootStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a] pb-4">
           <h3 className="text-xs font-black text-[#a0a0a0] uppercase tracking-[0.3em] flex items-center gap-2"><Activity size={14} className="text-[var(--accent-color)]" /> Status Operacional</h3>
           <div className="flex flex-col items-end"><span className="text-[8px] font-black text-[#7a7a7a] uppercase tracking-widest">ÍNDICE DE EVOLUÇÃO</span><span className="text-lg font-mono font-bold text-[var(--accent-color)]">{evolutionIndex}%</span></div>
        </div>
        <div className="space-y-6">
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3"><CreditCard size={16} className="text-[#7a7a7a]" /><span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Salário (Gasto)</span></div>
                <span className={`text-sm font-mono font-bold ${anim.salary > 100 ? 'text-red-600' : 'text-[#f5f5f5]'}`}>{Math.round(anim.salary)}%</span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden"><div className={`h-full transition-all duration-1000 ${anim.salary > 70 && anim.salary <= 100 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''} ${anim.salary > 100 ? 'bg-red-800' : 'bg-[var(--accent-color)]'}`} style={{ width: `${Math.min(anim.salary, 100)}%` }} /></div>
          </div>
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3"><Dumbbell size={16} className="text-[#7a7a7a]" /><span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Físico</span></div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">{Math.round(anim.physical)}%</span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden"><div className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.physical > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} style={{ width: `${anim.physical}%` }} /></div>
          </div>
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3"><Brain size={16} className="text-[#7a7a7a]" /><span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Mente</span></div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">{Math.round(anim.mind)}%</span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden"><div className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.mind > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} style={{ width: `${anim.mind}%` }} /></div>
          </div>
          <div className="group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3"><Landmark size={16} className="text-[#7a7a7a]" /><span className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Patrimônio</span></div>
                <span className="text-sm font-mono font-bold text-[#f5f5f5]">{anim.patrimony.toFixed(1)}%</span>
             </div>
             <div className="h-[3px] w-full bg-zinc-900 rounded-sm overflow-hidden"><div className={`h-full bg-[var(--accent-color)] transition-all duration-1000 ${anim.patrimony > 70 ? 'shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : ''}`} style={{ width: `${Math.min(anim.patrimony, 100)}%` }} /></div>
          </div>
        </div>
      </section>

      <section className={`space-y-4 px-4 md:px-0 transition-all duration-700 transform ${bootStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
         <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
          <h3 className="text-xs font-black text-[#a0a0a0] uppercase tracking-[0.3em] flex items-center gap-2"><Zap size={14} className="text-[var(--accent-color)]" /> Rotina Diária</h3>
          {todayHabits.length > 0 && <span className="text-[9px] font-mono text-[#7a7a7a] bg-[#0B0B0B] px-2 rounded">{todayHabits.filter(h => getHabitProgress(h).isMet).length}/{todayHabits.length}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayHabits.map(habit => {
            const stats = getHabitProgress(habit);
            return (
              <div key={habit.id} className={`bg-[#0B0B0B] border ${stats.isMet ? 'border-[var(--accent-color)]/40 shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)]' : 'border-[#1a1a1a]'} p-4 transition-all group hover:border-[var(--accent-color)]/30`}>
                 <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${stats.isMet ? 'text-white' : 'text-zinc-400'}`}>{habit.title}</h4>
                    {habit.type === 'boolean' ? (
                      <button onClick={() => toggleBooleanHabit(habit.id!)} className={`transition-all ${stats.isMet ? 'text-[var(--accent-color)]' : 'text-zinc-700 hover:text-white'}`}>{stats.isMet ? <CheckCircle2 size={16} /> : <Circle size={16} />}</button>
                    ) : <span className="text-[9px] font-mono text-zinc-600">{stats.current}/{habit.targetValue}</span>}
                 </div>
                 {habit.type !== 'boolean' && <div className="h-1 bg-zinc-900 w-full overflow-hidden"><div className={`h-full transition-all ${stats.isMet ? 'bg-[var(--accent-color)] shadow-[0_0_5px_rgba(var(--accent-rgb),1)]' : 'bg-zinc-700'}`} style={{ width: `${stats.percent}%` }} /></div>}
              </div>
            );
          })}
          {todayHabits.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-8 border border-dashed border-zinc-800 rounded-lg bg-[#0B0B0B]/40">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-3">Nenhum protocolo ativo.</p>
                <button onClick={() => onNavigate && onNavigate('routine')} className="bg-zinc-900 hover:bg-[var(--accent-color)] text-[var(--accent-color)] hover:text-black border border-[var(--accent-color)]/30 px-4 py-2 rounded text-[9px] font-black uppercase tracking-[0.2em] transition-all">+ Ativar Protocolo Agora</button>
             </div>
          )}
        </div>
      </section>
      
      {/* Debug Footer */}
      <div className="text-center opacity-30 pb-4">
         <p className="text-[7px] font-mono text-zinc-500 uppercase">PHRASES_SOURCE: CLOUD_SYNC</p>
      </div>
    </div>
  );
};

export default TodayPage;