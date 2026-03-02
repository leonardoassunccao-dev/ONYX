import React, { useState, useEffect } from 'react';
import { Plus, CheckSquare, FileText, Target, DollarSign, Folder, X } from 'lucide-react';

interface QuickActionFABProps {
  onActionSelect: (actionId: string) => void;
}

const QuickActionFAB: React.FC<QuickActionFABProps> = ({ onActionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const actions = [
    { id: 'task', label: 'Nova Tarefa', icon: CheckSquare, shortcut: 'N' },
    { id: 'note', label: 'Nova Nota', icon: FileText, shortcut: 'T' },
    { id: 'goal', label: 'Nova Meta', icon: Target, shortcut: 'M' },
    { id: 'expense', label: 'Nova Despesa', icon: DollarSign, shortcut: 'D' },
    { id: 'project', label: 'Novo Projeto', icon: Folder, shortcut: 'P' },
  ];

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[99999] flex flex-col items-end">
      {/* Menu Options */}
      <div 
        className={`flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            className="flex items-center gap-3 bg-[#121214] border border-zinc-800 hover:border-[var(--accent-color)] text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:bg-[#1a1a1c] group"
            style={{ transitionDelay: `${(actions.length - index) * 30}ms` }}
            onClick={() => {
              onActionSelect(action.id);
              setIsOpen(false);
            }}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-400 group-hover:text-white transition-colors">
              {action.label}
            </span>
            <div className="bg-zinc-900 p-2 rounded-lg text-[var(--accent-color)]">
              <action.icon size={16} />
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 ${
          isOpen 
            ? 'bg-zinc-800 text-white rotate-45' 
            : 'bg-[var(--accent-color)] text-black hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'
        }`}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} strokeWidth={3} />}
      </button>
    </div>
  );
};

export default QuickActionFAB;
