import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { StudySession } from '../types';

export function useStudy() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'study_sessions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addSession = async (data: any) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'study_sessions'), { ...data, updatedAt: Date.now() });
  };

  const deleteSession = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'study_sessions', id));
  };

  return { sessions, addSession, deleteSession };
}
