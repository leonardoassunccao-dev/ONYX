import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, FileText, Target, Folder, DollarSign } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-200">
      <div className="bg-[#0B0B0D] border border-zinc-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-center px-4 py-4 border-b border-zinc-800">
          <Search size={20} className="text-zinc-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar tarefas, notas, projetos..."
            className="flex-1 bg-transparent text-white text-lg outline-none placeholder:text-zinc-600"
          />
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-2 max-h-[60vh] overflow-y-auto">
          {query.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">
              <p className="text-sm font-medium mb-4">Busca Global ONYX</p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">Tarefas</span>
                <span className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">Notas</span>
                <span className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">Projetos</span>
                <span className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800">Metas</span>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">
              Nenhum resultado encontrado para "{query}"
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-[#050505] border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          <div className="flex items-center gap-4">
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">↑↓</kbd> Navegar</span>
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">↵</kbd> Selecionar</span>
          </div>
          <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">ESC</kbd> Fechar</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
