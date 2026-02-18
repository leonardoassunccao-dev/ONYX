import React, { useState } from 'react';
import { Settings } from '../types';
import Card from '../components/Card';
import { Plus, CheckCircle2, Circle, Trash2, Briefcase } from 'lucide-react';
import { useWork } from '../hooks/useWork';

const WorkPage: React.FC<{ settings: Settings }> = ({ settings }) => {
  const { tasks, addTask, toggleTask, deleteTask } = useWork();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    await addTask(newTitle);
    setNewTitle('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#E8E8E8] tracking-widest uppercase">Operações</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#C0C0C0] hover:bg-[#D4D4D8] text-[#0b0b0d] p-3 rounded-md transition-all">
          <Plus size={20} />
        </button>
      </header>

      {showForm && (
        <Card accentBorder title="Nova Diretriz Operacional">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Objetivo da Missão"
              className="flex-1 bg-[#121212] border border-zinc-800 rounded-md p-3 text-white focus:border-[#C0C0C0] outline-none text-sm font-bold"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <button type="submit" className="bg-[#C0C0C0] text-[#0b0b0d] px-6 font-black tracking-widest rounded-md text-xs uppercase hover:bg-[#D4D4D8]">Add</button>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="bg-[#0B0B0B] border border-[#1a1a1a] p-4 rounded-lg flex items-center gap-4 group transition-all hover:border-[#C0C0C0]/20">
            <button onClick={() => toggleTask(task)} className="text-[#C0C0C0]">
              {task.done ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-zinc-700" />}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-zinc-200 truncate text-sm tracking-tight ${task.done ? 'line-through text-zinc-600' : ''}`}>{task.title}</h4>
              <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">{task.date}</p>
            </div>
            <button onClick={() => deleteTask(task.id!)} className="opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-900 transition-all">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkPage;
