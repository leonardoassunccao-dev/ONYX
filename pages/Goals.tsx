import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const GoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'short' | 'medium' | 'long'>('short');
  const { goals, addGoal, deleteGoal, toggleActive } = useGoals();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const currentGoals = goals.filter(g => {
    if (!g.dueDate) return activeTab === 'long';
    const days = (new Date(g.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (activeTab === 'short') return days <= 90;
    if (activeTab === 'medium') return days > 90 && days <= 365;
    return days > 365;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    
    await addGoal({
      title: newTitle.trim(),
      session: 'general',
      type: 'one_time',
      metricType: 'boolean',
      targetValue: 1,
      dueDate: newDeadline || null,
      active: true
    });
    
    setNewTitle('');
    setNewDeadline('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteGoal(id);
  };

  const handleToggle = async (goal: any) => {
    if (!user) return;
    // For boolean goals in this page, we use 'done' property directly for simplicity in the UI
    // but the hook uses 'active' for some logic. Let's stick to the hook's updateDoc pattern if needed.
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'users', user.uid, 'session_goals', goal.id), { done: !goal.done });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Target className="text-[var(--accent-color)]" size={32} />
            Sistema de Metas
          </h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium tracking-wide">Gerenciamento estratégico de objetivos</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-[var(--accent-color)] text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
        >
          <Plus size={16} /> Nova Meta
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#0B0B0D] border border-zinc-800 p-6 rounded-xl flex gap-4 animate-in slide-in-from-top-4 flex-wrap">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nome da meta..."
            className="flex-1 min-w-[200px] bg-transparent border-b border-zinc-800 pb-2 text-white outline-none focus:border-[var(--accent-color)] transition-colors"
            autoFocus
            required
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="bg-transparent border-b border-zinc-800 pb-2 text-zinc-400 outline-none focus:border-[var(--accent-color)] transition-colors"
          />
          <button type="submit" className="bg-[var(--accent-color)] text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
            Adicionar
          </button>
          <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition-colors">
            Cancelar
          </button>
        </form>
      )}

      <div className="flex gap-4 border-b border-zinc-800 pb-4">
        {[
          { id: 'short', label: 'Curto Prazo', desc: '< 3 meses' },
          { id: 'medium', label: 'Médio Prazo', desc: '3-12 meses' },
          { id: 'long', label: 'Longo Prazo', desc: '> 1 ano' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-start px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-900 border border-zinc-700' 
                : 'hover:bg-zinc-900/50 border border-transparent text-zinc-500'
            }`}
          >
            <span className={`text-sm font-bold uppercase tracking-wider ${activeTab === tab.id ? 'text-[var(--accent-color)]' : ''}`}>
              {tab.label}
            </span>
            <span className="text-[10px] text-zinc-600 font-medium">{tab.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {currentGoals.length === 0 ? (
          <div className="text-center py-12 border border-zinc-800 border-dashed rounded-xl">
            <Target size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Nenhuma meta definida para este período.</p>
          </div>
        ) : (
          currentGoals.map(goal => (
            <div key={goal.id} className="bg-[#0B0B0D] border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors group relative">
              <button 
                onClick={() => handleDelete(goal.id as string)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleToggle(goal)}
                    className="text-zinc-600 hover:text-[var(--accent-color)] transition-colors"
                  >
                    {goal.done ? <CheckCircle2 size={24} className="text-[var(--accent-color)]" /> : <Circle size={24} />}
                  </button>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${goal.done ? 'text-zinc-500 line-through' : 'text-white group-hover:text-[var(--accent-color)]'}`}>{goal.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 font-medium">
                      {goal.dueDate && <span className="flex items-center gap-1"><Clock size={12} /> Prazo: {goal.dueDate}</span>}
                      <span className={`flex items-center gap-1 ${goal.done ? 'text-zinc-500' : 'text-[var(--accent-color)]'}`}><AlertCircle size={12} /> {goal.done ? 'Concluída' : 'Em andamento'}</span>
                    </div>
                  </div>
                </div>
                <span className="text-2xl font-mono font-bold text-white pr-8">{goal.done ? '100' : '0'}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-color)] transition-all duration-1000" 
                  style={{ width: `${goal.done ? 100 : 0}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsPage;
