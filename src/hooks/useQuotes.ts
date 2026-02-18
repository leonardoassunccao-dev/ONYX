import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { Quote } from '../types';

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!user) return;

    // Listen to Quotes
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'quotes'), (snap) => {
      const qs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setQuotes(qs);
    });

    return () => unsub();
  }, [user]);

  // Daily Quote Logic
  useEffect(() => {
    if (!user || quotes.length === 0) return;

    const checkDailyQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const settingsRef = doc(db, 'users', user.uid, 'system', 'quotes_meta');
      const settingsSnap = await getDoc(settingsRef);
      
      let meta = settingsSnap.data() || { daily_quote_date: '', daily_quote_index: 0 };
      
      if (meta.daily_quote_date !== today) {
        // Rotate
        meta.daily_quote_index = (meta.daily_quote_index + 1) % quotes.length;
        meta.daily_quote_date = today;
        await setDoc(settingsRef, meta, { merge: true });
      }

      const index = meta.daily_quote_index < quotes.length ? meta.daily_quote_index : 0;
      setDailyQuote(quotes[index]);
    };

    checkDailyQuote();
  }, [user, quotes]);

  const addQuote = async (text: string, author?: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'quotes'), { text, author, isCustom: true, updatedAt: Date.now() });
  };

  const deleteQuote = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'quotes', id));
  };

  return {
    quotes,
    dailyQuote,
    addQuote,
    deleteQuote
  };
}
