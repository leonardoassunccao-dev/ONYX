import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export interface Project {
  id?: string;
  title: string;
  progress: number;
  tasks?: number;
  completed?: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: number;
  updatedAt: number;
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'projects'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project))));
    return () => unsub();
  }, [user]);

  const addProject = async (title: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'projects'), {
      title,
      progress: 0,
      tasks: 0,
      completed: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'projects', id), { ...data, updatedAt: Date.now() });
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'projects', id));
  };

  return { projects, addProject, updateProject, deleteProject };
}
