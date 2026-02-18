import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, orderBy } from 'firebase/firestore';
import { FinanceTransaction, FixedExpense } from '../types';

export function useFinance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [salary, setSalary] = useState(0);
  const [patrimony, setPatrimony] = useState({ current: 0, goal: 0 });

  useEffect(() => {
    if (!user) return;

    const qTrx = query(collection(db, 'users', user.uid, 'finance_transactions'), orderBy('date', 'desc'));
    const unsubTrx = onSnapshot(qTrx, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const qFixed = query(collection(db, 'users', user.uid, 'fixed_expenses'));
    const unsubFixed = onSnapshot(qFixed, (snap) => {
      setFixedExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

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
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'finance_transactions'), { ...trx, updatedAt: Date.now() });
  };

  const deleteTransaction = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'finance_transactions', id));
  };

  const addFixedExpense = async (exp: Omit<FixedExpense, 'id' | 'updatedAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'fixed_expenses'), { ...exp, updatedAt: Date.now() });
  };

  const deleteFixedExpense = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'fixed_expenses', id));
  };

  const updateSalary = async (val: number) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'system', 'finance'), { salary: val }, { merge: true });
  };

  const updatePatrimony = async (current: number, goal: number) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'system', 'finance'), { patrimony: { current, goal } }, { merge: true });
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
