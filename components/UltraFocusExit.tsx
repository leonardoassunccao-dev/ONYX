import React from 'react';

interface UltraFocusExitProps {
  onExit: () => void;
}

const UltraFocusExit: React.FC<UltraFocusExitProps> = ({ onExit }) => {
  return (
    <button
      onClick={onExit}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: '12px',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        backgroundColor: '#000000',
        border: '1px solid #C9A227',
        color: '#C9A227',
        padding: '10px 16px',
        borderRadius: '2px',
        boxShadow: 'none',
        outline: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
      className="active:scale-95 transition-transform select-none"
      aria-label="Sair do Modo Foco"
    >
      <span className="text-[10px] font-black uppercase tracking-widest leading-none">
        SAIR
      </span>
    </button>
  );
};

export default UltraFocusExit;