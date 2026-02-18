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

    // users/{uid}/habits/items
    const unsubHabits = onSnapshot(collection(db, 'users', user.uid, 'habits', 'items'), (snap) => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // users/{uid}/habits/checkins
    const unsubCheckins = onSnapshot(collection(db, 'users', user.uid, 'habits', 'checkins'), (snap) => {
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
    await addDoc(collection(db, 'users', user.uid, 'habits', 'checkins'), {
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
        // Fix: Use String() conversion instead of 'as string' cast to avoid TS2352 if id is number
        const checkinId = checkin.id ? String(checkin.id) : '';
        if (checkinId) {
            await deleteDoc(doc(db, 'users', user.uid, 'habits', 'checkins', checkinId));
        }
      }
    } else {
      await addCheckin(habitId, 1);
    }
  };

  const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'habits', 'items'), { ...habit, createdAt: Date.now() });
  };

  const deleteHabit = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'habits', 'items', id));
  };

  const updateHabit = async (id: any, data: Partial<Habit>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'habits', 'items', id), data);
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