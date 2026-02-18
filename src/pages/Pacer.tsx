import React, { useState } from 'react';
import { PacerWorkout, Settings } from '../types';
import Card from '../components/Card';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { usePacer } from '../hooks/usePacer';

const PacerPage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const { workouts, addWorkout, toggleWorkout, deleteWorkout } = usePacer();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'run' as PacerWorkout['type'],
    durationMin: 30,
    plannedDate: new Date().toISOString().split('T')[0]
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addWorkout({ ...formData, done: false });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Pacer Ops</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#C0C0C0] hover:bg-[#D4D4D8] text-[#0b0b0d] p-3 rounded-md transition-all">
          <Plus size={20} />
        </button>
      </header>

      {showForm && (
        <Card accentBorder title="Protocolo de Treino">
          <form onSubmit={handleAdd} className="space-y-4">
            <select 
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm uppercase font-black"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value as any})}
            >
              <option value="run">Corrida</option>
              <option value="rope">Corda</option>
              <option value="gym">Academia</option>
              <option value="tennis">Tênis</option>
              <option value="other">Outro</option>
            </select>
            <input 
              type="date" 
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm"
              value={formData.plannedDate}
              onChange={e => setFormData({...formData, plannedDate: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Duração (min)"
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm"
              value={formData.durationMin}
              onChange={e => setFormData({...formData, durationMin: parseInt(e.target.value)})}
            />
            <button type="submit" className="w-full bg-[#C0C0C0] text-[#0b0b0d] font-black tracking-widest py-3 rounded-md text-xs uppercase hover:bg-[#D4D4D8]">Confirmar Missão</button>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {workouts.map(w => (
          <div key={w.id} className="flex items-center gap-4 bg-[#0B0B0B] border border-[#1a1a1a] p-4 rounded-lg group transition-all hover:border-[#C0C0C0]/30">
            <button onClick={() => toggleWorkout(w)} className="text-[#C0C0C0]">
              {w.done ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-zinc-700" />}
            </button>
            <div className="flex-1">
              <p className={`font-black text-zinc-200 uppercase tracking-widest text-xs ${w.done ? 'line-through text-zinc-600' : ''}`}>{w.type}</p>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">{w.plannedDate} • {w.durationMin} MIN</p>
            </div>
            <button onClick={() => deleteWorkout(w.id!)} className="text-zinc-800 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PacerPage;
