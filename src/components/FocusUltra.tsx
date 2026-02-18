import React from 'react';

interface FocusUltraProps {
  onExit: () => void;
}

const FocusUltra: React.FC<FocusUltraProps> = ({ onExit }) => {
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-black mb-8">FOCUS MODE</h1>
      <button 
        onClick={onExit}
        className="px-6 py-2 border border-zinc-700 rounded text-xs uppercase tracking-widest hover:bg-zinc-900"
      >
        Exit
      </button>
    </div>
  );
};

export default FocusUltra;