import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { Habit, HabitCheckin } from '../types';
import { safeAddDoc, safeDeleteDoc, safeUpdateDoc } from '../lib/firestoreSafe';

export function useHabits() {
  const { user, setGlobalError } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<HabitCheckin[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;

    // Path: users/{uid}/habit_items
    const unsubHabits = onSnapshot(collection(db, 'users', user.uid, 'habit_items'), (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Path: users/{uid}/habit_checkins
    const unsubCheckins = onSnapshot(collection(db, 'users', user.uid, 'habit_checkins'), (snap) => {
      setCheckins(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    return () => { unsubHabits(); unsubCheckins(); };
  }, [user]);

  const getTodayHabits = () => {
    const dayOfWeek = new Date().getDay();
    return habits.filter(h => h.active && h.daysOfWeek.includes(dayOfWeek));
  };

  const getProgress = (habit: Habit) => {
    const dailyCheckins = checkins.filter(c => c.habitId === habit.id && c.date === todayStr);
    const current = dailyCheckins.reduce((sum, c) => sum + c.value, 0);
    const percent = habit.targetValue > 0 ? Math.min((current / habit.targetValue) * 100, 100) : 0;
    const isMet = habit.type === 'boolean' ? current > 0 : current >= habit.targetValue;
    return { current, percent, isMet };
  };

  const addCheckin = async (habitId: any, value: number) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'habit_checkins'), {
      habitId,
      date: todayStr,
      value
    });
    if (!res.success) setGlobalError(res.error || "Erro ao registrar checkin");
  };

  const toggleBooleanHabit = async (habitId: any) => {
    if (!user) return;
    const dailyCheckins = checkins.filter(c => c.habitId === habitId && c.date === todayStr);
    
    if (dailyCheckins.length > 0) {
      // Remove all checkins for today (toggle off)
      for (const checkin of dailyCheckins) {
        const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'habit_checkins', String(checkin.id)));
        if (!res.success) setGlobalError("Erro ao remover checkin");
      }
    } else {
      await addCheckin(habitId, 1);
    }
  };

  const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'habit_items'), habit);
    if (!res.success) setGlobalError(res.error || "Erro ao criar hábito");
  };

  const deleteHabit = async (id: any) => {
    if (!user) return;
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'habit_items', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar hábito");
  };

  const updateHabit = async (id: any, data: Partial<Habit>) => {
    if (!user) return;
    const res = await safeUpdateDoc(doc(db, 'users', user.uid, 'habit_items', id), data);
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar hábito");
  };

  return {
    habits,
    getTodayHabits,
    getProgress,
    addCheckin,
    toggleBooleanHabit,
    createHabit,
    deleteHabit,
    updateHabit
  };
}