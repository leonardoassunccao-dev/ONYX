import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { StudySession } from '../types';
import { safeAddDoc, safeDeleteDoc } from '../lib/firestoreSafe';

export function useStudy() {
  const { user, setGlobalError } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (!user) return;
    // Path: users/{uid}/study_sessions
    const q = query(collection(db, 'users', user.uid, 'study_sessions'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any))));
    return () => unsub();
  }, [user]);

  const addSession = async (data: any) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'study_sessions'), data);
    if (!res.success) setGlobalError(res.error || "Erro ao logar estudos");
  };

  const deleteSession = async (id: any) => {
    if (!user) return;
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'study_sessions', id));
    if (!res.success) setGlobalError(res.error || "Erro ao remover sessão");
  };

  return { sessions, addSession, deleteSession };
}