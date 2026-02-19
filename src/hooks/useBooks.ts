import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { Book, ReadingSession } from '../types';
import { safeAddDoc, safeDeleteDoc, safeUpdateDoc } from '../lib/firestoreSafe';

export function useBooks() {
  const { user, setGlobalError } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;

    // Path: users/{uid}/reading_books
    const qBooks = query(collection(db, 'users', user.uid, 'reading_books'), orderBy('createdAt', 'desc'));
    const unsubBooks = onSnapshot(qBooks, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    // Path: users/{uid}/reading_sessions
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
    if (!user) { setGlobalError("Login necessário"); return; }
    const today = new Date().toISOString().split('T')[0];
    const res = await safeAddDoc(collection(db, 'users', user.uid, 'reading_books'), {
      title,
      status: 'reading',
      pagesTotalOptional: pagesTotal,
      currentPage: 0,
      dailyPagesGoal: 10,
      startedAt: today
    });
    if (!res.success) setGlobalError(res.error || "Erro ao adicionar livro");
  };

  const updateBook = async (id: any, data: Partial<Book>) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeUpdateDoc(doc(db, 'users', user.uid, 'reading_books', id), data);
    if (!res.success) setGlobalError(res.error || "Erro ao atualizar livro");
  };

  const deleteBook = async (id: any) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    const res = await safeDeleteDoc(doc(db, 'users', user.uid, 'reading_books', id));
    if (!res.success) setGlobalError(res.error || "Erro ao deletar livro");
  };

  const logSession = async (bookId: any, pages: number) => {
    if (!user) { setGlobalError("Login necessário"); return; }
    
    // 1. Add Session
    const resSession = await safeAddDoc(collection(db, 'users', user.uid, 'reading_sessions'), {
      bookId,
      date: todayStr,
      pages
    });
    if (!resSession.success) {
        setGlobalError(resSession.error || "Erro ao logar sessão");
        return;
    }

    // 2. Update Book Progress
    const book = books.find(b => b.id === bookId);
    if (book) {
      let newCurrent = (book.currentPage || 0) + pages;
      if (book.pagesTotalOptional) newCurrent = Math.min(newCurrent, book.pagesTotalOptional);
      
      const resUpdate = await safeUpdateDoc(doc(db, 'users', user.uid, 'reading_books', bookId), { currentPage: newCurrent });
      if (!resUpdate.success) setGlobalError("Sessão salva, mas erro ao atualizar progresso do livro.");
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