import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { PacerWorkout } from '../types';
import { safeAddDoc, safeDeleteDoc, safeUpdateDoc } from '../lib/firestoreSafe';

export function usePacer() {
  const { user, setGlobalError } = useAuth();
  const [workouts, setWorkouts] = useState<PacerWorkout[]>([]);

  useEffect(() => {
    if (!user) return;
    // Path: users/{uid}/pacer_workouts
    const q = query(collection(db, 'users', user.uid, 'pacer_workouts'), orderBy('plannedDate', 'desc'));
    const unsub = onSnapshot(q, (snap) => setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addWorkout = async (data: any) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'pacer_workouts'), data);
    if (!res.success) setGlobalError(res.error || "Erro ao agendar treino");
  };

  const toggleWorkout = async (w: PacerWorkout) => {
    if (!user) return;
    const res = await safeUpdateDoc(doc(db, 'users', user.uid, 'pacer_workouts', w.id as unknown as string), { done: !w.done });
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar treino");
  };

  const deleteWorkout = async (id: any) => {
    if (!user) return;
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'pacer_workouts', id));
    if (!res.success) setGlobalError(res.error || "Erro ao remover treino");
  };

  return { workouts, addWorkout, toggleWorkout, deleteWorkout };
}