import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { FinanceTransaction, FixedExpense } from '../types';
import { safeAddDoc, safeDeleteDoc, safeSetDoc } from '../lib/firestoreSafe';

export function useFinance() {
  const { user, setGlobalError } = useAuth();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [salary, setSalary] = useState(0);
  const [patrimony, setPatrimony] = useState({ current: 0, goal: 0 });

  useEffect(() => {
    if (!user) return;

    // Path: users/{uid}/finance_transactions
    const qTrx = query(collection(db, 'users', user.uid, 'finance_transactions'), orderBy('date', 'desc'));
    const unsubTrx = onSnapshot(qTrx, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Path: users/{uid}/fixed_expenses
    const qFixed = query(collection(db, 'users', user.uid, 'fixed_expenses'));
    const unsubFixed = onSnapshot(qFixed, (snap) => {
      setFixedExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Path: users/{uid}/system/finance (Summary)
    const financeDocRef = doc(db, 'users', user.uid, 'system', 'finance');
    const unsubFinance = onSnapshot(financeDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSalary(data.salary || 0);
        setPatrimony(data.patrimony || { current: 0, goal: 0 });
      }
    });

    return () => { unsubTrx(); unsubFixed(); unsubFinance(); };
  }, [user]);

  const addTransaction = async (trx: Omit<FinanceTransaction, 'id' | 'updatedAt'>) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'finance_transactions'), trx);
    if (!res.success) setGlobalError(res.error || "Erro ao adicionar transação");
  };

  const deleteTransaction = async (id: any) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'finance_transactions', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar transação");
  };

  const addFixedExpense = async (exp: Omit<FixedExpense, 'id' | 'updatedAt'>) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'fixed_expenses'), exp);
    if (!res.success) setGlobalError(res.error || "Erro ao adicionar custo fixo");
  };

  const deleteFixedExpense = async (id: any) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'fixed_expenses', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar custo fixo");
  };

  const updateSalary = async (val: number) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeSetDoc(doc(db, 'users', user.uid, 'system', 'finance'), { salary: val }, { merge: true });
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar salário");
  };

  const updatePatrimony = async (current: number, goal: number) => {
    if (!user) { setGlobalError("Usuário não autenticado."); return; }
    const res = await safeSetDoc(doc(db, 'users', user.uid, 'system', 'finance'), { patrimony: { current, goal } }, { merge: true });
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar patrimônio");
  };

  return {
    transactions,
    fixedExpenses,
    salary,
    patrimony,
    addTransaction,
    deleteTransaction,
    addFixedExpense,
    deleteFixedExpense,
    updateSalary,
    updatePatrimony
  };
}