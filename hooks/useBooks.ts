import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Book, ReadingSession } from '../types';

export function useBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;

    const qBooks = query(collection(db, 'users', user.uid, 'books'), orderBy('createdAt', 'desc'));
    const unsubBooks = onSnapshot(qBooks, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    const unsubSessions = onSnapshot(collection(db, 'users', user.uid, 'reading_sessions'), (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    return () => { unsubBooks(); unsubSessions(); };
  }, [user]);

  const getBookStats = (book: Book) => {
    const bookSessions = sessions.filter(s => s.bookId === book.id);
    const pagesToday = bookSessions
      .filter(s => s.date === todayStr)
      .reduce((acc, s) => acc + s.pages, 0);

    const dates = Array.from(new Set(bookSessions.map(s => s.date))).sort().reverse();
    let streak = 0;
    if (dates.length > 0) {
      let cursor = new Date();
      let cStr = cursor.toISOString().split('T')[0];
      if (!dates.includes(cStr)) cursor.setDate(cursor.getDate() - 1);
      
      while (true) {
        const dStr = cursor.toISOString().split('T')[0];
        if (dates.includes(dStr)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
    }

    let projection = null;
    if (book.pagesTotalOptional && book.dailyPagesGoal && book.dailyPagesGoal > 0) {
      const remaining = Math.max(book.pagesTotalOptional - book.currentPage, 0);
      const days = Math.ceil(remaining / book.dailyPagesGoal);
      const d = new Date();
      d.setDate(d.getDate() + days);
      projection = { dateStr: d.toLocaleDateString('pt-BR'), days };
    }

    return { pagesToday, streak, projection };
  };

  const addBook = async (title: string, pagesTotal?: number) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, 'users', user.uid, 'books'), {
      title,
      status: 'reading',
      createdAt: Date.now(),
      pagesTotalOptional: pagesTotal,
      currentPage: 0,
      dailyPagesGoal: 10,
      startedAt: today
    });
  };

  const updateBook = async (id: any, data: Partial<Book>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'books', id), data);
  };

  const deleteBook = async (id: any) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'books', id));
  };

  const logSession = async (bookId: any, pages: number) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'reading_sessions'), {
      bookId,
      date: todayStr,
      pages,
      updatedAt: Date.now()
    });

    const book = books.find(b => b.id === bookId);
    if (book) {
      let newCurrent = (book.currentPage || 0) + pages;
      if (book.pagesTotalOptional) newCurrent = Math.min(newCurrent, book.pagesTotalOptional);
      await updateDoc(doc(db, 'users', user.uid, 'books', bookId), { currentPage: newCurrent });
    }
  };

  return {
    books,
    currentBook: books.find(b => b.status === 'reading'),
    addBook,
    updateBook,
    deleteBook,
    logSession,
    getBookStats
  };
}
