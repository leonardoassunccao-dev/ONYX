import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { useHabits } from '../hooks/useHabits';
import { useGoals } from '../hooks/useGoals';
import { Settings, Habit, SessionGoal } from '../types';
import Card from '../components/Card';
import GoalsSection from '../components/GoalsSection';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Activity, 
  Calendar, 
  BarChart3, 
  Zap, 
  Target, 
  Clock,
  LayoutGrid,
  Trash2,
  X
} from 'lucide-react';

const RoutinePage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const { habits, getTodayHabits, getProgress, toggleBooleanHabit, addCheckin, createHabit, deleteHabit } = useHabits();
  const { goals, calculateProgress } = useGoals('routine');
  
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '',
    type: 'count',
    targetValue: 1,
    daysOfWeek: [0,1,2,3,4,5,6],
    active: true
  });

  const [showCheckInHabit, setShowCheckInHabit] = useState<number | null>(null);
  const [habitCheckInVal, setHabitCheckInVal] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHabits = getTodayHabits();
  
  const indicators = useMemo(() => {
    if (!habits.length) return { consistency: 0, activeDays: 0, totalHabits: 0 };
    
    const totalToday = todayHabits.length;
    const completedToday = todayHabits.filter(h => getProgress(h).isMet).length;
    const consistency = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
    
    return {
      consistency: Math.round(consistency),
      activeDays: 1,
      totalHabits: habits.length
    };
  }, [habits, todayHabits]);

  const handleHabitCheckIn = async (habitId: number) => {
    const val = parseFloat(habitCheckInVal);
    if (isNaN(val)) return;
    await addCheckin(habitId, val);
    setHabitCheckInVal('');
    setShowCheckInHabit(null);
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;
    await createHabit(newHabit as Habit);
    setNewHabit({ title: '', type: 'count', targetValue: 1, daysOfWeek: [0,1,2,3,4,5,6], active: true });
    setShowHabitForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Protocolo de Rotina</h2>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Sincronização de Hábitos & Metas Pessoais</p>
        </div>
        <button 
          onClick={() => setShowHabitForm(!showHabitForm)}
          className="bg-[#C0C0C0] text-[#0b0b0d] p-3 rounded-md hover:bg-white transition-all flex items-center gap-2"
        >
          {showHabitForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </header>

      {/* NEW HABIT FORM */}
      {showHabitForm && (
        <Card accentBorder title="Novo Protocolo de Hábito" className="animate-in slide-in-from-top-4">
          <form onSubmit={handleCreateHabit} className="space-y-4">
            <input 
              autoFocus
              type="text" 
              placeholder="NOME DO HÁBITO" 
              className="w-full bg-[#121212] border border-zinc-800 p-3 rounded text-xs text-white uppercase font-bold tracking-widest outline-none focus:border-[#C0C0C0]"
              value={newHabit.title}
              onChange={e => setNewHabit({...newHabit, title: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-2">
              <select 
                className="bg-[#121212] border border-zinc-800 p-3 rounded text-[10px] font-black uppercase text-zinc-400 outline-none"
                value={newHabit.type}
                onChange={e => setNewHabit({...newHabit, type: e.target.value as any})}
              >
                <option value="count">QUANTIDADE</option>
                <option value="minutes">MINUTOS</option>
                <option value="boolean">CHECK ÚNICO</option>
              </select>
              <input 
                type="number" 
                placeholder="META"
                disabled={newHabit.type === 'boolean'}
                className="w-full bg-[#121212] border border-zinc-800 p-3 rounded text-xs text-white outline-none disabled:opacity-30"
                value={newHabit.targetValue}
                onChange={e => setNewHabit({...newHabit, targetValue: parseInt(e.target.value)})}
              />
            </div>
            <button type="submit" className="w-full bg-[#C0C0C0] text-[#0b0b0d] py-3 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Ativar Protocolo</button>
          </form>
        </Card>
      )}

      {/* INDICATORS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group border-b border-b-[#C0C0C0]/20">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Consistência Hoje</p>
                <p className="text-3xl font-black text-[#E8E8E8] tracking-tight">{indicators.consistency}%</p>
             </div>
             <BarChart3 className="text-zinc-900" size={40} />
          </div>
          <div className="mt-4 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div className="h-full bg-[#C0C0C0] transition-all" style={{ width: `${indicators.consistency}%` }} />
          </div>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Protocolos Ativos</p>
                <p className="text-3xl font-black text-[#E8E8E8] tracking-tight">{indicators.totalHabits}</p>
             </div>
             <Activity className="text-zinc-900" size={40} />
          </div>
          <p className="text-[8px] text-zinc-700 font-black uppercase mt-4 tracking-widest">Sistemas Operacionais</p>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status Temporal</p>
                <p className="text-3xl font-black text-[#E8E8E8] tracking-tight">Ativo</p>
             </div>
             <Calendar className="text-zinc-900" size={40} />
          </div>
          <p className="text-[8px] text-zinc-700 font-black uppercase mt-4 tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}</p>
        </Card>
      </section>

      {/* HABITS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" /> HÁBITOS DO DIA
          </h3>
          {todayHabits.length > 0 && (
            <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{todayHabits.filter(h => getProgress(h).isMet).length} / {todayHabits.length} CONCLUÍDOS</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayHabits.map(habit => {
            const stats = getProgress(habit);
            return (
              <Card key={habit.id} className="relative group hover:border-[#C0C0C0]/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className={`text-[11px] font-black uppercase tracking-tight ${stats.isMet ? 'text-white' : 'text-zinc-500'}`}>{habit.title}</h4>
                    <p className="text-[7px] text-zinc-800 font-bold uppercase tracking-widest">Type: {habit.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if(confirm('Excluir hábito?')) deleteHabit(habit.id!); }} className="text-zinc-900 hover:text-red-900 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                    {stats.isMet ? <CheckCircle2 size={16} className="text-[#C0C0C0]" /> : <Circle size={16} className="text-zinc-800" />}
                  </div>
                </div>

                {habit.type !== 'boolean' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-zinc-600">{stats.current} / {habit.targetValue} {habit.type === 'minutes' ? 'min' : ''}</span>
                      <span className="text-zinc-400">{Math.round(stats.percent)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C0C0C0] transition-all" style={{ width: `${stats.percent}%` }} />
                    </div>
                  </div>
                )}

                {habit.type === 'boolean' ? (
                  <button 
                    onClick={() => toggleBooleanHabit(habit.id!)}
                    className={`w-full py-2 border rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                      stats.isMet ? 'bg-[#C0C0C0]/10 border-transparent text-[#C0C0C0]' : 'bg-transparent border-zinc-900 text-zinc-600 hover:text-white'
                    }`}
                  >
                    {stats.isMet ? 'Registrado' : 'Marcar'}
                  </button>
                ) : (
                  showCheckInHabit === habit.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleHabitCheckIn(habit.id!); }} className="flex gap-1">
                      <input 
                        autoFocus type="number" 
                        className="flex-1 bg-[#121212] border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none"
                        value={habitCheckInVal}
                        onChange={e => setHabitCheckInVal(e.target.value)}
                      />
                      <button type="submit" className="bg-[#C0C0C0] text-[#0b0b0d] px-3 rounded text-[9px] font-black uppercase">Ok</button>
                      <button type="button" onClick={() => setShowCheckInHabit(null)} className="text-zinc-600 px-2 text-[9px] font-black uppercase">X</button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setShowCheckInHabit(habit.id!)}
                      className={`w-full py-2 border rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                        stats.isMet ? 'bg-[#C0C0C0]/10 border-transparent text-[#C0C0C0]' : 'bg-transparent border-zinc-800 text-zinc-600 hover:text-white'
                      }`}
                    >
                      Check-In
                    </button>
                  )
                )}
              </Card>
            );
          })}
          {todayHabits.length === 0 && !showHabitForm && (
             <div className="col-span-full py-16 border border-dashed border-[#1a1a1a] rounded-lg text-center bg-[#0B0B0B]/10">
                <LayoutGrid size={32} className="mx-auto text-zinc-800 mb-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">Nenhum hábito configurado.</h4>
                <p className="text-[8px] text-zinc-800 font-black uppercase tracking-widest mb-6">Sua rotina está em branco. Inicie o mapeamento tático.</p>
                <button 
                  onClick={() => setShowHabitForm(true)}
                  className="bg-[#121212] border border-zinc-800 px-6 py-2.5 rounded text-[9px] font-black uppercase tracking-widest text-[#C0C0C0] hover:border-[#C0C0C0]/40 transition-all"
                >
                  + Criar Hábito
                </button>
             </div>
          )}
        </div>
      </section>

      {/* PERSONAL GOALS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0]" /> METAS PESSOAIS
          </h3>
        </div>
        <GoalsSection session="routine" />
      </section>
      
      {/* MAINTENANCE SECTION */}
      <section className="pt-8 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-4">Gerenciamento de Infraestrutura</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4" title="Arquitetura de Rotina">
            <p className="text-[9px] text-zinc-500 font-bold leading-relaxed mb-4 uppercase">Para gestão profunda de indicadores e limpeza do Core, utilize o terminal de <span className="text-[#C0C0C0]">SISTEMA</span>.</p>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default RoutinePage;