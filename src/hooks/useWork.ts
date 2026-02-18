import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { WorkTask } from '../types';

export function useWork() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<WorkTask[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'work_tasks'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addTask = async (title: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'work_tasks'), {
      title,
      date: new Date().toISOString().split('T')[0],
      done: false,
      priority: 'med',
      updatedAt: Date.now()
    });
  };

  const toggleTask = async (task: WorkTask) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'work_tasks', task.id as string), { done: !task.done });
  };

  const deleteTask = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'work_tasks', id));
  };

  return { tasks, addTask, toggleTask, deleteTask };
}
