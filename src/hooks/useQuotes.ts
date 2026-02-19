import { useState, useEffect } from 'react';
import { db as firestore } from '../lib/firebase';
import { db as localDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { Quote } from '../types';
import { DEFAULT_QUOTE_PACK } from '../data/defaultQuotes';

export function useQuotes() {
  const { user } = useAuth();
  
  // 1. Initialize with DEFAULT_QUOTE_PACK immediately to prevent loading state
  const [quotes, setQuotes] = useState<Quote[]>(() => 
    DEFAULT_QUOTE_PACK.map((q, i) => ({ 
      id: `def-${i}`, 
      text: q.text, 
      author: q.author, 
      isCustom: false,
      updatedAt: Date.now() 
    }))
  );
  
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [source, setSource] = useState<'default' | 'local' | 'cloud'>('default');

  useEffect(() => {
    if (!user) return;

    // Listen to Firestore
    const unsub = onSnapshot(collection(firestore, 'users', user.uid, 'quotes'), async (snap) => {
      if (!snap.empty) {
        // Firestore has data
        const qs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        setQuotes(qs);
        setSource('cloud');
      } else {
        // Firestore empty -> Try Dexie (Local DB)
        try {
          const localQuotes = await localDb.quotes.toArray();
          if (localQuotes.length > 0) {
            setQuotes(localQuotes);
            setSource('local');
          } else {
            // Dexie empty -> Use Default Pack
            setQuotes(DEFAULT_QUOTE_PACK.map((q, i) => ({ 
              id: `def-${i}`, 
              text: q.text, 
              author: q.author, 
              isCustom: false,
              updatedAt: Date.now() 
            })));
            setSource('default');
          }
        } catch (e) {
          console.warn("Error fallback to Dexie, using default pack", e);
          setSource('default');
        }
      }
    });

    return () => unsub();
  }, [user]);

  // Daily Quote Logic
  useEffect(() => {
    if (quotes.length === 0) return;

    const checkDailyQuote = async () => {
      // Logic for Cloud Source (synced daily index)
      if (source === 'cloud' && user) {
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
        } catch (e) {
          // Fallback if metadata read fails
          const index = new Date().getDate() % quotes.length;
          setDailyQuote(quotes[index]);
        }
      } else {
        // Deterministic logic for Local/Default (Day of Year)
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const index = dayOfYear % quotes.length;
        setDailyQuote(quotes[index]);
      }
    };

    checkDailyQuote();
  }, [quotes, source, user]);

  const addQuote = async (text: string, author?: string) => {
    if (!user) return;
    await addDoc(collection(firestore, 'users', user.uid, 'quotes'), { text, author, isCustom: true, updatedAt: Date.now() });
  };

  const deleteQuote = async (id: any) => {
    if (!user) return;
    if (typeof id === 'string' && id.startsWith('def-')) return; // Prevent deleting defaults
    await deleteDoc(doc(firestore, 'users', user.uid, 'quotes', id));
  };

  return {
    quotes,
    dailyQuote: dailyQuote || quotes[0],
    addQuote,
    deleteQuote,
    source
  };
}