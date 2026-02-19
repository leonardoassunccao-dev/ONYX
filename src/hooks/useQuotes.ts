import { useState, useEffect } from 'react';
import { db as firestore } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Quote } from '../types';
import { DEFAULT_QUOTE_PACK } from '../data/defaultQuotes';

export function useQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [source, setSource] = useState<'firestore' | 'memory' | 'loading'>('loading');

  useEffect(() => {
    if (!user) {
      setQuotes(DEFAULT_QUOTE_PACK.map((q, i) => ({ 
        id: `default-${i}`, 
        ...q, 
        updatedAt: Date.now() 
      } as any)));
      setSource('memory');
      return;
    }

    const quotesRef = collection(firestore, 'users', user.uid, 'quotes');

    const unsub = onSnapshot(quotesRef, async (snap) => {
      if (snap.empty) {
        // 1. Try Seeding Firestore
        const metaRef = doc(firestore, 'users', user.uid, 'system', 'quotes_meta');
        try {
          const metaSnap = await getDoc(metaRef);
          if (!metaSnap.exists() || !metaSnap.data()?.seededQuotes) {
            console.log("Seeding default quotes to Firestore...");
            const batch = writeBatch(firestore);
            
            DEFAULT_QUOTE_PACK.forEach(q => {
              const newRef = doc(collection(firestore, 'users', user.uid, 'quotes'));
              batch.set(newRef, { ...q, updatedAt: Date.now() });
            });
            
            batch.set(metaRef, { seededQuotes: true }, { merge: true });
            await batch.commit();
            console.log("Seeding complete.");
            return; // Snapshot will update automatically
          }
        } catch (e) {
          console.error("Error seeding quotes:", e);
        }

        // 2. Fallback to Memory Constant
        setQuotes(DEFAULT_QUOTE_PACK.map((q, i) => ({ 
          id: `default-${i}`, 
          ...q, 
          updatedAt: Date.now() 
        } as any)));
        setSource('memory');
      } else {
        const qs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setQuotes(qs);
        setSource('firestore');
      }
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || quotes.length === 0) return;

    const checkDailyQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      const settingsRef = doc(firestore, 'users', user.uid, 'system', 'quotes_meta');
      
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
    await addDoc(collection(firestore, 'users', user.uid, 'quotes'), { text, author, isCustom: true, updatedAt: Date.now() });
  };

  const deleteQuote = async (id: any) => {
    if (!user) return;
    // Prevent deleting default memory quotes that aren't in DB
    if (typeof id === 'string' && id.startsWith('default-')) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'quotes', id));
  };

  return {
    quotes,
    dailyQuote,
    addQuote,
    deleteQuote,
    source
  };
}