import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Quote } from '../types';

export function useQuotes() {
  const quotes = useLiveQuery(() => db.quotes.toArray()) || [];
  
  // Logic to get the Quote of the Day (Read Only)
  const dailyQuote = useLiveQuery(async () => {
    const allQuotes = await db.quotes.toArray();
    if (allQuotes.length === 0) return null;

    const storedIndex = await db.app_state.get('daily_quote_index');
    let currentIndex = storedIndex?.value || 0;
    
    // Ensure index is within bounds (in case quotes were deleted)
    if (currentIndex >= allQuotes.length) {
        currentIndex = 0;
    }

    return allQuotes[currentIndex];
  }, [quotes.length]); // Re-run if quotes list changes (e.g. deletion) or app_state updates

  // Logic to rotate the quote if it's a new day (Write Operation)
  useEffect(() => {
    const checkAndRotateDay = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Transaction ensures we read and update atomically without race conditions
        await (db as any).transaction('rw', [db.app_state, db.quotes], async () => {
            const storedDate = await db.app_state.get('daily_quote_date');
            
            // If date is missing or different from today
            if (!storedDate || storedDate.value !== today) {
                const allQuotes = await db.quotes.toArray();
                if (allQuotes.length === 0) return;

                const storedIndex = await db.app_state.get('daily_quote_index');
                let currentIndex = storedIndex?.value || 0;

                // Rotate index
                currentIndex = (currentIndex + 1) % allQuotes.length;
                
                // Update state
                await db.app_state.put({ key: 'daily_quote_date', value: today });
                await db.app_state.put({ key: 'daily_quote_index', value: currentIndex });
            }
        });
      } catch (error) {
        console.error("Failed to rotate daily quote:", error);
      }
    };

    checkAndRotateDay();
  }, []); // Run once on mount

  const addQuote = async (text: string, author?: string) => {
    await db.quotes.add({ text, author, isCustom: true });
  };

  const deleteQuote = async (id: number) => {
    await db.quotes.delete(id);
  };

  return {
    quotes,
    dailyQuote,
    addQuote,
    deleteQuote
  };
}