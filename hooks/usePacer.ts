import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { PacerWorkout } from '../types';

export function usePacer() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<PacerWorkout[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'pacer_workouts'), orderBy('plannedDate', 'desc'));
    const unsub = onSnapshot(q, (snap) => setWorkouts(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addWorkout = async (data: any) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'pacer_workouts'), { ...data, updatedAt: Date.now() });
  };

  const toggleWorkout = async (w: PacerWorkout) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'pacer_workouts', w.id as unknown as string), { done: !w.done });
  };

  const deleteWorkout = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'pacer_workouts', id));
  };

  return { workouts, addWorkout, toggleWorkout, deleteWorkout };
}