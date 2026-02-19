import React from 'react';
import { Settings } from '../types';

const RoutinePage: React.FC<{ settings: Settings }> = () => {
  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Routine Ops</h2>
      <p className="text-zinc-500 text-xs">Module under construction.</p>
    </div>
  );
};

export default RoutinePage;