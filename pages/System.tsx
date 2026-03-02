import React, { useState } from 'react';
import { Profile, Settings, Section } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { applyTheme } from '../utils/theme';
import Card from '../components/Card';
import { 
  User, Monitor, LogOut, Edit2, Check, X, Terminal, 
  Palette, Shield
} from 'lucide-react';

interface SystemProps {
  profile: Profile;
  settings: Settings;
  onRefresh: () => void;
  onNavigate?: (section: Section) => void;
}

const SystemPage: React.FC<SystemProps> = ({ profile, settings, onRefresh, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const saveName = async () => {
    if (!user) return;
    const trimmed = tempName.trim();
    if (trimmed) {
      await setDoc(doc(db, 'users', user.uid, 'profile', 'profile'), { name: trimmed }, { merge: true });
    }
    setIsEditingName(false);
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setTempName(profile.name);
  };

  const toggleMeetingMode = async () => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'system', 'settings'), { meetingMode: !settings.meetingMode }, { merge: true });
  };

  const handleThemeChange = (theme: 'gold' | 'silver' | 'emerald') => {
    applyTheme(theme);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-24 space-y-16">
      <header className="border-b border-[#1a1a1a] pb-6">
        <h2 className="text-3xl font-black text-[#E8E8E8] tracking-[0.2em] uppercase">SISTEMA</h2>
        <div className="flex items-center gap-2 mt-2">
           <Terminal size={12} className="text-[var(--accent-color)]" />
           <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-black">Onyx Core Environment (Cloud Uplink)</p>
        </div>
      </header>

      <section className="space-y-6">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    className="flex items-center justify-between p-3 rounded-xl border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#D4AF37]/30 hover:border-[#D4AF37]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Gold</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'gold' && <Check size={14} className="text-[#D4AF37]" />}
                  </button>

                  <button 
                    onClick={() => handleThemeChange('silver')}
                    className="flex items-center justify-between p-3 rounded-xl border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#D1D5DB]/30 hover:border-[#D1D5DB]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#D1D5DB] shadow-[0_0_10px_rgba(209,213,219,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Silver</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'silver' && <Check size={14} className="text-[#D1D5DB]" />}
                  </button>

                  <button 
                    onClick={() => handleThemeChange('emerald')}
                    className="flex items-center justify-between p-3 rounded-xl border bg-[#0B0B0B] hover:bg-[#121212] transition-all group border-[#34D399]/30 hover:border-[#34D399]"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.4)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Dark Emerald</span>
                     </div>
                     {localStorage.getItem('onyx_theme') === 'emerald' && <Check size={14} className="text-[#34D399]" />}
                  </button>
               </div>
            </Card>

            <Card accentBorder className="flex flex-col justify-between">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className={settings.meetingMode ? "text-[var(--accent-color)]" : "text-zinc-600"} size={18} />
                      <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">Modo Reunião</span>
                      <button 
                        onClick={toggleMeetingMode}
                        className={`w-10 h-5 rounded-full transition-all relative ml-2 ${settings.meetingMode ? 'bg-[var(--accent-color)]' : 'bg-zinc-800'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${settings.meetingMode ? 'left-5.5 bg-[#0b0b0d]' : 'left-0.5 bg-zinc-500'}`} />
                      </button>
                    </div>
                    <p className="text-[9px] font-black text-[var(--accent-color)] uppercase tracking-widest mb-1">Status: Conectado</p>
                    <p className="text-sm font-bold text-white font-mono">{user?.email}</p>
                  </div>
                  <Shield size={20} className="text-[var(--accent-color)]" />
               </div>
               <button 
                 onClick={logout}
                 className="flex items-center justify-center gap-2 bg-[#121212] border border-zinc-800 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all mt-6"
               >
                 <LogOut size={14} />
                 Encerrar Sessão
               </button>
            </Card>
         </div>
      </section>
    </div>
  );
};

export default SystemPage;