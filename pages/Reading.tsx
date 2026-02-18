import React, { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import { Book, Settings } from '../types';
import Card from '../components/Card';
import GoalsSection from '../components/GoalsSection';
import { Plus, Trash2, BookOpen, Bookmark, Hash, Calendar, Flame } from 'lucide-react';

const ReadingPage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const { books, addBook, updateBook, deleteBook, logSession, getBookStats } = useBooks();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPagesTotal, setNewPagesTotal] = useState('');
  
  const [loggingBookId, setLoggingBookId] = useState<number | null>(null);
  const [logPages, setLogPages] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addBook(newTitle, newPagesTotal ? parseInt(newPagesTotal) : undefined);
    setNewTitle('');
    setNewPagesTotal('');
    setShowForm(false);
  };

  const handleLog = async (e: React.FormEvent, bookId: number) => {
    e.preventDefault();
    const p = parseInt(logPages);
    if (isNaN(p) || p <= 0) return;
    await logSession(bookId, p);
    setLogPages('');
    setLoggingBookId(null);
  };

  const activeBooks = books.filter(b => b.status === 'reading');
  const archiveBooks = books.filter(b => b.status !== 'reading');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Diretório Literário</h2>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Sincronizando com Core Local</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#C0C0C0] hover:bg-white text-[#0b0b0d] p-3 rounded-md transition-all">
          <Plus size={20} />
        </button>
      </header>

      {showForm && (
        <Card accentBorder title="Nova Operação de Leitura">
          <form onSubmit={handleAdd} className="space-y-4">
            <input 
              autoFocus
              type="text" 
              placeholder="TÍTULO DA OBRA"
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm font-bold uppercase tracking-widest"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <input 
              type="number" 
              placeholder="TOTAL DE PÁGINAS (OPCIONAL)"
              className="w-full bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm"
              value={newPagesTotal}
              onChange={e => setNewPagesTotal(e.target.value)}
            />
            <button type="submit" className="w-full bg-[#C0C0C0] text-[#0b0b0d] py-3 font-black tracking-widest rounded-md text-xs uppercase hover:bg-white transition-all">Ativar Protocolo</button>
          </form>
        </Card>
      )}

      <GoalsSection session="reading" />

      {/* ACTIVE OPERATIONS */}
      {activeBooks.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C0C0C0] animate-pulse" /> Operações Ativas
          </h3>
          {activeBooks.map(book => {
            const { pagesToday, streak, projection } = getBookStats(book);
            const goal = book.dailyPagesGoal || 0;
            const progressPercent = goal > 0 ? Math.min((pagesToday / goal) * 100, 100) : 0;

            return (
              <Card key={book.id} className="relative overflow-hidden group border-l-2 border-l-[#C0C0C0]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-4 rounded-md bg-[#121212] text-[#C0C0C0] border border-zinc-800">
                        <BookOpen size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-zinc-100 text-lg tracking-tight uppercase truncate">{book.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <select 
                            className="bg-transparent text-[10px] font-black uppercase text-zinc-500 border-none outline-none tracking-widest cursor-pointer hover:text-zinc-300"
                            value={book.status}
                            onChange={(e) => updateBook(book.id!, { status: e.target.value as any })}
                          >
                            <option value="reading">OPERACIONAL</option>
                            <option value="paused">PAUSADO</option>
                            <option value="done">CONCLUÍDO</option>
                          </select>
                          <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Streak: {streak}d</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       <div className="bg-[#0B0B0B] p-3 border border-zinc-800/50 rounded-md">
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Pág Atual</p>
                          <input 
                            type="number"
                            className="bg-transparent border-none outline-none text-sm text-zinc-100 font-bold w-full"
                            value={book.currentPage}
                            onChange={(e) => updateBook(book.id!, { currentPage: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                       <div className="bg-[#0B0B0B] p-3 border border-zinc-800/50 rounded-md">
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Meta Dia</p>
                          <input 
                            type="number"
                            className="bg-transparent border-none outline-none text-sm text-zinc-100 font-bold w-full"
                            value={book.dailyPagesGoal}
                            onChange={(e) => updateBook(book.id!, { dailyPagesGoal: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                       <div className="bg-[#0B0B0B] p-3 border border-zinc-800/50 rounded-md">
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Pág</p>
                          <input 
                            type="number"
                            className="bg-transparent border-none outline-none text-sm text-zinc-100 font-bold w-full"
                            value={book.pagesTotalOptional || ''}
                            placeholder="---"
                            onChange={(e) => updateBook(book.id!, { pagesTotalOptional: parseInt(e.target.value) || 0 })}
                          />
                       </div>
                    </div>
                  </div>

                  <div className="md:w-64 bg-[#121212] border border-zinc-800 rounded-lg p-4 flex flex-col justify-between">
                    {projection ? (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Estimativa de Término</p>
                        <p className="text-xl font-black text-[#C0C0C0] tracking-tighter">{projection.dateStr}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500">
                            <span>{pagesToday}/{goal} pág</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <div className="h-1 bg-[#0B0B0B] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C0C0C0] transition-all" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-600 font-bold uppercase leading-tight">Defina meta e total para ativar projeções.</p>
                    )}
                    <button 
                      onClick={() => setLoggingBookId(book.id!)}
                      className="mt-4 w-full bg-zinc-900 border border-zinc-800 py-2 rounded text-[10px] font-black uppercase tracking-[0.2em] text-[#C0C0C0] hover:bg-zinc-800"
                    >
                      Logar Leitura
                    </button>
                  </div>
                </div>

                {loggingBookId === book.id && (
                  <form onSubmit={(e) => handleLog(e, book.id!)} className="mt-4 pt-4 border-t border-zinc-800 flex gap-2 animate-in slide-in-from-top-2">
                    <input 
                      autoFocus
                      type="number" 
                      placeholder="PÁGINAS LIDAS AGORA"
                      className="flex-1 bg-[#0B0B0B] border border-zinc-800 rounded p-2 text-xs text-white focus:border-[#C0C0C0] outline-none"
                      value={logPages}
                      onChange={e => setLogPages(e.target.value)}
                    />
                    <button type="submit" className="bg-[#C0C0C0] text-[#0b0b0d] px-6 rounded text-[10px] font-black uppercase tracking-widest">Consolidar</button>
                    <button type="button" onClick={() => setLoggingBookId(null)} className="text-zinc-600 px-2 text-[10px] font-black">X</button>
                  </form>
                )}
              </Card>
            );
          })}
        </section>
      )}

      {/* ARCHIVE / QUEUE */}
      {archiveBooks.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">Arquivo / Reserva</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archiveBooks.map(book => (
              <div key={book.id} className="bg-[#0B0B0B] border border-[#1a1a1a] p-4 rounded-lg flex items-center gap-4 group">
                <div className="p-3 bg-zinc-900 text-zinc-700 rounded-md">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-zinc-400 text-sm truncate uppercase">{book.title}</h4>
                  <div className="flex gap-3 mt-1">
                    <select 
                      className="bg-transparent text-[8px] font-black uppercase text-zinc-600 outline-none"
                      value={book.status}
                      onChange={(e) => updateBook(book.id!, { status: e.target.value as any })}
                    >
                      <option value="reading">RETOMAR</option>
                      <option value="paused">PAUSADO</option>
                      <option value="done">CONCLUÍDO</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => deleteBook(book.id!)} className="opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-900 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {books.length === 0 && !showForm && (
        <div className="text-center py-24 bg-[#0B0B0B]/20 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center">
          <BookOpen size={48} className="text-zinc-800 mb-4" />
          <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Base Literária Offline.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-[#C0C0C0] text-[10px] font-black uppercase tracking-widest underline decoration-[#C0C0C0]/20 underline-offset-4">Adicionar Obra</button>
        </div>
      )}
    </div>
  );
};

export default ReadingPage;