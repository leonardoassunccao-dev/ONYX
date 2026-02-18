import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Habit, HabitCheckin } from '../types';

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<HabitCheckin[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;

    const unsubHabits = onSnapshot(collection(db, 'users', user.uid, 'habits'), (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

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
    const percent = Math.min((current / habit.targetValue) * 100, 100);
    const isMet = habit.type === 'boolean' ? current > 0 : current >= habit.targetValue;
    return { current, percent, isMet };
  };

  const addCheckin = async (habitId: any, value: number) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'habit_checkins'), {
      habitId,
      date: todayStr,
      value,
      updatedAt: Date.now()
    });
  };

  const toggleBooleanHabit = async (habitId: any) => {
    if (!user) return;
    const dailyCheckins = checkins.filter(c => c.habitId === habitId && c.date === todayStr);
    if (dailyCheckins.length > 0) {
      for (const checkin of dailyCheckins) {
        await deleteDoc(doc(db, 'users', user.uid, 'habit_checkins', checkin.id as string));
      }
    } else {
      await addCheckin(habitId, 1);
    }
  };

  const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'habits'), { ...habit, createdAt: Date.now() });
  };

  const deleteHabit = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'habits', id));
  };

  const updateHabit = async (id: any, data: Partial<Habit>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'habits', id), data);
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
