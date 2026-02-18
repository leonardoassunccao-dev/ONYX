import React, { useState } from 'react';
import { db } from '../db';
import { Settings } from '../types';
import Card from '../components/Card';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Edit2, TrendingUp, DollarSign, Wallet, CreditCard, Lock, ArrowRight, Activity } from 'lucide-react';

const FinancePage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');

  const [editingPatrimony, setEditingPatrimony] = useState(false);
  const [patrimonyCurrent, setPatrimonyCurrent] = useState('');
  const [patrimonyGoal, setPatrimonyGoal] = useState('');

  // Modals / Forms
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [fixedFormData, setFixedFormData] = useState({ title: '', amount: '' });

  const [showVarForm, setShowVarForm] = useState(false);
  const [varFormData, setVarFormData] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // --- DATA FETCHING ---
  
  // Salary
  const salaryState = useLiveQuery(() => db.app_state.get('monthly_salary'));
  const monthlySalary = salaryState?.value || 0;

  // Patrimony
  const patCurrentState = useLiveQuery(() => db.app_state.get('patrimony_current'));
  const patGoalState = useLiveQuery(() => db.app_state.get('patrimony_goal'));
  const currentPatrimony = patCurrentState?.value || 0;
  const goalPatrimony = patGoalState?.value || 0;

  // Expenses
  const fixedExpenses = useLiveQuery(() => db.fixed_expenses.toArray()) || [];
  
  const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
  const variableExpenses = useLiveQuery(() => 
    db.finance_transactions
      .where('date').startsWith(currentMonthStr)
      .and(t => t.type === 'expense')
      .reverse()
      .toArray()
  ) || [];

  // --- CALCULATIONS ---
  const totalFixed = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalVariable = variableExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = totalFixed + totalVariable;
  const balance = monthlySalary - totalExpenses;
  const percentUsed = monthlySalary > 0 ? (totalExpenses / monthlySalary) * 100 : 0;
  const percentPatrimony = goalPatrimony > 0 ? (currentPatrimony / goalPatrimony) * 100 : 0;

  // --- HANDLERS ---

  const saveSalary = async () => {
    const val = parseFloat(salaryInput);
    if (!isNaN(val)) {
      await db.app_state.put({ key: 'monthly_salary', value: val });
    }
    setEditingSalary(false);
  };

  const savePatrimony = async () => {
    const cur = parseFloat(patrimonyCurrent);
    const goal = parseFloat(patrimonyGoal);
    
    if (!isNaN(cur)) await db.app_state.put({ key: 'patrimony_current', value: cur });
    if (!isNaN(goal)) await db.app_state.put({ key: 'patrimony_goal', value: goal });
    
    setEditingPatrimony(false);
  };

  const addFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedFormData.title || !fixedFormData.amount) return;
    await db.fixed_expenses.add({
      title: fixedFormData.title,
      amount: parseFloat(fixedFormData.amount)
    });
    setFixedFormData({ title: '', amount: '' });
    setShowFixedForm(false);
  };

  const deleteFixed = async (id: number) => {
    if (confirm('Remover custo fixo?')) await db.fixed_expenses.delete(id);
  };

  const addVariableExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varFormData.category || !varFormData.amount) return;
    await db.finance_transactions.add({
      type: 'expense',
      category: varFormData.category,
      amount: parseFloat(varFormData.amount),
      date: varFormData.date
    });
    setVarFormData({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowVarForm(false);
  };

  const deleteVariable = async (id: number) => {
    if (confirm('Remover gasto variável?')) await db.finance_transactions.delete(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Estratégia Financeira</h2>
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Gestão de Recursos & Patrimônio</p>
      </header>

      {/* 1. SALÁRIO */}
      <section className="bg-[#0B0B0B] border border-[#1a1a1a] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-[#D4AF37]/30 transition-all">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-zinc-900 rounded-full text-[#D4AF37] border border-zinc-800">
             <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Entrada Mensal Fixa</p>
            {editingSalary ? (
               <div className="flex gap-2">
                 <input 
                   autoFocus
                   type="number" 
                   className="bg-[#121212] border border-zinc-800 rounded p-2 text-xl font-black text-white outline-none focus:border-[#D4AF37] w-40"
                   value={salaryInput}
                   onChange={e => setSalaryInput(e.target.value)}
                   placeholder={monthlySalary.toString()}
                 />
                 <button onClick={saveSalary} className="bg-[#D4AF37] text-black px-4 rounded font-bold text-xs uppercase tracking-wider">OK</button>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                 <h3 className="text-3xl font-black text-white tracking-tight">R$ {monthlySalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                 <button onClick={() => { setSalaryInput(monthlySalary.toString()); setEditingSalary(true); }} className="text-zinc-600 hover:text-[#D4AF37] transition-colors">
                    <Edit2 size={14} />
                 </button>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. RESUMO AUTOMÁTICO (Placed here for high visibility) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Comprometido</p>
                 <p className="text-2xl font-black text-[#E8E8E8]">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
               <CreditCard size={20} className="text-zinc-700" />
            </div>
            <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-full">
              <div 
                className={`h-full transition-all ${percentUsed > 100 ? 'bg-red-800' : 'bg-[#D4AF37]'}`} 
                style={{ width: `${Math.min(percentUsed, 100)}%` }} 
              />
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest mt-2 ${percentUsed > 100 ? 'text-red-800' : 'text-[#D4AF37]'}`}>
              {percentUsed.toFixed(1)}% do Salário
            </p>
         </Card>

         <Card className="relative overflow-hidden group">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Saldo Disponível</p>
                 <p className={`text-2xl font-black ${balance < 0 ? 'text-red-500' : 'text-[#E8E8E8]'}`}>
                   R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
               </div>
               <Wallet size={20} className="text-zinc-700" />
            </div>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Capacidade de Manobra</p>
         </Card>
         
         <Card className="relative overflow-hidden group border-zinc-800">
            {editingPatrimony ? (
              <div className="space-y-3">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Patrimônio Atual</label>
                    <input type="number" value={patrimonyCurrent} onChange={e => setPatrimonyCurrent(e.target.value)} className="w-full bg-[#121212] border border-zinc-800 rounded p-1 text-sm text-white" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Meta</label>
                    <input type="number" value={patrimonyGoal} onChange={e => setPatrimonyGoal(e.target.value)} className="w-full bg-[#121212] border border-zinc-800 rounded p-1 text-sm text-white" />
                 </div>
                 <button onClick={savePatrimony} className="w-full bg-[#D4AF37] text-black py-1 rounded text-[10px] font-bold uppercase">Salvar</button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Meta de Patrimônio</p>
                    <div className="flex items-center gap-2">
                       <p className="text-xl font-black text-[#E8E8E8]">R$ {currentPatrimony.toLocaleString('pt-BR', { notation: "compact" })}</p>
                       <span className="text-zinc-600 text-[10px] font-bold">/ {goalPatrimony.toLocaleString('pt-BR', { notation: "compact" })}</span>
                    </div>
                  </div>
                  <button onClick={() => { setPatrimonyCurrent(currentPatrimony.toString()); setPatrimonyGoal(goalPatrimony.toString()); setEditingPatrimony(true); }}>
                     <TrendingUp size={20} className="text-[#D4AF37] hover:text-white transition-colors" />
                  </button>
                </div>
                <div className="h-1 bg-zinc-900 w-full overflow-hidden rounded-full mb-2">
                  <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${Math.min(percentPatrimony, 100)}%` }} />
                </div>
                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">{percentPatrimony.toFixed(1)}% CONQUISTADO</p>
              </>
            )}
         </Card>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 2. GASTOS FIXOS */}
        <section className="space-y-4">
           <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <Lock size={12} className="text-zinc-600" /> Gastos Fixos
              </h3>
              <button onClick={() => setShowFixedForm(!showFixedForm)} className="text-[#D4AF37] hover:text-white transition-colors">
                <Plus size={16} />
              </button>
           </div>
           
           {showFixedForm && (
             <form onSubmit={addFixedExpense} className="bg-[#0B0B0B] p-4 border border-zinc-800 rounded-lg space-y-3 animate-in slide-in-from-top-2">
               <input 
                 autoFocus
                 type="text" placeholder="Nome do Custo"
                 className="w-full bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white uppercase font-bold outline-none focus:border-[#D4AF37]"
                 value={fixedFormData.title}
                 onChange={e => setFixedFormData({...fixedFormData, title: e.target.value})}
               />
               <div className="flex gap-2">
                 <input 
                   type="number" placeholder="Valor"
                   className="flex-1 bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white outline-none focus:border-[#D4AF37]"
                   value={fixedFormData.amount}
                   onChange={e => setFixedFormData({...fixedFormData, amount: e.target.value})}
                 />
                 <button type="submit" className="bg-[#D4AF37] text-black px-4 rounded font-bold text-xs uppercase">ADD</button>
               </div>
             </form>
           )}

           <div className="space-y-2">
             {fixedExpenses.map(expense => (
               <div key={expense.id} className="flex justify-between items-center bg-[#0B0B0B] border border-[#1a1a1a] p-3 rounded group hover:border-[#D4AF37]/20 transition-all">
                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">{expense.title}</span>
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-white font-mono-hud">R$ {expense.amount.toFixed(2)}</span>
                    <button onClick={() => deleteFixed(expense.id!)} className="text-zinc-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={12} />
                    </button>
                 </div>
               </div>
             ))}
             {fixedExpenses.length === 0 && <p className="text-[9px] text-zinc-700 font-mono-hud text-center py-4">Nenhum custo fixo registrado.</p>}
             
             {fixedExpenses.length > 0 && (
               <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-2 px-3">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Fixo</span>
                  <span className="text-xs font-bold text-zinc-400 font-mono-hud">R$ {totalFixed.toFixed(2)}</span>
               </div>
             )}
           </div>
        </section>

        {/* 3. GASTOS VARIÁVEIS */}
        <section className="space-y-4">
           <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <Activity size={12} className="text-zinc-600" /> Variáveis (Mês Atual)
              </h3>
              <button onClick={() => setShowVarForm(!showVarForm)} className="text-[#D4AF37] hover:text-white transition-colors">
                <Plus size={16} />
              </button>
           </div>

           {showVarForm && (
             <form onSubmit={addVariableExpense} className="bg-[#0B0B0B] p-4 border border-zinc-800 rounded-lg space-y-3 animate-in slide-in-from-top-2">
               <input 
                 autoFocus
                 type="text" placeholder="Descrição do Gasto"
                 className="w-full bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white uppercase font-bold outline-none focus:border-[#D4AF37]"
                 value={varFormData.category}
                 onChange={e => setVarFormData({...varFormData, category: e.target.value})}
               />
               <div className="flex gap-2">
                 <input 
                   type="date"
                   className="bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-zinc-400 outline-none focus:border-[#D4AF37]"
                   value={varFormData.date}
                   onChange={e => setVarFormData({...varFormData, date: e.target.value})}
                 />
                 <input 
                   type="number" placeholder="Valor"
                   className="flex-1 bg-[#121212] border border-zinc-800 p-2 rounded text-xs text-white outline-none focus:border-[#D4AF37]"
                   value={varFormData.amount}
                   onChange={e => setVarFormData({...varFormData, amount: e.target.value})}
                 />
                 <button type="submit" className="bg-[#D4AF37] text-black px-4 rounded font-bold text-xs uppercase">ADD</button>
               </div>
             </form>
           )}

           <div className="space-y-2">
             {variableExpenses.map(expense => (
               <div key={expense.id} className="flex justify-between items-center bg-[#0B0B0B] border border-[#1a1a1a] p-3 rounded group hover:border-[#D4AF37]/20 transition-all">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">{expense.category}</span>
                    <span className="text-[8px] font-bold text-zinc-600">{expense.date.split('-').reverse().slice(0,2).join('/')}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-white font-mono-hud">R$ {expense.amount.toFixed(2)}</span>
                    <button onClick={() => deleteVariable(expense.id!)} className="text-zinc-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={12} />
                    </button>
                 </div>
               </div>
             ))}
             {variableExpenses.length === 0 && <p className="text-[9px] text-zinc-700 font-mono-hud text-center py-4">Nenhum gasto variável este mês.</p>}
             
             {variableExpenses.length > 0 && (
               <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50 mt-2 px-3">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Total Variável</span>
                  <span className="text-xs font-bold text-zinc-400 font-mono-hud">R$ {totalVariable.toFixed(2)}</span>
               </div>
             )}
           </div>
        </section>

      </div>
    </div>
  );
};

export default FinancePage;