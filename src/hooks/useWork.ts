import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { WorkTask } from '../types';
import { safeAddDoc, safeDeleteDoc, safeUpdateDoc } from '../lib/firestoreSafe';

export function useWork() {
  const { user, setGlobalError } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);

  useEffect(() => {
    if (!user) return;
    // Path: users/{uid}/work_items
    const q = query(collection(db, 'users', user.uid, 'work_items'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addTask = async (title: string) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'work_items'), {
      title,
      date: new Date().toISOString().split('T')[0],
      done: false,
      priority: 'med'
    });
    if (!res.success) setGlobalError(res.error || "Erro ao criar tarefa");
  };

  const toggleTask = async (task: WorkTask) => {
    if (!user) return;
    const res = await safeUpdateDoc(doc(db, 'users', user.uid, 'work_items', task.id as unknown as string), { done: !task.done });
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar tarefa");
  };

  const deleteTask = async (id: any) => {
    if (!user) return;
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'work_items', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar tarefa");
  };

  return { tasks, addTask, toggleTask, deleteTask };
}