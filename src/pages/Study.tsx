import React, { useState } from 'react';
import { Settings } from '../types';
import Card from '../components/Card';
import { Plus, GraduationCap, Clock, Trash2 } from 'lucide-react';
import { useStudy } from '../hooks/useStudy';

const StudyPage: React.FC<{ settings: Settings }> = () => {
  const { sessions, addSession, deleteSession } = useStudy();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', minutes: 45 });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject) return;
    await addSession({ ...formData, date: new Date().toISOString().split('T')[0] });
    setFormData({ subject: '', minutes: 45 });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Estudos</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#C0C0C0] hover:bg-[#D4D4D8] text-[#0b0b0d] p-3 rounded-md transition-all">
          <Plus size={20} />
        </button>
      </header>

      {showForm && (
        <Card accentBorder title="Nova Sessão de Treinamento">
          <form onSubmit={handleAdd} className="space-y-4">
            <input 
              autoFocus
              type="text" 
              placeholder="Assunto / Protocolo"
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm font-bold"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            />
            <div className="flex items-center gap-4">
              <Clock className="text-zinc-600" size={18} />
              <input 
                type="number" 
                placeholder="Minutos"
                className="flex-1 bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm"
                value={formData.minutes}
                onChange={e => setFormData({...formData, minutes: parseInt(e.target.value)})}
              />
            </div>
            <button type="submit" className="w-full bg-[#C0C0C0] text-[#0b0b0d] font-black tracking-widest py-3 rounded-md text-xs uppercase hover:bg-[#D4D4D8]">Log Session</button>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="bg-[#0B0B0B] border border-[#1a1a1a] p-4 rounded-lg flex items-center gap-4 group transition-all hover:border-[#C0C0C0]/20">
            <div className="p-3 bg-zinc-800 text-[#C0C0C0] rounded-md">
              <GraduationCap size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-zinc-200 text-sm tracking-tight">{s.subject}</h4>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">{s.date} • {s.minutes} MIN</p>
            </div>
            <button 
              onClick={() => { if(confirm('Excluir log?')) deleteSession(s.id!); }}
              className="opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-900 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyPage;