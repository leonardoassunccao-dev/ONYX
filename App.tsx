import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db as firestore } from './lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Section, Settings, Profile } from './types';
import { applyTheme } from './utils/theme';
import { 
  LayoutDashboard, 
  Dumbbell, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Settings as SettingsIcon,
  RefreshCw,
  Target,
  Folder,
  Menu,
  X,
} from 'lucide-react';

import OnyxLogo from './components/OnyxLogo';
import SplashScreen from './components/SplashScreen';
import FocusUltra from './components/FocusUltra';
import GlobalSearch from './components/GlobalSearch';
import QuickActionFAB from './components/QuickActionFAB';
import QuickActionModal from './components/QuickActionModal';

import TodayPage from './pages/Today';
import PacerPage from './pages/Pacer';
import ReadingPage from './pages/Reading';
import StudyPage from './pages/Study';
import WorkPage from './pages/Work';
import RoutinePage from './pages/Routine';
import SystemPage from './pages/System';
import GoalsPage from './pages/Goals';
import ProjectsPage from './pages/Projects';

const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center p-8">
      <OnyxLogo size={64} className="mb-8" />
      <h1 className="text-2xl font-black text-[#E8E8E8] tracking-[0.2em] uppercase mb-12">Bem vindo ao ONYX</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {isRegistering && (
          <input 
            type="text" 
            placeholder="NOME DO AGENTE" 
            className="w-full bg-[#0B0B0D] border border-zinc-800 p-4 text-xs font-bold text-white outline-none focus:border-[#D4AF37] uppercase tracking-wider rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        )}
        <input 
          type="email" 
          placeholder="IDENTIFICAÇÃO (EMAIL)" 
          className="w-full bg-[#0B0B0D] border border-zinc-800 p-4 text-xs font-bold text-white outline-none focus:border-[#D4AF37] uppercase tracking-wider rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="SENHA DE ACESSO" 
          className="w-full bg-[#0B0B0D] border border-zinc-800 p-4 text-xs font-bold text-white outline-none focus:border-[#D4AF37] uppercase tracking-wider rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        
        {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#D4AF37] text-black p-4 font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all rounded"
        >
          {loading ? 'Processando...' : (isRegistering ? 'Registrar Agente' : 'Iniciar Uplink')}
        </button>
      </form>

      <button 
        onClick={() => setIsRegistering(!isRegistering)}
        className="mt-6 text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors"
      >
        {isRegistering ? 'Voltar para Login' : 'Criar Nova Identidade'}
      </button>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('today');
  
  const [profile, setProfile] = useState<Profile>({ name: 'AGENTE', id: 0 });
  const [settings, setSettings] = useState<Settings>({ meetingMode: false, greetingsEnabled: true, accent: '#D4AF37' } as any);
  
  const [showSplash, setShowSplash] = useState(false);
  const [isFocusUltra, setIsFocusUltra] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState<string | null>(null);

  const openQuickAction = (type: string | null = null) => {
    setQuickActionType(type);
    setIsQuickActionOpen(true);
  };

  useEffect(() => {
    if (!user) return;
    
    // Escuta o perfil no caminho users/{uid}/profile/profile
    const unsubProfile = onSnapshot(doc(firestore, 'users', user.uid, 'profile', 'profile'), (doc) => {
      const dbName = doc.exists() ? doc.data()?.name : null;
      setProfile({ 
        name: dbName || user.displayName || 'AGENTE', 
        id: user.uid 
      });
    });

    const unsubSettings = onSnapshot(doc(firestore, 'users', user.uid, 'system', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Settings;
        setSettings(data);
      }
    });

    const splashSeen = sessionStorage.getItem('onyx_splash_seen');
    if (!splashSeen) setShowSplash(true);

    const savedTheme = localStorage.getItem('onyx_theme') as any;
    applyTheme(savedTheme || 'gold');

    return () => { unsubProfile(); unsubSettings(); };
  }, [user]);

  const handleSplashFinish = () => {
    sessionStorage.setItem('onyx_splash_seen', 'true');
    setShowSplash(false);
  };

  const toggleMeetingMode = async () => {
    if (!user) return;
    await setDoc(doc(firestore, 'users', user.uid, 'system', 'settings'), { 
      meetingMode: !settings.meetingMode,
      updatedAt: serverTimestamp() 
    }, { merge: true });
  };

  const enterFocusUltra = () => setIsFocusUltra(true);
  const exitFocusUltra = () => setIsFocusUltra(false);
  const refreshAppData = () => {};

  // Handle Escape and Double Tap for Meeting Mode
  useEffect(() => {
    let lastTap = 0;
    const handleDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        if (settings.meetingMode) toggleMeetingMode();
      }
      lastTap = now;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Escape' && settings.meetingMode) {
        toggleMeetingMode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      
      // Global quick actions
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isSearchOpen && !isQuickActionOpen) {
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          openQuickAction('task');
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          openQuickAction('goal');
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          openQuickAction('project');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (settings.meetingMode) {
      window.addEventListener('touchstart', handleDoubleTap);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleDoubleTap);
    };
  }, [settings.meetingMode, isSearchOpen, isQuickActionOpen]);

  if (isFocusUltra) return <FocusUltra onExit={exitFocusUltra} />;
  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  const renderContent = () => {
    switch (activeSection) {
      case 'today': return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} onToggleMeetingMode={toggleMeetingMode} />;
      case 'pacer': return <PacerPage settings={settings} />;
      case 'reading': return <ReadingPage settings={settings} />;
      case 'study': return <StudyPage settings={settings} />;
      case 'work': return <WorkPage settings={settings} />;
      case 'routine': return <RoutinePage settings={settings} />;
      case 'goals': return <GoalsPage />;
      case 'projects': return <ProjectsPage />;
      case 'system': return <SystemPage profile={profile} settings={settings} onRefresh={refreshAppData} onNavigate={setActiveSection} />;
      default: return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} onToggleMeetingMode={toggleMeetingMode} />;
    }
  };

  const navItems = [
      { id: 'today', label: 'HOJE', icon: LayoutDashboard },
      { id: 'goals', label: 'METAS', icon: Target },
      { id: 'projects', label: 'PROJETOS', icon: Folder },
      { id: 'pacer', label: 'PACER', icon: Dumbbell },
      { id: 'reading', label: 'LEITURA', icon: BookOpen },
      { id: 'study', label: 'ESTUDOS', icon: GraduationCap },
      { id: 'work', label: 'TRABALHO', icon: Briefcase },
      { id: 'routine', label: 'ROTINA', icon: RefreshCw },
      { id: 'system', label: 'SISTEMA', icon: SettingsIcon },
    ];

    const meetingMode = settings.meetingMode;
    const containerClasses = meetingMode 
      ? "fixed inset-0 z-[9999] bg-[#000000] overflow-y-auto h-screen w-screen" 
      : "min-h-screen flex flex-col md:flex-row bg-[#000000] transition-all duration-300 text-base relative overflow-x-hidden";

  return (
    <div className={containerClasses}>
       {/* Mobile Sidebar Overlay */}
       {!meetingMode && isMobileMenuOpen && (
         <div 
           className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] transition-opacity duration-300"
           onClick={() => setIsMobileMenuOpen(false)}
         />
       )}

       {/* Mobile Sidebar Drawer */}
       {!meetingMode && (
         <aside className={`md:hidden fixed top-0 left-0 h-full w-72 bg-[#050505] border-r border-[#1a1a1a] z-[70] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="p-6 flex flex-col h-full">
             <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                 <OnyxLogo size={38} />
                 <h1 className="text-lg font-extrabold tracking-[0.08em] text-[#E8E8E8] uppercase leading-none">ONYX</h1>
               </div>
               <button 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-2 text-zinc-500 hover:text-white transition-colors"
               >
                 <X size={24} />
               </button>
             </div>
             
             <nav className="flex-1 space-y-1 overflow-y-auto">
               {navItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => {
                     setActiveSection(item.id as Section);
                     setIsMobileMenuOpen(false);
                   }}
                   className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-all duration-250 group ${
                     activeSection === item.id 
                     ? 'bg-[#121212] text-[var(--accent-color)] border-l-2 border-[var(--accent-color)]' 
                     : 'text-zinc-400 hover:bg-[#121212] hover:text-zinc-200'
                   }`}
                 >
                   <item.icon size={20} className={activeSection === item.id ? 'text-[var(--accent-color)]' : 'text-zinc-500'} />
                   <span className="font-semibold text-[12px] tracking-wider uppercase">{item.label}</span>
                 </button>
               ))}
             </nav>
           </div>
         </aside>
       )}

       {!meetingMode && (
          <aside className="hidden md:flex flex-col w-64 bg-[#050505] border-r border-[#1a1a1a] p-4 sticky top-0 h-screen z-20">
            <div className="mb-14 px-4 flex items-center gap-5">
              <OnyxLogo size={46} />
              <div className="flex flex-col">
                <h1 className="text-xl font-extrabold tracking-[0.08em] text-[#E8E8E8] uppercase leading-none">ONYX</h1>
              </div>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as Section)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-250 group ${
                    activeSection === item.id 
                    ? 'bg-[#121212] text-[var(--accent-color)] border-l-2 border-[var(--accent-color)] shadow-[inset_4px_0_10px_rgba(212,175,55,0.05)]' 
                    : 'text-zinc-400 hover:bg-[#121212] hover:text-zinc-200 hover:translate-x-1'
                  }`}
                >
                  <item.icon size={18} className={`transition-colors duration-250 ${activeSection === item.id ? 'text-[var(--accent-color)]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="font-semibold text-[11px] tracking-wider uppercase">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className={`flex-1 ${meetingMode ? 'h-full w-full' : 'overflow-y-auto'}`}>
          <div className={`${meetingMode ? 'h-full w-full' : 'max-w-6xl mx-auto p-4 md:p-8 flex flex-col min-h-full'}`}>
             {!meetingMode && (
              <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Menu size={24} />
                    </button>
                    <OnyxLogo size={32} />
                    <h1 className="text-lg font-extrabold tracking-[0.08em] text-[#E8E8E8] uppercase leading-none">ONYX</h1>
                 </div>
                 <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">
                    ONLINE
                 </div>
              </div>
            )}
            <div className="flex-1">{renderContent()}</div>
            {!meetingMode && (
              <footer className="mt-16 py-8 text-center border-t border-[#1a1a1a]">
                <p className="text-[#f5f5f5] text-[10px] font-black tracking-widest uppercase mb-2">ONYX © 2026</p>
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">CLOUD UPLINK ACTIVE</p>
              </footer>
            )}
          </div>
        </main>

        {!meetingMode && <QuickActionFAB onActionSelect={openQuickAction} />}
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <QuickActionModal isOpen={isQuickActionOpen} onClose={() => setIsQuickActionOpen(false)} initialAction={quickActionType} />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
};

const AppGate: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-[#D4AF37] font-black uppercase tracking-widest text-xs">Aguardando Uplink...</div>;
  return user ? <MainApp /> : <LoginScreen />;
};

export default App;