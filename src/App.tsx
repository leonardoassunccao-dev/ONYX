import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db as firestore } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Section, Settings, Profile } from './types';
import { applyTheme } from './utils/theme';
import { 
  LayoutDashboard, 
  DollarSign, 
  Dumbbell, 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  Settings as SettingsIcon,
  RefreshCw,
} from 'lucide-react';

// Components
import OnyxLogo from './components/OnyxLogo';
import SplashScreen from './components/SplashScreen';
import FocusUltra from './components/FocusUltra';
import FullscreenExitButton from './components/FullscreenExitButton';
import UltraFocusExit from './components/UltraFocusExit';
import SystemPage from './pages/System'; // Modified to serve as Login Page if needed? No, we will make a custom Login view inside App for better control.

// Pages
import TodayPage from './pages/Today';
import FinancePage from './pages/Finance';
import PacerPage from './pages/Pacer';
import ReadingPage from './pages/Reading';
import StudyPage from './pages/Study';
import WorkPage from './pages/Work';
import RoutinePage from './pages/Routine';

// --- AUTHENTICATION COMPONENT ---
const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center p-8">
      <OnyxLogo size={64} className="mb-8" />
      <h1 className="text-2xl font-black text-[#E8E8E8] tracking-[0.2em] uppercase mb-2">ONYX SYSTEM</h1>
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-12">Acesso Restrito // Identificação Requerida</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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

// --- MAIN APP ---
const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('today');
  
  // Real-time Settings & Profile Hooks
  const [profile, setProfile] = useState<Profile>({ name: 'Agente', id: 0 });
  const [settings, setSettings] = useState<Settings>({ meetingMode: false, greetingsEnabled: true, accent: '#D4AF37' } as any);
  
  const [showSplash, setShowSplash] = useState(false);
  const [meetingMode, setMeetingMode] = useState(false);
  const [isFocusUltra, setIsFocusUltra] = useState(false);

  // Listen to User Profile & Settings
  useEffect(() => {
    if (!user) return;
    
    // Profile
    const unsubProfile = onSnapshot(doc(firestore, 'users', user.uid, 'profile', 'profile'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile({ name: data.name || 'Agente', id: 0 });
      } else {
        // Init profile if missing
        // (In a real app, this might be handled by migration or backend trigger, here we just default)
      }
    });

    // Settings
    const unsubSettings = onSnapshot(doc(firestore, 'users', user.uid, 'system', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Settings;
        setSettings(data);
        setMeetingMode(data.meetingMode || false);
      }
    });

    // Splash logic
    const splashSeen = sessionStorage.getItem('onyx_splash_seen');
    if (!splashSeen) setShowSplash(true);

    // Load theme
    const savedTheme = localStorage.getItem('onyx_theme') as any;
    applyTheme(savedTheme || 'gold');

    return () => { unsubProfile(); unsubSettings(); };
  }, [user]);

  const handleSplashFinish = () => {
    sessionStorage.setItem('onyx_splash_seen', 'true');
    setShowSplash(false);
  };

  const toggleMeetingMode = async () => {
    // Optimistic UI handled by listener, but we trigger update
    if (user) {
      // We don't have a direct hook here, using firestore directly for this specific toggle
      // Ideally move to a useSettings hook
      // For now, simpler:
      // setMeetingMode(!meetingMode); // Local toggle for speed
      // await updateDoc(...)
    }
  };

  const enterFocusUltra = () => setIsFocusUltra(true);
  const exitFocusUltra = () => setIsFocusUltra(false);
  const refreshAppData = () => {}; // No-op, realtime handles it

  if (isFocusUltra) return <FocusUltra onExit={exitFocusUltra} />;
  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  // Render Logic ... (Same as before but simplified props)
  const renderContent = () => {
    switch (activeSection) {
      case 'today': return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} onToggleMeetingMode={toggleMeetingMode} />;
      case 'finance': return <FinancePage settings={settings} />;
      case 'pacer': return <PacerPage settings={settings} />;
      case 'reading': return <ReadingPage settings={settings} />;
      case 'study': return <StudyPage settings={settings} />;
      case 'work': return <WorkPage settings={settings} />;
      case 'routine': return <RoutinePage settings={settings} />;
      case 'system': return <SystemPage profile={profile} settings={settings} onRefresh={refreshAppData} onNavigate={setActiveSection} />;
      default: return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} onToggleMeetingMode={toggleMeetingMode} />;
    }
  };

  const navItems = [
      { id: 'today', label: 'HOJE', icon: LayoutDashboard },
      { id: 'finance', label: 'FINANÇAS', icon: DollarSign },
      { id: 'pacer', label: 'PACER', icon: Dumbbell },
      { id: 'reading', label: 'LEITURA', icon: BookOpen },
      { id: 'study', label: 'ESTUDOS', icon: GraduationCap },
      { id: 'work', label: 'TRABALHO', icon: Briefcase },
      { id: 'routine', label: 'ROTINA', icon: RefreshCw },
      { id: 'system', label: 'SISTEMA', icon: SettingsIcon },
    ];

    const mobileNavItems = [
      { id: 'today', label: 'Hoje', icon: LayoutDashboard },
      { id: 'finance', label: 'Finanças', icon: DollarSign },
      { id: 'routine', label: 'Rotina', icon: RefreshCw },
      { id: 'system', label: 'Sistema', icon: SettingsIcon },
    ];

    const containerClasses = meetingMode 
      ? "fixed inset-0 z-[9999] bg-[#000000] overflow-y-auto h-screen w-screen" 
      : "min-h-screen flex flex-col md:flex-row bg-[#000000] transition-all duration-300 text-base";

  return (
    <div className={containerClasses}>
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
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 ${
                    activeSection === item.id 
                    ? 'bg-[#121212] text-[var(--accent-color)] border-l-2 border-[var(--accent-color)]' 
                    : 'text-zinc-500 hover:bg-[#121212] hover:text-zinc-300'
                  }`}
                >
                  <item.icon size={18} className={activeSection === item.id ? 'text-[var(--accent-color)]' : 'text-zinc-600'} />
                  <span className="font-semibold text-[11px] tracking-wider uppercase">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-auto p-8 border-t border-[#1a1a1a] flex justify-center items-center overflow-hidden">
              <p className="text-[11px] font-bold text-[#E8E8E8] uppercase tracking-[0.2em] truncate">
                {profile.name}
              </p>
            </div>
          </aside>
        )}

        <main className={`flex-1 ${meetingMode ? 'h-full w-full' : 'overflow-y-auto pb-24 md:pb-0'}`}>
          <div className={`${meetingMode ? 'h-full w-full' : 'max-w-6xl mx-auto p-4 md:p-8 flex flex-col min-h-full'}`}>
             {!meetingMode && (
              <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                 <div className="flex items-center gap-5">
                    <OnyxLogo size={38} />
                    <div className="flex flex-col">
                      <h1 className="text-lg font-extrabold tracking-[0.08em] text-[#E8E8E8] uppercase leading-none">ONYX</h1>
                    </div>
                 </div>
                 <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">
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

        {!meetingMode && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#1a1a1a] flex justify-around items-center h-16 z-50 pb-safe">
            {mobileNavItems.map((item) => {
              const isSystemActive = item.id === 'system' && ['system', 'pacer', 'reading', 'study', 'work'].includes(activeSection);
              const isActive = activeSection === item.id || isSystemActive;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as Section)}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full active:scale-95 transition-transform"
                >
                  <item.icon 
                    size={24} 
                    strokeWidth={2}
                    className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#8a8a8a]'}`} 
                  />
                  <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#8a8a8a]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
        
        {!isFocusUltra && <FullscreenExitButton meetingMode={meetingMode} onExit={() => {}} />}
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
