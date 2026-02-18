
import React, { useState } from 'react';
import { db } from '../db';
import { Profile, Settings, Habit, UserAccount, Section } from '../types';
import { useHabits } from '../hooks/useHabits';
import { useQuotes } from '../hooks/useQuotes';
import { cloud } from '../services/CloudService';
import { applyTheme } from '../utils/theme';
import Card from '../components/Card';
import { 
  Download, Upload, Trash2, User, Monitor, Plus, Activity, 
  Clock, ToggleLeft, Shield, LogIn, LogOut, RefreshCw, Key, 
  Wifi, Edit2, Check, X, Database, Terminal, AlertTriangle,
  Dumbbell, BookOpen, GraduationCap, Briefcase, Palette
} from 'lucide-react';

interface SystemProps {
  profile: Profile;
  settings: Settings;
  onRefresh: () => void;
  onNavigate?: (section: Section) => void;
}

const SystemPage: React.FC<SystemProps> = ({ profile, settings, onRefresh, onNavigate }) => {
  // Identity State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Data Hooks
  const { habits, createHabit, deleteHabit, updateHabit } = useHabits();
  const { quotes, addQuote, deleteQuote } = useQuotes();
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(cloud.getCurrentUser());
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Content Forms State
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '', type: 'count', targetValue: 1, daysOfWeek: [0,1,2,3,4,5,6], active: true
  });

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');

  // --- IDENTITY HANDLERS ---

  const saveName = async () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      // 1. Save to LocalStorage (Primary for this session)
      localStorage.setItem('onyx_agent_name', trimmed);
      
      // 2. Save to DB (Consistency for exports)
      if (profile.id) {
         await db.profile.update(profile.id, { name: trimmed });
      }

      setFeedback('Nome atualizado');
      setTimeout(() => setFeedback(null), 3000);
      onRefresh(); // Trigger App reload
    }
    setIsEditingName(false);
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setTempName(profile.name);
  };

  const toggleMeetingMode = async () => {
    const newMode = !settings.meetingMode;
    await db.settings.update(settings.id!, { meetingMode: newMode });
    onRefresh();
  };

  const handleThemeChange = (theme: 'gold' | 'silver' | 'emerald') => {
    applyTheme(theme);
    onRefresh(); // Force re-render to update logo component if needed
  };

  // --- AUTH HANDLERS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const user = await cloud.login(authEmail, authPass);
      setCurrentUser(user);
      await handleSync();
    } catch (err: any) {
      setAuthError(err.message || 'Falha na autenticação');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await cloud.logout();
    setCurrentUser(null);
    setSyncStatus(null);
  };

  const handleSync = async () => {
    if (!currentUser) return;
    setSyncLoading(true);
    setSyncStatus('Inicializando uplink...');
    try {
       const result = await cloud.syncAll();
       setSyncStatus(result.message);
       onRefresh();
    } catch (e) {
       setSyncStatus('Erro na sincronização');
    } finally {
       setSyncLoading(false);
    }
  };

  // --- CONTENT HANDLERS ---

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;
    await createHabit(newHabit as Habit);
    setNewHabit({ title: '', type: 'count', targetValue: 1, daysOfWeek: [0,1,2,3,4,5,6], active: true });
    setShowHabitForm(false);
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteText) return;
    await addQuote(newQuoteText, newQuoteAuthor);
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setShowQuoteForm(false);
  };

  // --- DATA HANDLERS ---

  const exportData = async () => {
    const data: any = {};
    for (const table of (db as any).tables) {
      data[table.name] = await table.toArray();
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onyx-core-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!confirm('SUBSTITUIR DADOS LOCAIS PELO ARQUIVO IMPORTADO?')) return;
        for (const table of (db as any).tables) {
          await table.clear();
          if (data[table.name]) await table.bulkAdd(data[table.name]);
        }
        onRefresh();
        alert('Restauração de sistema concluída.');
        window.location.reload();
      } catch (err) {
        alert('Erro na leitura do core: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const factoryReset = async () => {
    if (!confirm('ALERTA CRÍTICO: ISSO APAGARÁ TODOS OS DADOS LOCAIS PERMANENTEMENTE.\n\nConfirmar Wipe Core Data?')) return;
    await (db as any).delete();
    localStorage.removeItem('onyx_agent_name');
    localStorage.removeItem('onyx_theme');
    window.location.reload();
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-24 space-y-16">
      
      {/* HEADER */}
      <header className="border-b border-[#1a1a1a] pb-6">
        <h2 className="text-3xl font-black text-[#E8E8E8] tracking-[0.2em] uppercase">SISTEMA</h2>
        <div className="flex items-center gap-2 mt-2">
           <Terminal size={12} className="text-[var(--accent-color)]" />
           <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-black">Onyx Core Environment v8.0</p>
        </div>
      </header>

      {/* MOBILE MODULES NAVIGATION (Only visible on small screens) */}
      <section className="md:hidden space-y-6">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-3">
            <Activity size={12} className="text-[var(--accent-color)]" /> Módulos Operacionais
         </h3>
         <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate && onNavigate('pacer')}
              className="bg-[#0B0B0B] border border-[#1a1a1a] p-5 rounded-lg flex flex-col items-center gap-3 active:scale-95 transition-all"
            >
              <Dumbbell className="text-[#C0C0C0]" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pacer</span>
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('reading')}
              className="bg-[#0B0B0B] border border-[#1a1a1a] p-5 rounded-lg flex flex-col items-center gap-3 active:scale-95 transition-all"
            >
              <BookOpen className="text-[#C0C0C0]" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Leitura</span>
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('study')}
              className="bg-[#0B0B0B] border border-[#1a1a1a] p-5 rounded-lg flex flex-col items-center gap-3 active:scale-95 transition-all"
            >
              <GraduationCap className="text-[#C0C0C0]" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estudos</span>
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('work')}
              className="bg-[#0B0B0B] border border-[#1a1a1a] p-5 rounded-lg flex flex-col items-center gap-3 active:scale-95 transition-all"
            >
              <Briefcase className="text-[#C0C0C0]" size={24} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Trabalho</span>
            </button>
         </div>
      </section>

      {/* GRUPO 1: IDENTIDADE & ACESSO */}
      <section className="space-y-6">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <User size={12} className="text-[var(--accent-color)]" /> Identidade & Acesso
         </h3>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARTÃO DE IDENTIDADE (AGENT DOSSIER) */}
            <Card className="flex flex-col justify-between min-h-[180px]">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-[var(--accent-color)]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Identificação</span>
                  </div>
                  {!isEditingName && (
                     <button 
                       onClick={() => setIsEditingName(true)} 
                       className="text-[9px] font-bold text-zinc-600 hover:text-[var(--accent-color)] uppercase tracking-widest transition-colors flex items-center gap-1"
                     >
                       <Edit2 size={10} /> Editar
                     </button>
                  )}
               </div>

               <div className="flex-1 flex flex-col justify-center">
                  {isEditingName ? (
                     <div className="space-y-3 animate-in fade-in duration-300">
                        <input 
                           autoFocus
                           type="text" 
                           value={tempName}
                           onChange={(e) => setTempName(e.target.value)}
                           className="w-full bg-[#121212] border border-zinc-700 text-white font-black uppercase text-xl tracking-widest p-3 rounded focus:border-[var(--accent-color)] outline-none placeholder:text-zinc-700"
                           placeholder="CODINOME"
                        />
                        <div className="flex gap-2">
                           <button onClick={saveName} className="flex-1 bg-[var(--accent-color)] text-black py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2">
                             <Check size={12} /> Salvar
                           </button>
                           <button onClick={cancelEdit} className="flex-1 bg-zinc-800 text-zinc-400 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2">
                             <X size={12} /> Cancelar
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Agente</p>
                        <h1 className="text-3xl font-black text-white uppercase tracking-wider">{profile.name}</h1>
                        <p className="text-[9px] text-[var(--accent-color)] font-bold uppercase tracking-[0.5em] mt-2 opacity-80 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-pulse"></span>
                           Status: Ativo
                        </p>
                        {feedback && (
                           <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-2 animate-pulse">{feedback}</p>
                        )}
                     </div>
                  )}
               </div>

               <div className="mt-6 pt-6 border-t border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className={settings.meetingMode ? "text-[var(--accent-color)]" : "text-zinc-600"} size={18} />
                    <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">Modo Reunião</span>
                  </div>
                  <button 
                    onClick={toggleMeetingMode}
                    className={`w-10 h-5 rounded-full transition-all relative ${settings.meetingMode ? 'bg-[var(--accent-color)]' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${settings.meetingMode ? 'left-5.5 bg-[#0b0b0d]' : 'left-0.5 bg-zinc-500'}`} />
                  </button>
               </div>
            </Card>

            {/* INTERFACE THEME SELECTOR */}
            <Card className="flex flex-col justify-between">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-[var(--accent-color)]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Protocolo Visual</span>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-center gap-4">
                  <button 
                    onClick={() => handleThemeChange('gold')}
                    className="flex items-center justify-between p-3 rounded border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#D4AF37]/30 hover:border-[#D4AF37]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Gold</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'gold' && <Check size={14} className="text-[#D4AF37]" />}
                     {!localStorage.getItem('onyx_theme') && <Check size={14} className="text-[#D4AF37]" />} 
                  </button>

                  <button 
                    onClick={() => handleThemeChange('silver')}
                    className="flex items-center justify-between p-3 rounded border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#D1D5DB]/30 hover:border-[#D1D5DB]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#D1D5DB] shadow-[0_0_10px_rgba(209,213,219,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Silver</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'silver' && <Check size={14} className="text-[#D1D5DB]" />}
                  </button>

                  <button 
                    onClick={() => handleThemeChange('emerald')}
                    className="flex items-center justify-between p-3 rounded border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#34D399]/30 hover:border-[#34D399]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Emerald</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'emerald' && <Check size={14} className="text-[#34D399]" />}
                  </button>
               </div>
            </Card>

            {/* ACESSO CORPORATIVO (LOGIN/SYNC) */}
            <Card accentBorder={!!currentUser} className="flex flex-col justify-between">
               {currentUser ? (
                 <>
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-[var(--accent-color)] uppercase tracking-widest mb-1">Status: Conectado</p>
                        <p className="text-sm font-bold text-white font-mono">{currentUser.email}</p>
                        {syncStatus && <p className="text-[8px] text-zinc-500 mt-2 uppercase tracking-wide animate-pulse">{syncStatus}</p>}
                      </div>
                      <Wifi size={20} className="text-[var(--accent-color)]" />
                   </div>
                   <div className="grid grid-cols-2 gap-3 mt-6">
                      <button 
                        onClick={handleSync}
                        disabled={syncLoading}
                        className="flex items-center justify-center gap-2 bg-[var(--accent-color)] text-black py-2.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                      >
                        {syncLoading ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Sync
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 bg-[#121212] border border-zinc-800 text-zinc-400 py-2.5 rounded text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all"
                      >
                        <LogOut size={14} />
                        Sair
                      </button>
                   </div>
                 </>
               ) : (
                 <form onSubmit={handleLogin} className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                       <Key size={14} className="text-zinc-500" />
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Acesso Corporativo</span>
                    </div>
                    <div className="space-y-2">
                      <input 
                         type="email" placeholder="ID Corporativo" required
                         className="w-full bg-[#121212] border border-zinc-800 rounded p-2 text-xs text-white focus:border-[var(--accent-color)] outline-none placeholder:text-zinc-700"
                         value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                       />
                       <input 
                         type="password" placeholder="Senha" required
                         className="w-full bg-[#121212] border border-zinc-800 rounded p-2 text-xs text-white focus:border-[var(--accent-color)] outline-none placeholder:text-zinc-700"
                         value={authPass} onChange={e => setAuthPass(e.target.value)}
                       />
                    </div>
                    {authError && <p className="text-[8px] text-red-500 font-bold uppercase">{authError}</p>}
                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full bg-zinc-800 text-zinc-300 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-color)] hover:text-black transition-all disabled:opacity-50"
                    >
                      {authLoading ? 'Autenticando...' : 'Iniciar Sessão'}
                    </button>
                 </form>
               )}
            </Card>
         </div>
      </section>

      {/* GRUPO 2: CONTEÚDO */}
      <section className="space-y-6">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <Database size={12} className="text-[var(--accent-color)]" /> Protocolos de Conteúdo
         </h3>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* FRASES MOTIVACIONAIS */}
            <Card className="flex flex-col h-[320px]">
               <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-4">
                  <div>
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Injeção Moral</span>
                     <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-wider">{quotes.length} Registros no Banco</span>
                  </div>
                  <button onClick={() => setShowQuoteForm(!showQuoteForm)} className="text-zinc-600 hover:text-[var(--accent-color)] transition-colors">
                     <Plus size={18} />
                  </button>
               </div>

               {showQuoteForm && (
                 <form onSubmit={handleAddQuote} className="mb-4 space-y-2 bg-[#0b0b0d] p-3 border border-zinc-800 rounded animate-in fade-in slide-in-from-top-2">
                   <textarea 
                     placeholder="Texto..." rows={2}
                     className="w-full bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white focus:border-[var(--accent-color)] outline-none"
                     value={newQuoteText} onChange={e => setNewQuoteText(e.target.value)}
                   />
                   <div className="flex gap-2">
                      <input 
                        type="text" placeholder="Autor"
                        className="flex-1 bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white focus:border-[var(--accent-color)] outline-none"
                        value={newQuoteAuthor} onChange={e => setNewQuoteAuthor(e.target.value)}
                      />
                      <button type="submit" className="bg-[var(--accent-color)] text-black px-4 rounded text-[10px] font-black uppercase">Add</button>
                   </div>
                 </form>
               )}

               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {quotes.slice().reverse().map(quote => (
                    <div key={quote.id} className="p-3 bg-[#121212] border border-zinc-800/50 rounded hover:border-zinc-700 transition-all group">
                       <p className="text-xs text-zinc-300 font-medium italic leading-relaxed">"{quote.text}"</p>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-[8px] font-black text-[var(--accent-color)] uppercase tracking-widest">{quote.author || 'ONYX ARCHIVE'}</span>
                          <button onClick={() => { if(confirm('Excluir frase?')) deleteQuote(quote.id!); }} className="text-zinc-800 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={10} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>

            {/* GERENCIADOR DE HÁBITOS */}
            <Card className="flex flex-col h-[320px]">
               <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-4">
                  <div>
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Rotinas</span>
                     <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-wider">{habits.length} Protocolos Ativos</span>
                  </div>
                  <button onClick={() => setShowHabitForm(!showHabitForm)} className="text-zinc-600 hover:text-[var(--accent-color)] transition-colors">
                     <Plus size={18} />
                  </button>
               </div>

               {showHabitForm && (
                 <form onSubmit={handleAddHabit} className="mb-4 space-y-2 bg-[#0b0b0d] p-3 border border-zinc-800 rounded animate-in fade-in slide-in-from-top-2">
                   <input 
                     type="text" placeholder="Hábito"
                     className="w-full bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white focus:border-[var(--accent-color)] outline-none"
                     value={newHabit.title} onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                   />
                   <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="bg-[#121212] border border-zinc-800 p-2 rounded text-[9px] font-black uppercase text-zinc-400 outline-none"
                        value={newHabit.type} onChange={e => setNewHabit({...newHabit, type: e.target.value as any})}
                      >
                        <option value="count">QTD</option>
                        <option value="minutes">MIN</option>
                        <option value="boolean">BOOL</option>
                      </select>
                      <input 
                        type="number" placeholder="Meta"
                        className="bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white focus:border-[var(--accent-color)] outline-none"
                        value={newHabit.targetValue} onChange={e => setNewHabit({...newHabit, targetValue: parseInt(e.target.value)})}
                        disabled={newHabit.type === 'boolean'}
                      />
                   </div>
                   <button type="submit" className="w-full bg-[var(--accent-color)] text-black py-1.5 rounded text-[10px] font-black uppercase">Criar</button>
                 </form>
               )}

               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-[#121212] border border-zinc-800/50 rounded hover:border-zinc-700 transition-all group">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className="text-zinc-600">
                             {habit.type === 'count' && <Activity size={12} />}
                             {habit.type === 'minutes' && <Clock size={12} />}
                             {habit.type === 'boolean' && <ToggleLeft size={12} />}
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-[10px] font-bold text-zinc-300 uppercase truncate">{habit.title}</span>
                             <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{habit.targetValue} {habit.type === 'minutes' ? 'MIN' : ''}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <button 
                             onClick={() => updateHabit(habit.id!, { active: !habit.active })}
                             className={`text-[8px] font-black px-2 py-0.5 rounded border transition-all ${habit.active ? 'border-[var(--accent-color)]/30 text-[var(--accent-color)]' : 'border-zinc-800 text-zinc-700'}`}
                          >
                            {habit.active ? 'ON' : 'OFF'}
                          </button>
                          <button onClick={() => { if(confirm('Remover hábito?')) deleteHabit(habit.id!); }} className="text-zinc-800 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                             <Trash2 size={12} />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>

         </div>
      </section>

      {/* GRUPO 3: SEGURANÇA & ARQUIVO */}
      <section className="space-y-6">
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <Shield size={12} className="text-[var(--accent-color)]" /> Arquivo & Segurança
         </h3>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={exportData} className="flex flex-col items-center justify-center gap-3 p-8 bg-[#0B0B0B] border border-zinc-800 rounded-lg hover:border-[var(--accent-color)]/40 transition-all group">
               <Download className="text-zinc-600 group-hover:text-[var(--accent-color)] transition-colors" size={24} />
               <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white">Exportar Core</span>
                  <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-700 mt-1">Backup JSON</span>
               </div>
            </button>
            <label className="flex flex-col items-center justify-center gap-3 p-8 bg-[#0B0B0B] border border-zinc-800 rounded-lg hover:border-[var(--accent-color)]/40 transition-all cursor-pointer group">
               <Upload className="text-zinc-600 group-hover:text-[var(--accent-color)] transition-colors" size={24} />
               <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white">Importar Core</span>
                  <span className="block text-[8px] font-bold uppercase tracking-wide text-zinc-700 mt-1">Restaurar JSON</span>
               </div>
               <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
         </div>

         {/* ZONA DE PERIGO */}
         <div className="pt-12 mt-12 border-t border-zinc-900/50">
            <div className="flex flex-col items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
               <AlertTriangle size={24} className="text-red-900" />
               <div className="text-center">
                  <h4 className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em] mb-2">Zona de Perigo</h4>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-wider max-w-md mx-auto leading-relaxed">
                     Esta ação destruirá irrevogavelmente todos os dados locais deste dispositivo. 
                     Certifique-se de ter exportado um backup antes de prosseguir.
                  </p>
               </div>
               <button 
                  onClick={factoryReset} 
                  className="mt-2 px-8 py-3 bg-transparent border border-red-900/30 text-red-900 rounded hover:bg-red-950/20 hover:border-red-800 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
               >
                  Wipe Core Data
               </button>
            </div>
         </div>
      </section>

    </div>
  );
};

export default SystemPage;
