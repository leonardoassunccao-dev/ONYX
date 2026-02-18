import React, { useState } from 'react';
import { GoalSession, SessionGoal, MetricType, GoalType } from '../types';
import { useGoals } from '../hooks/useGoals';
import Card from './Card';
import { Target, Plus, Check, Trash2, X, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';

interface GoalsSectionProps {
  session: GoalSession;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ session }) => {
  const { goals, templates, calculateProgress, addGoal, checkin, deleteGoal, createFromTemplate } = useGoals(session);
  const [showAdd, setShowAdd] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState<number | null>(null);
  const [checkInVal, setCheckInVal] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'daily' as GoalType,
    metricType: 'count' as MetricType,
    targetValue: 1,
    dueDate: '',
    timeOptional: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;
    await addGoal({
      session,
      title: newGoal.title,
      type: newGoal.type,
      metricType: newGoal.metricType,
      targetValue: newGoal.targetValue,
      dueDate: newGoal.dueDate || undefined,
      timeOptional: newGoal.timeOptional || undefined,
      active: true,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
    });
    setNewGoal({ title: '', type: 'daily', metricType: 'count', targetValue: 1, dueDate: '', timeOptional: '' });
    setShowAdd(false);
    triggerToast('Meta criada manualmente.');
  };

  const handleTemplateCreate = async (template: any) => {
    await createFromTemplate(template);
    triggerToast(`Meta "${template.title}" ativada.`);
  };

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckIn = async (goalId: number) => {
    const val = parseFloat(checkInVal);
    if (isNaN(val)) return;
    await checkin(goalId, val);
    setCheckInVal('');
    setShowCheckIn(null);
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-[#0b0b0d] px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest z-[100] animate-in fade-in slide-in-from-top-4">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[11px] font-black text-[#C0C0C0] uppercase tracking-[0.3em]"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Metas Operacionais
        </button>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-zinc-800 text-[#C0C0C0] p-1.5 rounded hover:bg-zinc-700 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Quick Goals Templates */}
          <div className="space-y-2">
            <h5 className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap size={10} className="text-[#C0C0C0]" /> Metas Rápidas
            </h5>
            <div className="flex flex-wrap gap-2">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateCreate(tmpl)}
                  className="bg-[#1a1a1d] border border-zinc-800 hover:border-[#C0C0C0]/40 px-3 py-1.5 rounded flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles size={10} className="text-zinc-600" />
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider whitespace-nowrap">{tmpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          {showAdd && (
            <Card accentBorder title="Definir Nova Meta">
              <form onSubmit={handleAdd} className="space-y-4">
                <input 
                  type="text" placeholder="Título da Meta"
                  className="w-full bg-[#0b0b0d] border border-zinc-800 p-3 rounded text-xs text-white uppercase font-bold tracking-widest outline-none focus:border-[#C0C0C0]"
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className="bg-[#0b0b0d] border border-zinc-800 p-2 rounded text-[10px] font-black uppercase text-zinc-400 outline-none"
                    value={newGoal.type}
                    onChange={e => setNewGoal({...newGoal, type: e.target.value as any})}
                  >
                    <option value="daily">DIÁRIA</option>
                    <option value="weekly">SEMANAL</option>
                    <option value="monthly">MENSAL</option>
                    <option value="one_time">ÚNICA</option>
                  </select>
                  <select 
                    className="bg-[#0b0b0d] border border-zinc-800 p-2 rounded text-[10px] font-black uppercase text-zinc-400 outline-none"
                    value={newGoal.metricType}
                    onChange={e => setNewGoal({...newGoal, metricType: e.target.value as any})}
                  >
                    <option value="count">QUANTIDADE</option>
                    <option value="minutes">MINUTOS</option>
                    <option value="pages">PÁGINAS</option>
                    <option value="currency">MOEDA (R$)</option>
                    <option value="boolean">CHECKLIST</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" placeholder="Valor Meta"
                    className="flex-1 bg-[#0b0b0d] border border-zinc-800 p-2 rounded text-xs text-white outline-none"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({...newGoal, targetValue: parseFloat(e.target.value)})}
                  />
                  {newGoal.type === 'one_time' && (
                    <input 
                      type="date"
                      className="flex-1 bg-[#0b0b0d] border border-zinc-800 p-2 rounded text-xs text-zinc-400 outline-none"
                      value={newGoal.dueDate}
                      onChange={e => setNewGoal({...newGoal, dueDate: e.target.value})}
                    />
                  )}
                </div>
                <button type="submit" className="w-full bg-[#C0C0C0] text-[#0b0b0d] py-2.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Consolidar Meta</button>
              </form>
            </Card>
          )}

          {goals.filter(g => g.active).map(goal => {
            const stats = calculateProgress(goal);
            const unit = goal.metricType === 'currency' ? 'R$' : 
                         goal.metricType === 'minutes' ? 'min' : 
                         goal.metricType === 'pages' ? 'pág' : '';
            
            const isLimitGoal = goal.session === 'finance' && goal.metricType === 'currency' && goal.title.toLowerCase().includes('gastar');

            return (
              <Card key={goal.id} className="relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Target size={14} className={stats.isMet ? 'text-[#C0C0C0]' : 'text-zinc-700'} />
                      <h4 className={`text-[11px] font-black uppercase tracking-tight truncate ${stats.isMet ? 'text-white' : 'text-zinc-400'}`}>{goal.title}</h4>
                    </div>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1 tracking-widest">{goal.type} // {goal.metricType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => deleteGoal(goal.id!)} className="text-zinc-800 hover:text-red-900 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>

                {goal.metricType !== 'boolean' && (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                      <span className="text-zinc-500">
                        {isLimitGoal ? `Gasto: R$ ${stats.current.toFixed(2)}` : `${stats.current} / ${goal.targetValue} ${unit}`}
                        {isLimitGoal && ` / Limite: R$ ${goal.targetValue.toFixed(2)}`}
                      </span>
                      <span className={stats.isExceeded ? 'text-red-900' : 'text-zinc-300'}>{Math.round(stats.percent)}%</span>
                    </div>
                    <div className="h-1 bg-[#0b0b0d] rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${stats.isExceeded ? 'bg-red-900' : 'bg-[#C0C0C0]'}`} style={{ width: `${stats.percent}%` }} />
                    </div>
                    {isLimitGoal && stats.isExceeded && (
                      <p className="text-[7px] text-red-900 font-black uppercase tracking-widest mt-1">Limite tático excedido</p>
                    )}
                  </div>
                )}

                {!isLimitGoal && (
                  showCheckIn === goal.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(goal.id!); }} className="flex gap-1 animate-in slide-in-from-top-1">
                      <input 
                        autoFocus type="number" placeholder="Valor..."
                        className="flex-1 bg-[#0b0b0d] border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none"
                        value={checkInVal}
                        onChange={e => setCheckInVal(e.target.value)}
                      />
                      <button type="submit" className="bg-[#C0C0C0] text-[#0b0b0d] px-3 rounded text-[9px] font-black uppercase">Ok</button>
                      <button type="button" onClick={() => setShowCheckIn(null)} className="text-zinc-600 px-1 text-[9px] font-black uppercase">X</button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => goal.metricType === 'boolean' ? checkin(goal.id!, 1) : setShowCheckIn(goal.id!)}
                      className={`w-full py-1.5 border rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                        stats.isMet ? 'bg-[#C0C0C0]/10 border-transparent text-[#C0C0C0]' : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {stats.isMet ? 'Meta Atingida' : 'Registrar Progresso'}
                    </button>
                  )
                )}
                
                {isLimitGoal && (
                  <div className="flex items-center gap-2 py-1 px-2 bg-zinc-900/50 border border-zinc-800/50 rounded">
                    <Check size={10} className={stats.isExceeded ? 'text-red-900' : 'text-[#C0C0C0]'} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Monitoramento Automático Ativo</span>
                  </div>
                )}
              </Card>
            );
          })}

          {goals.length === 0 && !showAdd && (
            <div className="text-center py-6 opacity-30 border border-dashed border-zinc-800 rounded-lg">
              <p className="text-[9px] font-black uppercase tracking-widest">Aguardando definição de metas táticas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsSection;
