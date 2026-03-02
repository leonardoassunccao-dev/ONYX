import React, { useState, useEffect } from 'react';
import { X, CheckSquare, FileText, Target, Folder } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: string | null;
}

const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, initialAction }) => {
  const { user } = useAuth();
  const [action, setAction] = useState<string | null>(initialAction || 'task');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAction(initialAction || 'task');
      setTitle('');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, initialAction, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'task', label: 'Tarefa', icon: CheckSquare },
    { id: 'note', label: 'Nota', icon: FileText },
    { id: 'goal', label: 'Meta', icon: Target },
    { id: 'project', label: 'Projeto', icon: Folder },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setIsSubmitting(true);
    try {
      if (action === 'task') {
        await addDoc(collection(db, 'users', user.uid, 'work_tasks'), {
          title: title.trim(),
          date: new Date().toISOString().split('T')[0],
          done: false,
          priority: 'med',
          updatedAt: Date.now()
        });
      } else if (action === 'note') {
        await addDoc(collection(db, 'users', user.uid, 'notes'), {
          title: title.trim(),
          content: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } else if (action === 'goal') {
        await addDoc(collection(db, 'users', user.uid, 'session_goals'), {
          title: title.trim(),
          session: 'general',
          type: 'daily',
          metricType: 'boolean',
          targetValue: 1,
          createdAt: Date.now(),
          done: false,
          active: true
        });
      } else if (action === 'project') {
        await addDoc(collection(db, 'users', user.uid, 'projects'), {
          title: title.trim(),
          progress: 0,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving quick action:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B0B0D] border border-zinc-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Nova Entrada</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {actions.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAction(a.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  action === a.id 
                    ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)] text-[var(--accent-color)]' 
                    : 'bg-[#121214] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <a.icon size={14} />
                {a.label}
              </button>
            ))}
          </div>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Título da ${actions.find(a => a.id === action)?.label.toLowerCase()}...`}
              className="w-full bg-transparent border-b border-zinc-800 pb-2 text-lg text-white outline-none focus:border-[var(--accent-color)] transition-colors placeholder:text-zinc-700"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[var(--accent-color)] text-black px-6 py-3 rounded font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickActionModal;
