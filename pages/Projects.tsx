import React, { useState } from 'react';
import { Folder, Plus, CheckSquare, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';

const ProjectsPage: React.FC = () => {
  const { projects, addProject, deleteProject } = useProjects();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      await addProject(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Folder className="text-[var(--accent-color)]" size={32} />
            Projetos
          </h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium tracking-wide">Gerenciamento de iniciativas complexas</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-[var(--accent-color)] text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors"
        >
          <Plus size={16} /> Novo Projeto
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#0B0B0D] border border-zinc-800 p-6 rounded-xl flex gap-4 animate-in slide-in-from-top-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nome do projeto..."
            className="flex-1 bg-transparent border-b border-zinc-800 pb-2 text-white outline-none focus:border-[var(--accent-color)] transition-colors"
            autoFocus
          />
          <button type="submit" className="bg-[var(--accent-color)] text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
            Adicionar
          </button>
          <button type="button" onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition-colors">
            Cancelar
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-zinc-800 border-dashed rounded-xl">
            <Folder size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Nenhum projeto ativo no momento.</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="bg-[#0B0B0D] border border-zinc-800 p-6 rounded-xl hover:border-[var(--accent-color)]/50 transition-colors group flex flex-col justify-between relative">
              <button 
                onClick={() => deleteProject(project.id!)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <div>
                <div className="flex items-start justify-between mb-4 pr-8">
                  <h3 className="text-xl font-bold text-white group-hover:text-[var(--accent-color)] transition-colors">{project.title}</h3>
                  <span className="text-2xl font-mono font-bold text-white">{project.progress}%</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium mb-6">
                  <span className="flex items-center gap-1"><CheckSquare size={14} /> {project.completed || 0}/{project.tasks || 0} Tarefas</span>
                  <span className="flex items-center gap-1 text-[var(--accent-color)]"><AlertCircle size={14} /> Em andamento</span>
                </div>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-color)] transition-all duration-1000" 
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
