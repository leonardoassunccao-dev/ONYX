import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Habit, HabitCheckin } from '../types';

export function useHabits() {
  const habits = useLiveQuery(() => db.habits.toArray()) || [];
  const checkins = useLiveQuery(() => db.habit_checkins.toArray()) || [];
  const todayStr = new Date().toISOString().split('T')[0];

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

  const addCheckin = async (habitId: number, value: number) => {
    return await db.habit_checkins.add({
      habitId,
      date: todayStr,
      value
    });
  };

  const toggleBooleanHabit = async (habitId: number) => {
    const dailyCheckins = checkins.filter(c => c.habitId === habitId && c.date === todayStr);
    if (dailyCheckins.length > 0) {
      await db.habit_checkins.where('habitId').equals(habitId).and(c => c.date === todayStr).delete();
    } else {
      await addCheckin(habitId, 1);
    }
  };

  const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt'>) => {
    return await db.habits.add({
      ...habit,
      createdAt: Date.now()
    });
  };

  const deleteHabit = async (id: number) => {
    await db.habits.delete(id);
    await db.habit_checkins.where('habitId').equals(id).delete();
  };

  const updateHabit = async (id: number, data: Partial<Habit>) => {
    return await db.habits.update(id, data);
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