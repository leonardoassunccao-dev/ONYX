import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Book, ReadingSession } from '../types';

export function useBooks() {
  const books = useLiveQuery(() => db.books.orderBy('createdAt').reverse().toArray()) || [];
  const sessions = useLiveQuery(() => db.reading_sessions.toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const getBookStats = (book: Book) => {
    const bookSessions = sessions.filter(s => s.bookId === book.id);
    const pagesToday = bookSessions
      .filter(s => s.date === todayStr)
      .reduce((acc, s) => acc + s.pages, 0);

    // Streak logic
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

    // Projection
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
    const today = new Date().toISOString().split('T')[0];
    const newBookId = await db.books.add({
      title,
      status: 'reading',
      createdAt: Date.now(),
      pagesTotalOptional: pagesTotal,
      currentPage: 0,
      dailyPagesGoal: 10,
      startedAt: today
    });
    console.log("BOOK SAVED", newBookId);
    return newBookId;
  };

  const updateBook = async (id: number, data: Partial<Book>) => {
    return await db.books.update(id, data);
  };

  const deleteBook = async (id: number) => {
    if (!id) return;
    await db.books.delete(id);
    await db.reading_sessions.where('bookId').equals(id).delete();
  };

  const logSession = async (bookId: number, pages: number) => {
    const book = await db.books.get(bookId);
    if (!book) return;

    await db.reading_sessions.add({
      bookId,
      date: todayStr,
      pages
    });

    let newCurrent = (book.currentPage || 0) + pages;
    if (book.pagesTotalOptional) newCurrent = Math.min(newCurrent, book.pagesTotalOptional);
    
    await db.books.update(bookId, { currentPage: newCurrent });
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
