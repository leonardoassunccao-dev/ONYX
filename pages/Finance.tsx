import React, { useState } from 'react';
import { Settings } from '../types';
import Card from '../components/Card';
import { useFinance } from '../hooks/useFinance';
import { Plus, Trash2, Edit2, TrendingUp, DollarSign, Wallet, CreditCard, Lock, Activity } from 'lucide-react';

const FinancePage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const { transactions, fixedExpenses, salary, patrimony, addTransaction, deleteTransaction, addFixedExpense, deleteFixedExpense, updateSalary, updatePatrimony } = useFinance();

  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState('');

  const [editingPatrimony, setEditingPatrimony] = useState(false);
  const [patrimonyCurrent, setPatrimonyCurrent] = useState('');
  const [patrimonyGoal, setPatrimonyGoal] = useState('');

  const [showFixedForm, setShowFixedForm] = useState(false);
  const [fixedFormData, setFixedFormData] = useState({ title: '', amount: '' });

  const [showVarForm, setShowVarForm] = useState(false);
  const [varFormData, setVarFormData] = useState({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense');
  
  const totalFixed = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalVariable = currentMonthTransactions.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = totalFixed + totalVariable;
  const balance = salary - totalExpenses;
  const percentUsed = salary > 0 ? (totalExpenses / salary) * 100 : 0;
  const percentPatrimony = patrimony.goal > 0 ? (patrimony.current / patrimony.goal) * 100 : 0;

  const saveSalary = async () => {
    const val = parseFloat(salaryInput);
    if (!isNaN(val)) await updateSalary(val);
    setEditingSalary(false);
  };

  const savePatrimony = async () => {
    const cur = parseFloat(patrimonyCurrent);
    const goal = parseFloat(patrimonyGoal);
    if (!isNaN(cur) || !isNaN(goal)) {
        await updatePatrimony(isNaN(cur) ? patrimony.current : cur, isNaN(goal) ? patrimony.goal : goal);
    }
    setEditingPatrimony(false);
  };

  const handleAddFixed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedFormData.title || !fixedFormData.amount) return;
    await addFixedExpense({ title: fixedFormData.title, amount: parseFloat(fixedFormData.amount) });
    setFixedFormData({ title: '', amount: '' });
    setShowFixedForm(false);
  };

  const handleAddVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varFormData.category || !varFormData.amount) return;
    await addTransaction({
      type: 'expense',
      category: varFormData.category,
      amount: parseFloat(varFormData.amount),
      date: varFormData.date
    });
    setVarFormData({ category: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowVarForm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Estratégia Financeira</h2>
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Gestão de Recursos & Patrimônio</p>
      </header>

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
                   placeholder={salary.toString()}
                 />
                 <button onClick={saveSalary} className="bg-[#D4AF37] text-black px-4 rounded font-bold text-xs uppercase tracking-wider">OK</button>
               </div>
            ) : (
               <div className="flex items-center gap-3">
                 <h3 className="text-3xl font-black text-white tracking-tight">R$ {salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                 <button onClick={() => { setSalaryInput(salary.toString()); setEditingSalary(true); }} className="text-zinc-600 hover:text-[#D4AF37] transition-colors">
                    <Edit2 size={14} />
                 </button>
               </div>
            )}
          </div>
        </div>
      </section>

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
                       <p className="text-xl font-black text-[#E8E8E8]">R$ {patrimony.current.toLocaleString('pt-BR', { notation: "compact" })}</p>
                       <span className="text-zinc-600 text-[10px] font-bold">/ {patrimony.goal.toLocaleString('pt-BR', { notation: "compact" })}</span>
                    </div>
                  </div>
                  <button onClick={() => { setPatrimonyCurrent(patrimony.current.toString()); setPatrimonyGoal(patrimony.goal.toString()); setEditingPatrimony(true); }}>
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
             <form onSubmit={handleAddFixed} className="bg-[#0B0B0B] p-4 border border-zinc-800 rounded-lg space-y-3 animate-in slide-in-from-top-2">
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
                    <button onClick={() => deleteFixedExpense(expense.id! as any)} className="text-zinc-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={12} />
                    </button>
                 </div>
               </div>
             ))}
           </div>
        </section>

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
             <form onSubmit={handleAddVar} className="bg-[#0B0B0B] p-4 border border-zinc-800 rounded-lg space-y-3 animate-in slide-in-from-top-2">
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
             {currentMonthTransactions.map(expense => (
               <div key={expense.id} className="flex justify-between items-center bg-[#0B0B0B] border border-[#1a1a1a] p-3 rounded group hover:border-[#D4AF37]/20 transition-all">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">{expense.category}</span>
                    <span className="text-[8px] font-bold text-zinc-600">{expense.date.split('-').reverse().slice(0,2).join('/')}</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-white font-mono-hud">R$ {expense.amount.toFixed(2)}</span>
                    <button onClick={() => deleteTransaction(expense.id! as any)} className="text-zinc-700 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-all">
                       <Trash2 size={12} />
                    </button>
                 </div>
               </div>
             ))}
           </div>
        </section>
      </div>
    </div>
  );
};

export default FinancePage;
