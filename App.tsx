import React, { useState, useEffect } from 'react';
import { db, ensureInitialData } from './db';
import { Section, Settings, Profile } from './types';
import { toError, logDiagnostic } from './utils/error';
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

// Pages
import TodayPage from './pages/Today';
import FinancePage from './pages/Finance';
import PacerPage from './pages/Pacer';
import ReadingPage from './pages/Reading';
import StudyPage from './pages/Study';
import WorkPage from './pages/Work';
import RoutinePage from './pages/Routine';
import SystemPage from './pages/System';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('today');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus Ultra State
  const [isFocusUltra, setIsFocusUltra] = useState(false);

  // Helper to merge DB profile with LocalStorage name preference
  const resolveProfile = (dbProfile: Profile): Profile => {
    const localName = localStorage.getItem('onyx_agent_name');
    if (localName) {
      return { ...dbProfile, name: localName };
    }
    return dbProfile;
  };

  useEffect(() => {
    // Initialize Theme
    const savedTheme = localStorage.getItem('onyx_theme') as 'gold' | 'silver' | 'emerald';
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme('gold');
    }

    const init = async () => {
      try {
        await ensureInitialData();
        const p = await db.profile.toArray();
        const s = await db.settings.toArray();
        
        if (p.length === 0 || s.length === 0) {
          throw new Error("Core data mismatch during initialization: Profile or Settings missing.");
        }
        
        setProfile(resolveProfile(p[0]));
        setSettings(s[0]);

        // Check for Focus Ultra Persistence
        const focusPersist = localStorage.getItem('onyxFocusUltraEnabled') === 'true';
        if (focusPersist) {
          setIsFocusUltra(true);
        }

        // Check for Session Splash logic
        const splashSeen = sessionStorage.getItem('onyx_splash_seen');
        if (!splashSeen && !focusPersist) { 
          setShowSplash(true);
        } else {
          setInitialized(true);
        }
      } catch (err: unknown) {
        const normalized = logDiagnostic("App Initialization", err);
        setError(normalized.message);
      }
    };
    init();
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem('onyx_splash_seen', 'true');
    setShowSplash(false);
    setInitialized(true);
  };

  const refreshAppData = async () => {
    try {
      const p = await db.profile.toArray();
      const s = await db.settings.toArray();
      if (p.length > 0) setProfile(resolveProfile(p[0]));
      if (s.length > 0) setSettings(s[0]);
    } catch (err) {
      logDiagnostic("Refresh Data", err);
    }
  };

  const enterFocusUltra = async () => {
    setIsFocusUltra(true);
    localStorage.setItem('onyxFocusUltraEnabled', 'true');
    
    // Attempt fullscreen immediately on user action
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        localStorage.setItem('onyxFocusUltraFullscreenPreferred', 'true');
      }
    } catch (e) {
      console.warn("Fullscreen blocked by browser logic", e);
    }
  };

  const exitFocusUltra = () => {
    setIsFocusUltra(false);
    localStorage.setItem('onyxFocusUltraEnabled', 'false');
  };

  // Main Render Logic Wrapper to support Global Overlays
  const renderAppContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#000000] text-red-900 p-8 text-center">
          <h1 className="text-xl font-black tracking-[0.2em] mb-4">SYSTEM CRITICAL ERROR</h1>
          <p className="text-xs font-mono bg-red-900/10 p-4 rounded border border-red-900/30 w-full max-w-md break-words">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 border border-red-900/40 text-[10px] font-black uppercase tracking-widest hover:bg-red-900 hover:text-white transition-all"
          >
            Attempt Hot Reboot
          </button>
        </div>
      );
    }

    // Focus Ultra Render Interception
    if (isFocusUltra) {
      return <FocusUltra onExit={exitFocusUltra} />;
    }

    // Splash Screen Render Interception
    if (showSplash) {
      return <SplashScreen onFinish={handleSplashFinish} />;
    }

    if (!initialized || !settings || !profile) {
      // Fallback minimal loader if needed between Splash and App, usually instant.
      return <div className="h-screen bg-[#000000]" />;
    }

    const renderContent = () => {
      switch (activeSection) {
        case 'today': return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} />;
        case 'finance': return <FinancePage settings={settings} />;
        case 'pacer': return <PacerPage settings={settings} />;
        case 'reading': return <ReadingPage settings={settings} />;
        case 'study': return <StudyPage settings={settings} />;
        case 'work': return <WorkPage settings={settings} />;
        case 'routine': return <RoutinePage settings={settings} />;
        case 'system': return <SystemPage profile={profile} settings={settings} onRefresh={refreshAppData} onNavigate={setActiveSection} />;
        default: return <TodayPage profile={profile} settings={settings} onRefresh={refreshAppData} onEnterFocus={enterFocusUltra} onNavigate={setActiveSection} />;
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

    // In Meeting Mode, we remove padding and text sizing adjustments to let the Page handle the full viewport
    const appClasses = `min-h-screen flex flex-col md:flex-row bg-[#000000] transition-all duration-300 ${settings.meetingMode ? 'overflow-hidden h-screen' : 'text-base'}`;

    // Mobile Bottom Nav Items (Apple Minimal)
    const mobileNavItems = [
      { id: 'today', label: 'Hoje', icon: LayoutDashboard },
      { id: 'finance', label: 'Finanças', icon: DollarSign },
      { id: 'routine', label: 'Rotina', icon: RefreshCw },
      { id: 'system', label: 'Sistema', icon: SettingsIcon },
    ];

    return (
      <div className={appClasses}>
        {/* Desktop Sidebar - Hidden in Meeting Mode */}
        {!settings.meetingMode && (
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

        {/* Main Content Area */}
        <main className={`flex-1 ${settings.meetingMode ? 'h-screen overflow-hidden' : 'overflow-y-auto pb-24 md:pb-0'}`}>
          <div className={`${settings.meetingMode ? 'h-full w-full' : 'max-w-6xl mx-auto p-4 md:p-8 flex flex-col min-h-full'}`}>
            {/* Mobile Header - Hidden in Meeting Mode */}
            {!settings.meetingMode && (
              <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                 <div className="flex items-center gap-5">
                    <OnyxLogo size={38} />
                    <div className="flex flex-col">
                      <h1 className="text-lg font-extrabold tracking-[0.08em] text-[#E8E8E8] uppercase leading-none">ONYX</h1>
                    </div>
                 </div>
                 <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded">
                    SECURED
                 </div>
              </div>
            )}
            
            <div className="flex-1">
              {renderContent()}
            </div>

            {/* GLOBAL FOOTER */}
            {!settings.meetingMode && (
              <footer className="mt-16 py-8 text-center border-t border-[#1a1a1a]">
                <p className="text-[#f5f5f5] text-[10px] font-black tracking-widest uppercase mb-2">ONYX © 2026</p>
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Projeto pessoal de Leonardo Assunção</p>
              </footer>
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Apple Minimal Style */}
        {!settings.meetingMode && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#000000] border-t border-[#1a1a1a] flex justify-around items-center h-16 z-50 pb-safe">
            {mobileNavItems.map((item) => {
              // Determine active state logic (System active if section is system OR one of the sub-modules)
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
      </div>
    );
  };

  return (
    <>
      <FullscreenExitButton />
      {renderAppContent()}
    </>
  );
};

export default App;