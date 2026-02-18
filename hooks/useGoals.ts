import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { SessionGoal, GoalSession, GoalTemplate } from '../types';

export function useGoals(sessionFilter?: GoalSession) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SessionGoal[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;

    const qGoals = sessionFilter 
      ? query(collection(db, 'users', user.uid, 'session_goals'), where('session', '==', sessionFilter))
      : collection(db, 'users', user.uid, 'session_goals');

    const unsubGoals = onSnapshot(qGoals, (snap) => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    const unsubCheckins = onSnapshot(collection(db, 'users', user.uid, 'goal_checkins'), (snap) => setCheckins(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    const unsubTemplates = onSnapshot(collection(db, 'users', user.uid, 'goal_templates'), (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setTemplates(sessionFilter ? all.filter((t: any) => t.session === sessionFilter) : all);
    });
    
    const unsubTrans = onSnapshot(collection(db, 'users', user.uid, 'finance_transactions'), (snap) => setTransactions(snap.docs.map(d => d.data())));

    return () => { unsubGoals(); unsubCheckins(); unsubTemplates(); unsubTrans(); };
  }, [user, sessionFilter]);

  const getISOWeek = (date: Date) => {
    if (!date || isNaN(date.getTime())) return -1;
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const calculateProgress = (goal: SessionGoal) => {
    let current = 0;
    
    if (goal.session === 'finance' && goal.metricType === 'currency' && goal.title.toLowerCase().includes('gastar')) {
      const filteredTxs = transactions.filter((t: any) => t.type === 'expense');
      
      if (goal.type === 'daily') {
        current = filteredTxs.filter((t: any) => t.date === todayStr).reduce((s, t) => s + t.amount, 0);
      } else if (goal.type === 'weekly') {
        const today = new Date();
        const currentWeek = getISOWeek(today);
        current = filteredTxs.filter((t: any) => {
          const d = new Date(t.date);
          return getISOWeek(d) === currentWeek;
        }).reduce((s, t) => s + t.amount, 0);
      } else if (goal.type === 'monthly') {
        const currentMonth = todayStr.substring(0, 7);
        current = filteredTxs.filter((t: any) => t.date && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
      }
      
      const isMet = current <= goal.targetValue;
      return { current, percent: Math.min((current / goal.targetValue) * 100, 100), isMet, isExceeded: current > goal.targetValue };
    }

    const goalCheckins = checkins.filter(c => c.goalId === goal.id);
    if (goal.type === 'daily') {
      current = goalCheckins.filter(c => c.date === todayStr).reduce((sum, c) => sum + c.value, 0);
    } else if (goal.type === 'weekly') {
      const today = new Date();
      const currentWeek = getISOWeek(today);
      current = goalCheckins.filter(c => {
        const d = new Date(c.date);
        return getISOWeek(d) === currentWeek;
      }).reduce((sum, c) => sum + c.value, 0);
    } else if (goal.type === 'monthly') {
      const currentMonth = todayStr.substring(0, 7);
      current = goalCheckins.filter(c => c.date && c.date.startsWith(currentMonth)).reduce((sum, c) => sum + c.value, 0);
    } else {
      current = goalCheckins.reduce((sum, c) => sum + c.value, 0);
    }

    return {
      current,
      percent: goal.targetValue > 0 ? Math.min((current / goal.targetValue) * 100, 100) : 0,
      isMet: goal.metricType === 'boolean' ? current > 0 : current >= goal.targetValue,
      isExceeded: false
    };
  };

  const addGoal = async (goal: any) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'session_goals'), { ...goal, createdAt: Date.now(), done: false });
  };

  const createFromTemplate = async (template: GoalTemplate) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'users', user.uid, 'session_goals'), {
      session: template.session,
      title: template.title,
      type: template.type,
      metricType: template.metricType,
      targetValue: template.defaultTargetValue,
      daysOfWeek: template.defaultDaysOfWeek || [0,1,2,3,4,5,6],
      timeOptional: template.defaultTimeOptional || undefined,
      startDate: today,
      dueDate: template.type === 'one_time' ? today : undefined,
      active: true,
      done: false,
      createdAt: Date.now()
    });
  };

  const checkin = async (goalId: any, value: number, notes?: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'goal_checkins'), { goalId, date: todayStr, value, notes });
  };

  const deleteGoal = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'session_goals', id));
  };

  const toggleActive = async (id: any, active: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'session_goals', id), { active });
  };

  return { goals, templates, calculateProgress, addGoal, createFromTemplate, checkin, deleteGoal, toggleActive };
}
