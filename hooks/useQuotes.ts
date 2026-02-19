import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Quote } from '../types';
import { STARTER_QUOTES } from '../db';

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(collection(db, 'users', user.uid, 'quotes'), async (snap) => {
      if (snap.empty) {
        // Attempt to seed if empty
        const metaRef = doc(db, 'users', user.uid, 'system', 'quotes_meta');
        try {
          const metaSnap = await getDoc(metaRef);
          if (!metaSnap.exists() || !metaSnap.data()?.seededQuotes) {
            console.log("Seeding default quotes to Firestore...");
            const batch = writeBatch(db);
            
            STARTER_QUOTES.forEach(q => {
              const newRef = doc(collection(db, 'users', user.uid, 'quotes'));
              batch.set(newRef, { ...q, updatedAt: Date.now() });
            });
            
            batch.set(metaRef, { seededQuotes: true }, { merge: true });
            await batch.commit();
            console.log("Seeding complete.");
          }
        } catch (e) {
          console.error("Error seeding quotes:", e);
        }
      }

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
      
      try {
        const settingsSnap = await getDoc(settingsRef);
        let meta = settingsSnap.data() || { daily_quote_date: '', daily_quote_index: 0 };
        
        if (meta.daily_quote_date !== today) {
          meta.daily_quote_index = (meta.daily_quote_index + 1) % quotes.length;
          meta.daily_quote_date = today;
          await setDoc(settingsRef, meta, { merge: true });
        }

        const index = (typeof meta.daily_quote_index === 'number' && meta.daily_quote_index < quotes.length) 
          ? meta.daily_quote_index 
          : 0;
          
        setDailyQuote(quotes[index]);
      } catch (err) {
        console.warn("Error processing daily quote, falling back to simple index", err);
        const index = new Date().getDate() % quotes.length;
        setDailyQuote(quotes[index]);
      }
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