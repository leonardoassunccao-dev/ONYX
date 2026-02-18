import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { SessionGoal, GoalCheckin, GoalSession, GoalTemplate } from '../types';

export function useGoals(sessionFilter?: GoalSession) {
  const goals = useLiveQuery(() => 
    sessionFilter 
      ? db.session_goals.where('session').equals(sessionFilter).toArray()
      : db.session_goals.toArray()
  ) || [];

  const checkins = useLiveQuery(() => db.goal_checkins.toArray()) || [];
  const templates = useLiveQuery(() => 
    sessionFilter
      ? db.goal_templates.where('session').equals(sessionFilter).toArray()
      : db.goal_templates.toArray()
  ) || [];
  
  const transactions = useLiveQuery(() => db.finance_transactions.toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  // ISO Week calculator
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
    
    // Automated Finance Tracking for Currency goals
    if (goal.session === 'finance' && goal.metricType === 'currency' && goal.title.toLowerCase().includes('gastar')) {
      const filteredTxs = transactions.filter(t => t.type === 'expense');
      
      if (goal.type === 'daily') {
        current = filteredTxs.filter(t => t.date === todayStr).reduce((s, t) => s + t.amount, 0);
      } else if (goal.type === 'weekly') {
        const today = new Date();
        const currentWeek = getISOWeek(today);
        current = filteredTxs.filter(t => {
          const d = new Date(t.date);
          return getISOWeek(d) === currentWeek;
        }).reduce((s, t) => s + t.amount, 0);
      } else if (goal.type === 'monthly') {
        const currentMonth = todayStr.substring(0, 7);
        current = filteredTxs.filter(t => t.date && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0);
      }
      
      const isMet = current <= goal.targetValue;
      return { current, percent: Math.min((current / goal.targetValue) * 100, 100), isMet, isExceeded: current > goal.targetValue };
    }

    // Standard Checkin Tracking
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

  const addGoal = async (goal: Omit<SessionGoal, 'id' | 'createdAt' | 'done'>) => {
    return await db.session_goals.add({
      ...goal,
      createdAt: Date.now(),
      done: false
    });
  };

  const createFromTemplate = async (template: GoalTemplate) => {
    const today = new Date().toISOString().split('T')[0];
    return await db.session_goals.add({
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

  const checkin = async (goalId: number, value: number, notes?: string) => {
    return await db.goal_checkins.add({
      goalId,
      date: todayStr,
      value,
      notes
    });
  };

  const deleteGoal = async (id: number) => {
    await db.session_goals.delete(id);
    await db.goal_checkins.where('goalId').equals(id).delete();
  };

  const toggleActive = async (id: number, active: boolean) => {
    await db.session_goals.update(id, { active });
  };

  return {
    goals,
    templates,
    calculateProgress,
    addGoal,
    createFromTemplate,
    checkin,
    deleteGoal,
    toggleActive
  };
}