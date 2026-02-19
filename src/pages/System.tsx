import React, { useState, useEffect } from 'react';
import { Profile, Settings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
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
  onNavigate?: (section: any) => void;
}

const SystemPage: React.FC<SystemProps> = ({ profile, settings, onRefresh }) => {
  const { user, logout } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Garante que o nome seja exibido corretamente (Profile > Auth > Fallback)
  const currentDisplayName = profile.name || user?.displayName || "AGENTE";
  const [tempName, setTempName] = useState(currentDisplayName);

  useEffect(() => {
    if (!isEditingName) {
      setTempName(currentDisplayName);
    }
  }, [currentDisplayName, isEditingName]);

  const saveName = async () => {
    if (!user) return;
    const trimmed = tempName.trim();
    if (trimmed) {
      try {
        // CORREÇÃO CRÍTICA: Usar setDoc com merge em vez de updateDoc
        await setDoc(doc(db, 'users', user.uid, 'profile', 'profile'), { 
          name: trimmed 
        }, { merge: true });
        
        // Atualiza também o profile do Auth para consistência
        await updateProfile(user, { displayName: trimmed });
      } catch (error) {
        console.error("Erro ao salvar nome:", error);
      }
    }
    setIsEditingName(false);
  };

  const cancelEdit = () => {
    setIsEditingName(false);
    setTempName(currentDisplayName);
  };

  const toggleMeetingMode = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'system', 'settings'), { 
        meetingMode: !settings.meetingMode 
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao alternar modo reunião:", error);
    }
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
         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <User size={12} className="text-[var(--accent-color)]" /> Identidade & Acesso
         </h3>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                           placeholder="NOME"
                        />
                        <div className="flex gap-2">
                           <button 
                            onClick={saveName} 
                            className="flex-1 bg-[var(--accent-color)] text-black py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                           >
                             <Check size={12} /> Salvar
                           </button>
                           <button 
                            onClick={cancelEdit} 
                            className="flex-1 bg-zinc-800 text-zinc-400 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
                           >
                             <X size={12} /> Cancelar
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Operador</p>
                        <h1 className="text-3xl font-black text-white uppercase tracking-wider">{currentDisplayName}</h1>
                        <p className="text-[9px] text-[var(--accent-color)] font-bold uppercase tracking-[0.5em] mt-2 opacity-80 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] animate-pulse"></span>
                           Status: Conexão Criptografada
                        </p>
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

            <Card className="flex flex-col justify-between">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-[var(--accent-color)]" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Protocolo Visual</span>
                  </div>
               </div>

               <div className="flex-1 flex flex-col justify-center gap-4">
                  {[
                    { id: 'gold', label: 'Dark Gold', color: '#D4AF37' },
                    { id: 'silver', label: 'Dark Silver', color: '#D1D5DB' },
                    { id: 'emerald', label: 'Dark Emerald', color: '#34D399' }
                  ].map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => handleThemeChange(t.id as any)}
                      className="flex items-center justify-between p-3 rounded border bg-[#0B0B0B] hover:bg-[#121212] transition-all group"
                      style={{ borderColor: localStorage.getItem('onyx_theme') === t.id ? t.color : 'rgba(255,255,255,0.05)' }}
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}66` }}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">{t.label}</span>
                       </div>
                       {localStorage.getItem('onyx_theme') === t.id && <Check size={14} style={{ color: t.color }} />}
                    </button>
                  ))}
               </div>
            </Card>

            <Card accentBorder className="flex flex-col justify-between lg:col-span-2">
               <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-[var(--accent-color)] uppercase tracking-widest mb-1">Sessão Ativa</p>
                    <p className="text-sm font-bold text-white font-mono">{user?.email}</p>
                    <p className="text-[8px] text-zinc-500 mt-2 uppercase tracking-wide">ID: {user?.uid.substring(0, 12)}...</p>
                  </div>
                  <Shield size={20} className="text-[var(--accent-color)]" />
               </div>
               <button 
                 onClick={logout}
                 className="flex items-center justify-center gap-2 bg-[#121212] border border-zinc-800 text-zinc-400 py-3 rounded text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all mt-6"
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