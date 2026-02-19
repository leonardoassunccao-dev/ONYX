import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Quote } from '../types';
import { safeAddDoc, safeDeleteDoc, safeSetDoc } from '../lib/firestoreSafe';

export function useQuotes() {
  const { user, setGlobalError } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!user) return;

    // users/{uid}/system/quotes
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'system', 'quotes'), (snap) => {
      const qs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setQuotes(qs);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || quotes.length === 0) return;

    const checkDailyQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const settingsRef = doc(db, 'users', user.uid, 'system', 'quotes_meta');
      const settingsSnap = await getDoc(settingsRef);
      
      let meta = settingsSnap.data() || { daily_quote_date: '', daily_quote_index: 0 };
      
      if (meta.daily_quote_date !== today) {
        meta.daily_quote_index = (meta.daily_quote_index + 1) % quotes.length;
        meta.daily_quote_date = today;
        await safeSetDoc(settingsRef, meta, { merge: true });
      }

      const index = meta.daily_quote_index < quotes.length ? meta.daily_quote_index : 0;
      setDailyQuote(quotes[index]);
    };

    checkDailyQuote();
  }, [user, quotes]);

  const addQuote = async (text: string, author?: string) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'system', 'quotes'), { text, author, isCustom: true });
    if (!res.success) setGlobalError(res.error || "Erro ao adicionar frase");
  };

  const deleteQuote = async (id: any) => {
    if (!user) return;
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'system', 'quotes', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar frase");
  };

  return {
    quotes,
    dailyQuote,
    addQuote,
    deleteQuote
  };
}